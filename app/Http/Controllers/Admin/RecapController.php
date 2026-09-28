<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicClass;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\DailyAssessment;
use App\Models\StudentScore;
use App\Models\ClassAgenda;
use App\Models\StudentConsultation;
use App\Models\Subject;
use App\Models\Semester;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Setting;

use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Http\Controllers\Concerns\ResolvesActiveSemester;

class RecapController extends Controller
{
    use ResolvesActiveSemester, HasSchoolScope;

    public function index()
    {
        $classes = AcademicClass::withoutGlobalScope('active_year')->with('academicYear')->get();
        $subjects = Subject::with(['academicClasses' => function($q) {
            $q->withoutGlobalScope('active_year');
        }])->orderBy('name')->get();
        $semesters = Semester::with('academicYear')
            ->get()
            ->map(function($sem) {
                return [
                    'id' => $sem->id,
                    'name' => 'TA ' . $sem->academicYear->name . ' - ' . $sem->name,
                    'start_date' => $sem->start_date,
                    'end_date' => $sem->end_date,
                    'is_active' => $sem->is_active,
                    'academic_year_id' => $sem->academic_year_id,
                ];
            });
        $activeSemester = $this->getActiveSemester();
        $teachers = \App\Models\User::role(['Guru', 'Wali Kelas', 'Super Admin'])
            ->when($this->schoolId(), fn($q) => $q->where('users.school_id', $this->schoolId()))
            ->orderBy('name')
            ->get(['id', 'name']);
        
        return Inertia::render('Admin/Reports/Index', [
            'classes' => $classes,
            'subjects' => $subjects,
            'semesters' => $semesters,
            'teachers' => $teachers,
            'activeSemesterId' => $activeSemester?->id,
        ]);
    }

    private function resolveSemesterDates(Request $request)
    {
        // Jika frontend sudah mengirimkan start_date dan end_date spesifik (misal dari filter bulan),
        // jangan ditimpa dengan tanggal awal/akhir satu semester penuh.
        if ($request->filled('start_date') && $request->filled('end_date')) {
            return;
        }

        if ($request->filled('semester_id')) {
            $sem = Semester::find($request->semester_id);
            if ($sem) {
                // Cast ke string Y-m-d karena Semester cast start_date/end_date sebagai Carbon
                $request->merge([
                    'start_date' => $sem->start_date->format('Y-m-d'),
                    'end_date'   => $sem->end_date->format('Y-m-d'),
                ]);
            }
        } elseif (!$request->filled('start_date') || !$request->filled('end_date')) {
            // Jika salah satu tanggal kosong/tidak ada, fallback ke semester aktif
            $activeSem = $this->getActiveSemester();
            if ($activeSem) {
                $request->merge([
                    'semester_id' => $activeSem->id,
                    'start_date'  => $activeSem->start_date->format('Y-m-d'),
                    'end_date'    => $activeSem->end_date->format('Y-m-d'),
                ]);
            }
        }
    }

    /**
     * Ambil AcademicClass berdasarkan ID, bypass global scope active_year.
     * Diperlukan agar kelas dari tahun ajaran arsip tetap bisa ditemukan.
     */
    private function findClass($classId): ?AcademicClass
    {
        return AcademicClass::withoutGlobalScope('active_year')->find($classId);
    }



    // --- Attendance Recap ---
    public function attendanceData(Request $request)
    {
        $this->resolveSemesterDates($request);

        $request->validate([
            'academic_class_id' => 'required',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $classId = $request->academic_class_id;
        $start = Carbon::parse($request->start_date)->startOfDay();
        $end = Carbon::parse($request->end_date)->endOfDay();

        if ($classId === 'all') {
            // Tentukan tahun ajaran dari semester yang diminta (bisa arsip),
            // bukan selalu dari semester aktif saat ini.
            $targetAcademicYearId = null;
            if ($request->filled('semester_id')) {
                $requestedSem = Semester::find($request->semester_id);
                $targetAcademicYearId = $requestedSem?->academic_year_id;
            }
            if (!$targetAcademicYearId) {
                $activeSem = $this->getActiveSemester();
                $targetAcademicYearId = $activeSem?->academic_year_id;
            }

            $classesQuery = AcademicClass::withoutGlobalScope('active_year')->query();
            if ($targetAcademicYearId) {
                $classesQuery->where('academic_year_id', $targetAcademicYearId);
            }
            $classes = $classesQuery->get();
            $classIds = $classes->pluck('id')->toArray();

            // Fallback strategy untuk data lama: cari dari schedule_id, class_agenda_id, atau student_id
            $students = Student::with(['academicClasses' => function($q) {
                $q->withoutGlobalScope('active_year');
            }])
            ->whereHas('academicClasses', function($q) use ($classIds) {
                $q->withoutGlobalScope('active_year')->whereIn('academic_classes.id', $classIds);
            })->orderBy('name')->get();
            $studentIds = $students->pluck('id')->toArray();

            // Sangat sederhana: Ambil semua absensi milik siswa-siswa ini di rentang tanggal tersebut
            $attendances = StudentAttendance::whereBetween('date', [$start, $end])
                ->whereIn('student_id', $studentIds)
                ->get();

            $dates = $attendances->pluck('date')->map(function($d) {
                return Carbon::parse($d)->format('Y-m-d');
            })->unique()->sort()->values()->toArray();

        } else {
            $students = Student::with(['academicClasses' => function($q) {
                $q->withoutGlobalScope('active_year');
            }])
            ->whereHas('academicClasses', function($q) use ($classId) {
                $q->withoutGlobalScope('active_year')->where('academic_classes.id', $classId);
            })->orderBy('name')->get();
            $studentIds = $students->pluck('id')->toArray();

            // Sangat sederhana: Ambil semua absensi milik siswa-siswa ini di rentang tanggal tersebut
            $attendances = StudentAttendance::whereBetween('date', [$start, $end])
                ->whereIn('student_id', $studentIds)
                ->get();

            $dates = $attendances->pluck('date')->map(function($d) {
                return Carbon::parse($d)->format('Y-m-d');
            })->unique()->sort()->values()->toArray();
        }

        $report = [];
        foreach ($students as $student) {
            $studentAtts = $attendances->where('student_id', $student->id);
            
            $daily = [];
            foreach ($dates as $date) {
                $dayEntries = $studentAtts->filter(function($item) use ($date) {
                    return Carbon::parse($item->date)->format('Y-m-d') === $date;
                });
                $daily[$date] = $dayEntries->isNotEmpty() 
                    ? \App\Models\StudentAttendance::getDailyStatusFromAttendances($dayEntries) 
                    : '-';
            }

            $groupedByDate = $studentAtts->groupBy(function($item) {
                return Carbon::parse($item->date)->format('Y-m-d');
            });

            $summary = ['hadir' => 0, 'sakit' => 0, 'izin' => 0, 'alpha' => 0, 'terlambat' => 0];
            foreach ($groupedByDate as $dateStr => $dayEntries) {
                $status = \App\Models\StudentAttendance::getDailyStatusFromAttendances($dayEntries);
                if (array_key_exists($status, $summary)) {
                    $summary[$status]++;
                }
            }

            $report[] = [
                'id' => $student->id,
                'name' => $student->name,
                'class_name' => $student->academic_class ? $student->academic_class->name : '',
                'daily' => $daily,
                'summary' => $summary
            ];
        }

        return response()->json([
            'dates' => $dates,
            'report' => $report,
            'class' => $classId === 'all' ? 'Semua Kelas' : ($this->findClass($classId)?->name ?? '-'),
            'range' => $start->format('d M Y') . ' - ' . $end->format('d M Y')
        ]);
    }

    // --- Attendance Recap (Per Subject) ---
    public function attendanceSubjectData(Request $request)
    {
        $this->resolveSemesterDates($request);

        $request->validate([
            'academic_class_id' => 'required|exists:academic_classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $classId = $request->academic_class_id;
        $subjectId = $request->subject_id;
        $start = Carbon::parse($request->start_date)->startOfDay();
        $end = Carbon::parse($request->end_date)->endOfDay();

        $subject = \App\Models\Subject::find($subjectId);
        $subjectName = $subject ? $subject->name : '';

        // Ambil agenda kelas yang sesuai subject, dukung juga data lama via schedule
        $agendas = ClassAgenda::where('subject_id', $subjectId)
            ->whereBetween('date', [$start, $end])
            ->pluck('id')->toArray();
            
        $scheduleIds = \App\Models\Schedule::where('subject', $subjectName)->pluck('id')->toArray();

        $students = Student::with(['academicClasses' => function($q) {
            $q->withoutGlobalScope('active_year');
        }])
        ->whereHas('academicClasses', function($q) use ($classId) {
            $q->withoutGlobalScope('active_year')->where('academic_classes.id', $classId);
        })->orderBy('name')->get();
        
        $studentIds = $students->pluck('id')->toArray();

        $attendances = StudentAttendance::whereBetween('date', [$start, $end])
            ->whereIn('student_id', $studentIds)
            ->where(function($q) use ($agendas, $scheduleIds) {
                $q->whereIn('class_agenda_id', $agendas)
                  ->orWhereIn('schedule_id', $scheduleIds);
            })->get();

        $dates = $attendances->pluck('date')->map(function($d) {
            return Carbon::parse($d)->format('Y-m-d');
        })->unique()->sort()->values()->toArray();

        $report = [];
        foreach ($students as $student) {
            $studentAtts = $attendances->where('student_id', $student->id);
            
            $daily = [];
            foreach ($dates as $date) {
                $dayEntries = $studentAtts->filter(function($item) use ($date) {
                    return Carbon::parse($item->date)->format('Y-m-d') === $date;
                });
                $daily[$date] = $dayEntries->isNotEmpty() 
                    ? \App\Models\StudentAttendance::getDailyStatusFromAttendances($dayEntries) 
                    : '-';
            }

            $groupedByDate = $studentAtts->groupBy(function($item) {
                return Carbon::parse($item->date)->format('Y-m-d');
            });

            $summary = ['hadir' => 0, 'sakit' => 0, 'izin' => 0, 'alpha' => 0, 'terlambat' => 0];
            foreach ($groupedByDate as $dateStr => $dayEntries) {
                $status = \App\Models\StudentAttendance::getDailyStatusFromAttendances($dayEntries);
                if (array_key_exists($status, $summary)) {
                    $summary[$status]++;
                }
            }

            $report[] = [
                'id' => $student->id,
                'name' => $student->name,
                'daily' => $daily,
                'summary' => $summary
            ];
        }

        $subjectName = Subject::find($subjectId)->name;

        return response()->json([
            'dates' => $dates,
            'report' => $report,
            'class' => $this->findClass($classId)?->name ?? '-',
            'subject' => $subjectName,
            'range' => $start->format('d M Y') . ' - ' . $end->format('d M Y')
        ]);
    }

    // --- Assessments Recap (Detailed) ---
    public function assessmentData(Request $request)
    {
        $this->resolveSemesterDates($request);

        $request->validate([
            'academic_class_id' => 'required|exists:academic_classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $start = Carbon::parse($request->start_date)->startOfDay();
        $end = Carbon::parse($request->end_date)->endOfDay();

        $assessments = DailyAssessment::where('academic_class_id', $request->academic_class_id)
            ->where('subject_id', $request->subject_id)
            ->whereBetween('date', [$start, $end])
            ->with(['scores.student'])
            ->orderBy('date')
            ->get()
            ->map(function($a) {
                $a->date_formatted = $a->date->format('Y-m-d');
                return $a;
            });

        return response()->json([
            'assessments' => $assessments,
            'range' => $start->format('d M Y') . ' - ' . $end->format('d M Y')
        ]);
    }

    // --- Agendas Recap ---
    public function agendaData(Request $request)
    {
        $this->resolveSemesterDates($request);

        $request->validate([
            'academic_class_id' => 'required|exists:academic_classes,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'teacher_id' => 'nullable',
            'teacher_ids' => 'nullable',
        ]);

        $query = ClassAgenda::where('academic_class_id', $request->academic_class_id)
            ->whereBetween('date', [$request->start_date, $request->end_date]);

        if ($request->filled('teacher_ids')) {
            $teacherIds = is_array($request->teacher_ids) 
                ? $request->teacher_ids 
                : explode(',', $request->teacher_ids);
            $query->whereIn('teacher_id', $teacherIds);
        } elseif ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        $agendas = $query->with(['teacher', 'subject'])
            ->orderBy('date')
            ->get();

        return response()->json($agendas);
    }

    // --- Consultations Recap ---
    public function consultationData(Request $request)
    {
        $this->resolveSemesterDates($request);

        $request->validate([
            'academic_class_id' => 'nullable|exists:academic_classes,id',
            'student_id' => 'nullable|exists:students,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $query = StudentConsultation::whereBetween('consultation_date', [$request->start_date, $request->end_date])
            ->with(['student', 'homeroomTeacher', 'academicClass']);

        if ($request->academic_class_id) {
            $query->where('class_id', $request->academic_class_id);
        }

        $consultations = $query->orderBy('consultation_date')->get()->map(function($c) {
            $c->date_formatted = Carbon::parse($c->consultation_date)->format('Y-m-d');
            return $c;
        });

        return response()->json($consultations);
    }

    // --- Export Methods ---
    public function attendanceExport(Request $request)
    {
        $this->resolveSemesterDates($request);
        $classId = $request->academic_class_id;

        if ($classId === 'all') {
            // Tentukan tahun ajaran dari semester yang diminta (bisa arsip)
            $targetAcademicYearId = null;
            if ($request->filled('semester_id')) {
                $requestedSem = Semester::find($request->semester_id);
                $targetAcademicYearId = $requestedSem?->academic_year_id;
            }
            if (!$targetAcademicYearId) {
                $activeSem = $this->getActiveSemester();
                $targetAcademicYearId = $activeSem?->academic_year_id;
            }
            $classesQuery = AcademicClass::withoutGlobalScope('active_year')->query();
            if ($targetAcademicYearId) {
                $classesQuery->where('academic_year_id', $targetAcademicYearId);
            }
            $classes = $classesQuery->get();

            $sheetsData = [];
            foreach ($classes as $class) {
                $mockRequest = new Request($request->all());
                $mockRequest->merge(['academic_class_id' => $class->id]);
                
                $classData = $this->attendanceData($mockRequest)->getData(true);
                if (count($classData['report']) > 0) {
                    $sheetsData[] = $classData;
                }
            }

            if (empty($sheetsData)) {
                $mockRequest = new Request($request->all());
                $mockRequest->merge(['academic_class_id' => $classes->first()->id ?? 0]);
                $sheetsData[] = $this->attendanceData($mockRequest)->getData(true);
            }

            return Excel::download(new \App\Exports\AttendanceMultiClassRecapExport($sheetsData), 'rekap_absensi_semua_kelas.xlsx');
        } else {
            $data = $this->attendanceData($request)->getData(true);
            return Excel::download(new \App\Exports\AttendanceRecapExport($data), 'rekap_absensi.xlsx');
        }
    }

    public function attendanceSubjectExport(Request $request)
    {
        $this->resolveSemesterDates($request);
        $data = $this->attendanceSubjectData($request)->getData(true);
        return Excel::download(new \App\Exports\AttendanceSubjectRecapExport($data), 'rekap_absensi_mapel.xlsx');
    }

    public function assessmentExport(Request $request)
    {
        $this->resolveSemesterDates($request);
        $data = $this->assessmentData($request)->getData(true);
        
        $subject = \App\Models\Subject::find($request->subject_id);
        $class = $this->findClass($request->academic_class_id);
        $teacherName = auth()->user() ? auth()->user()->name : 'Guru';
        
        $meta = [
            'school_name' => Setting::get('school_name', 'SALIRA ACADEMY'),
            'class_name' => $class ? $class->name : 'Semua Kelas',
            'subject_name' => $subject ? $subject->name : 'Semua Mapel',
            'range' => $data['range'],
            'teacher_name' => $teacherName
        ];
        
        return Excel::download(new \App\Exports\AssessmentRecapExport($data, $meta), 'rekap_asesmen.xlsx');
    }

    public function agendaExport(Request $request)
    {
        $this->resolveSemesterDates($request);
        $agendas = $this->agendaData($request)->getData(true);
        
        $matrix = null;
        if ($request->academic_class_id && $request->start_date && $request->end_date) {
            $matrix = $this->attendanceData($request)->getData(true);
        }
        
        $class = $this->findClass($request->academic_class_id);
        
        $teacherName = 'Semua Guru';
        if ($request->filled('teacher_ids')) {
            $teacherIds = is_array($request->teacher_ids) 
                ? $request->teacher_ids 
                : explode(',', $request->teacher_ids);
            $selectedTeachers = \App\Models\User::whereIn('id', $teacherIds)->pluck('name')->toArray();
            if (!empty($selectedTeachers)) {
                $teacherName = implode(', ', $selectedTeachers);
            }
        } elseif ($request->filled('teacher_id')) {
            $selectedTeacher = \App\Models\User::find($request->teacher_id);
            if ($selectedTeacher) {
                $teacherName = $selectedTeacher->name;
            }
        }
        
        $meta = [
            'school_name' => Setting::get('school_name', 'SALIRA ACADEMY'),
            'class_name' => $class ? $class->name : 'Semua Kelas',
            'range' => Carbon::parse($request->start_date)->format('d/m/Y') . ' - ' . Carbon::parse($request->end_date)->format('d/m/Y'),
            'teacher_name' => $teacherName
        ];
        
        return Excel::download(new \App\Exports\AgendaRecapExport($agendas, $matrix, $meta), 'rekap_jurnal_mengajar.xlsx');
    }

    public function consultationExport(Request $request)
    {
        $this->resolveSemesterDates($request);
        $consultations = $this->consultationData($request)->getData(true);
        
        $class = $request->academic_class_id ? $this->findClass($request->academic_class_id) : null;
        $teacherName = auth()->user() ? auth()->user()->name : 'Guru Wali/BK';
        
        $meta = [
            'school_name' => Setting::get('school_name', 'SALIRA ACADEMY'),
            'class_name' => $class ? $class->name : 'Semua Kelas',
            'range' => Carbon::parse($request->start_date)->format('d/m/Y') . ' - ' . Carbon::parse($request->end_date)->format('d/m/Y'),
            'teacher_name' => $teacherName
        ];
        
        return Excel::download(new \App\Exports\ConsultationRecapExport($consultations, $meta), 'rekap_bimbingan_siswa.xlsx');
    }

    // --- PDF Exports ---
    private function getPdfSettings($title, $className = null, $range = null, $subjectName = null)
    {
        return [
            'title' => $title,
            'school_name' => Setting::get('school_name', 'SALIRA ACADEMY'),
            'logo' => Setting::get('school_logo'),
            'class_name' => $className,
            'range' => $range,
            'subject_name' => $subjectName
        ];
    }

    public function attendancePdf(Request $request)
    {
        $this->resolveSemesterDates($request);
        $classId = $request->academic_class_id;

        if ($classId === 'all') {
            // Tentukan tahun ajaran dari semester yang diminta (bisa arsip)
            $targetAcademicYearId = null;
            if ($request->filled('semester_id')) {
                $requestedSem = Semester::find($request->semester_id);
                $targetAcademicYearId = $requestedSem?->academic_year_id;
            }
            if (!$targetAcademicYearId) {
                $activeSem = $this->getActiveSemester();
                $targetAcademicYearId = $activeSem?->academic_year_id;
            }
            $classesQuery = AcademicClass::withoutGlobalScope('active_year')->query();
            if ($targetAcademicYearId) {
                $classesQuery->where('academic_year_id', $targetAcademicYearId);
            }
            $classes = $classesQuery->get();

            $classesData = [];
            foreach ($classes as $class) {
                $mockRequest = new Request($request->all());
                $mockRequest->merge(['academic_class_id' => $class->id]);
                
                $classData = $this->attendanceData($mockRequest)->getData(true);
                if (count($classData['report']) > 0) {
                    $classesData[] = $classData;
                }
            }

            if (empty($classesData)) {
                $mockRequest = new Request($request->all());
                $mockRequest->merge(['academic_class_id' => $classes->first()->id ?? 0]);
                $classesData[] = $this->attendanceData($mockRequest)->getData(true);
            }

            $logo = Setting::get('school_logo');
            $logoPath = null;
            if ($logo) {
                if (file_exists(public_path('storage/' . $logo))) {
                    $logoPath = public_path('storage/' . $logo);
                } elseif (file_exists(storage_path('app/public/' . $logo))) {
                    $logoPath = storage_path('app/public/' . $logo);
                } elseif (file_exists(public_path($logo))) {
                    $logoPath = public_path($logo);
                }
            }

            $pdf = Pdf::loadView('reports.attendance_multi_pdf', [
                'classesData' => $classesData,
                'school_name' => Setting::get('school_name', 'SALIRA ACADEMY'),
                'school_address' => Setting::get('school_address'),
                'logo' => $logoPath,
            ])->setPaper('a4', 'landscape');

            return $pdf->stream('rekap_absensi_semua_kelas.pdf');
        } else {
            $data = $this->attendanceData($request)->getData(true);
            $logo = Setting::get('school_logo');
            $logoPath = null;
            if ($logo) {
                if (file_exists(public_path('storage/' . $logo))) {
                    $logoPath = public_path('storage/' . $logo);
                } elseif (file_exists(storage_path('app/public/' . $logo))) {
                    $logoPath = storage_path('app/public/' . $logo);
                } elseif (file_exists(public_path($logo))) {
                    $logoPath = public_path($logo);
                }
            }

            $settings = $this->getPdfSettings('Rekap Absensi Siswa', $data['class'], $data['range']);
            $pdf = Pdf::loadView('reports.attendance_pdf', array_merge($settings, [
                'dates' => $data['dates'],
                'report' => $data['report'],
                'logo' => $logoPath
            ]))->setPaper('a4', 'landscape');

            return $pdf->stream('rekap_absensi.pdf');
        }
    }

    public function attendanceSubjectPdf(Request $request)
    {
        $this->resolveSemesterDates($request);
        $data = $this->attendanceSubjectData($request)->getData(true);
        $settings = $this->getPdfSettings('Rekap Absensi Mata Pelajaran', $data['class'], $data['range'], $data['subject']);
        
        $pdf = Pdf::loadView('reports.attendance_subject_pdf', array_merge($settings, [
            'dates' => $data['dates'],
            'report' => $data['report'],
            'subject' => $data['subject']
        ]))->setPaper('a4', 'landscape');

        return $pdf->stream('rekap_absensi_mapel.pdf');
    }

    public function assessmentPdf(Request $request)
    {
        $this->resolveSemesterDates($request);
        $data = $this->assessmentData($request)->getData(true);
        $subject = \App\Models\Subject::find($request->subject_id)?->name ?? '-';
        $settings = $this->getPdfSettings('Rekap Asesmen Harian', $this->findClass($request->academic_class_id)?->name ?? '-', $data['range'], $subject);
        
        // Collect students
        $students = collect($data['assessments'])->flatMap(function($a) {
            return collect($a['scores'])->pluck('student.name');
        })->unique()->sort()->values();

        $pdf = Pdf::loadView('reports.assessment_pdf', array_merge($settings, [
            'assessments' => $data['assessments'],
            'students' => $students
        ]))->setPaper('a4', 'landscape');

        return $pdf->stream('rekap_asesmen.pdf');
    }

    public function agendaPdf(Request $request)
    {
        $this->resolveSemesterDates($request);
        $data = $this->agendaData($request)->getData(true);
        
        $matrix = null;
        if ($request->academic_class_id && $request->start_date && $request->end_date) {
            $matrix = $this->attendanceData($request)->getData(true);
        }
        
        $className = $this->findClass($request->academic_class_id)?->name ?? '-';
        $start = Carbon::parse($request->start_date)->format('d/m/Y');
        $end = Carbon::parse($request->end_date)->format('d/m/Y');
        $settings = $this->getPdfSettings('Rekap Jurnal / Agenda Mengajar', $className, "$start - $end");

        $teacherName = 'Semua Guru';
        if ($request->filled('teacher_ids')) {
            $teacherIds = is_array($request->teacher_ids) 
                ? $request->teacher_ids 
                : explode(',', $request->teacher_ids);
            $selectedTeachers = \App\Models\User::whereIn('id', $teacherIds)->pluck('name')->toArray();
            if (!empty($selectedTeachers)) {
                $teacherName = implode(', ', $selectedTeachers);
            }
        } elseif ($request->filled('teacher_id')) {
            $selectedTeacher = \App\Models\User::find($request->teacher_id);
            if ($selectedTeacher) {
                $teacherName = $selectedTeacher->name;
            }
        }

        $pdf = Pdf::loadView('reports.agenda_pdf', array_merge($settings, [
            'data' => $data,
            'matrix' => $matrix,
            'teacher_name' => $teacherName
        ]))->setPaper('a4', 'landscape');

        return $pdf->stream('rekap_jurnal.pdf');
    }

    public function consultationPdf(Request $request)
    {
        $this->resolveSemesterDates($request);
        $data = $this->consultationData($request)->getData(true);
        $className = $request->academic_class_id ? ($this->findClass($request->academic_class_id)?->name ?? 'Semua Kelas') : 'Semua Kelas';
        $start = Carbon::parse($request->start_date)->format('d/m/Y');
        $end = Carbon::parse($request->end_date)->format('d/m/Y');
        $settings = $this->getPdfSettings('Rekap Bimbingan Siswa (Konseling)', $className, "$start - $end");

        $pdf = Pdf::loadView('reports.consultation_pdf', array_merge($settings, [
            'data' => $data
        ]))->setPaper('a4', 'landscape');

        return $pdf->stream('rekap_bimbingan.pdf');
    }
}

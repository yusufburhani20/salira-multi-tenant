<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicClass;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentScore;
use App\Models\StudentConsultation;
use App\Models\Setting;
use App\Notifications\StudentReportNotification;
use App\Models\Semester;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

use App\Http\Controllers\Concerns\ResolvesActiveSemester;

class StudentResumeController extends Controller
{
    use ResolvesActiveSemester;

    private function ensureIsMyStudent(Student $student)
    {
        $user = auth()->user();
        if ($user->hasAnyRole(['Super Admin', 'Kepala Sekolah', 'Staff/TU'])) {
            return true;
        }

        $myClassIds = AcademicClass::where('homeroom_teacher_id', $user->id)
            ->pluck('id');

        $isMyStudent = $student->academicClasses()
            ->wherePivot('is_active', true)
            ->whereIn('class_id', $myClassIds)
            ->exists();

        if (!$isMyStudent) {
            abort(403, 'Siswa ini bukan bagian dari kelas yang Anda ampu.');
        }

        return true;
    }

    public function index()
    {
        $user = auth()->user();
        
        $query = AcademicClass::with(['academicYear', 'students' => function($q) {
            $q->wherePivot('is_active', true)->orderBy('name');
        }]);

        if (!$user->hasAnyRole(['Super Admin', 'Kepala Sekolah', 'Staff/TU'])) {
            $query->where('homeroom_teacher_id', $user->id);
        }

        $classes = $query->get();

        return Inertia::render('Teacher/MyStudents/Index', [
            'classes' => $classes,
        ]);
    }

    public function show(Student $student)
    {
        $this->ensureIsMyStudent($student);
        
        $student->load(['academicClasses' => function($q) {
            $q->wherePivot('is_active', true)->with('academicYear');
        }]);

        $semesters = Semester::whereHas('academicYear')->with('academicYear')
            ->get()
            ->map(function($sem) {
                return [
                    'id' => $sem->id,
                    'name' => 'TA ' . $sem->academicYear->name . ' - ' . $sem->name,
                    'start_date' => $sem->start_date,
                    'end_date' => $sem->end_date,
                    'is_active' => $sem->is_active,
                ];
            });
        $activeSemester = $this->getActiveSemester();

        return Inertia::render('Teacher/MyStudents/Resume', [
            'student' => $student,
            'semesters' => $semesters,
            'activeSemesterId' => $activeSemester?->id,
        ]);
    }

    // resolveActiveSemesterIntoRequest is provided by ResolvesActiveSemester trait

    public function data(Request $request, Student $student)
    {
        $this->ensureIsMyStudent($student);

        $this->resolveActiveSemesterIntoRequest($request);

        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $studentId = $student->id;
        $startDate = $request->start_date;
        $endDate   = $request->end_date;

        // 1. Student Profile
        $studentData = Student::with(['academicClasses' => function($q) {
            $q->wherePivot('is_active', true)->with('academicYear');
        }])->findOrFail($studentId);

        // 2. Attendance Summary
        $attendances = StudentAttendance::where('student_id', $studentId)
            ->whereBetween('date', [$startDate, $endDate])
            ->get(['status']);

        $statusCounts = $attendances->groupBy(function($a) {
            return $a->status instanceof \App\Enums\AttendanceStatus
                ? $a->status->value
                : (string) $a->status;
        })->map->count();

        $attendanceSummary = [
            'hadir'     => (int) ($statusCounts['hadir']     ?? 0),
            'sakit'     => (int) ($statusCounts['sakit']     ?? 0),
            'izin'      => (int) ($statusCounts['izin']      ?? 0),
            'alpha'     => (int) ($statusCounts['alpha']     ?? 0),
            'terlambat' => (int) ($statusCounts['terlambat'] ?? 0),
            'total'     => $attendances->count(),
        ];

        $attendanceSummary['percentage'] = $attendanceSummary['total'] > 0
            ? round(($attendanceSummary['hadir'] / $attendanceSummary['total']) * 100)
            : 0;

        // 3. Academic Performance
        $scores = StudentScore::where('student_id', $studentId)
            ->join('daily_assessments', 'student_scores.daily_assessment_id', '=', 'daily_assessments.id')
            ->join('subjects', 'daily_assessments.subject_id', '=', 'subjects.id')
            ->whereBetween('daily_assessments.date', [$startDate, $endDate])
            ->select(
                'student_scores.score',
                'subjects.id as subject_id',
                'subjects.name as subject_name'
            )
            ->get();

        $academics = $scores->groupBy('subject_id')->map(function($group) {
            return [
                'subject' => $group->first()->subject_name,
                'average' => round($group->avg('score'), 1),
                'count'   => $group->count(),
                'min'     => (float) $group->min('score'),
                'max'     => (float) $group->max('score'),
            ];
        })->values();

        // 4. Consultation History
        $consultations = StudentConsultation::where('student_id', $studentId)
            ->whereBetween('consultation_date', [$startDate, $endDate])
            ->with('homeroomTeacher:id,name')
            ->orderByDesc('consultation_date')
            ->get();

        $startCarbon = Carbon::parse($startDate);
        $endCarbon   = Carbon::parse($endDate);

        return response()->json([
            'student'       => $studentData,
            'attendance'    => $attendanceSummary,
            'academics'     => $academics,
            'consultations' => $consultations,
            'range'         => $startCarbon->format('d M Y') . ' – ' . $endCarbon->format('d M Y'),
        ]);
    }

    public function pdf(Request $request, Student $student)
    {
        $this->ensureIsMyStudent($student);

        $this->resolveActiveSemesterIntoRequest($request);

        // Fetch data using the data method internally
        $dataResponse = $this->data($request, $student);
        $data = $dataResponse->getData(true);

        $settings = [
            'school_name'    => Setting::get('school_name', 'SALIRA ACADEMY'),
            'school_address' => Setting::get('school_address', 'Alamat Sekolah Belum Diatur'),
            'school_phone'   => Setting::get('school_phone', '-'),
            'school_email'   => Setting::get('school_email', '-'),
            'report_location'=> Setting::get('report_location', 'Kota'),
            'school_logo'    => Setting::get('school_logo'),
            'title'          => 'LAPORAN PERKEMBANGAN SISWA (RESUME)',
            'range'          => $data['range'],
        ];

        $pdf = Pdf::loadView('reports.student_resume_pdf', array_merge($settings, $data))
            ->setPaper('a4', 'portrait');

        return $pdf->stream("resume_{$data['student']['name']}.pdf");
    }

    public function sendReport(Request $request, Student $student)
    {
        $this->ensureIsMyStudent($student);

        $this->resolveActiveSemesterIntoRequest($request);

        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        if (!$student->parent_email && !$student->parent_telegram_id) {
            return back()->with('error', 'Orang tua siswa belum memiliki email atau Telegram terdaftar.');
        }

        // Fetch data array to pass to notification
        $dataResponse = $this->data($request, $student);
        $reportData = $dataResponse->getData(true);

        $student->notify(new StudentReportNotification(
            $student,
            auth()->user(),
            $request->start_date,
            $request->end_date,
            $reportData
        ));

        return back()->with('success', "Laporan {$student->name} berhasil dikirim ke orang tua.");
    }
    public function sendBulkReport(Request $request)
    {
        $this->resolveActiveSemesterIntoRequest($request);

        $request->validate([
            'student_ids'   => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:students,id',
            'start_date'    => 'required|date',
            'end_date'      => 'required|date|after_or_equal:start_date',
        ]);

        $students = Student::whereIn('id', $request->student_ids)->get();

        // Validasi: semua siswa harus milik wali kelas ini
        foreach ($students as $student) {
            $this->ensureIsMyStudent($student);
        }

        $sent    = 0;
        $skipped = 0;
        $delay   = 0;

        foreach ($students as $student) {
            if (!$student->parent_email && !$student->parent_telegram_id) {
                $skipped++;
                continue;
            }

            // Ambil data resume per siswa
            $fakeRequest = new \Illuminate\Http\Request();
            $fakeRequest->merge([
                'start_date' => $request->start_date,
                'end_date'   => $request->end_date,
            ]);
            $dataResponse = $this->data($fakeRequest, $student);
            $reportData   = $dataResponse->getData(true);

            $student->notify(
                (new StudentReportNotification(
                    $student,
                    auth()->user(),
                    $request->start_date,
                    $request->end_date,
                    $reportData
                ))->delay(now()->addSeconds($delay))
            );

            $sent++;
            // Jeda 3 detik setiap 5 siswa agar tidak kena rate-limit WA/Telegram
            if ($sent % 5 === 0) {
                $delay += 3;
            }
        }

        $msg = "Laporan berhasil dikirim ke {$sent} siswa.";
        if ($skipped > 0) {
            $msg .= " {$skipped} siswa dilewati karena belum ada kontak orang tua.";
        }

        return back()->with('success', $msg);
    }
}

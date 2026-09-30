<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\FinalAssessment;
use App\Models\FinalAssessmentScore;
use App\Models\AcademicClass;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Subject;
use App\Models\Setting;
use App\Models\ClassAgenda;
use App\Models\StudentAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinalAssessmentController extends Controller
{
    /**
     * Display list of final assessments (ASAS/ASAT) with semester filters.
     */
    public function index(Request $request)
    {
        // Load all academic years with their semesters for the filter dropdown
        $academicYears = AcademicYear::with('semesters')->orderByDesc('id')->get();

        // Find the active semester - prioritize semester within the active academic year
        $activeSemester = Semester::where('is_active', true)
            ->whereHas('academicYear', fn($q) => $q->where('is_active', true))
            ->with('academicYear')
            ->first();

        // Fallback: any active semester
        if (!$activeSemester) {
            $activeSemester = Semester::where('is_active', true)->whereHas('academicYear')->with('academicYear')->first();
        }

        // Apply semester filter — default to active semester
        $semesterId = $request->semester_id ?? ($activeSemester?->id);

        $query = FinalAssessment::whereHas('academicClass')->with(['semester.academicYear', 'academicClass', 'subject']);
        if (!Auth::user()->hasAnyRole(['Super Admin', 'Kepala Sekolah', 'Staff/TU'])) {
            $query->where('teacher_id', Auth::id());
        }

        if ($semesterId) {
            $query->where('semester_id', $semesterId);
        }

        if ($request->academic_class_id) {
            $query->where('academic_class_id', $request->academic_class_id);
        }
        if ($request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }

        $assessments = $query->latest()->paginate(15)->withQueryString();

        $classes = AcademicClass::orderBy('name')->get();
        $subjects = Subject::orderBy('name')->get();

        return Inertia::render('Teacher/FinalAssessments/Index', [
            'assessments'    => $assessments,
            'academicYears'  => $academicYears,
            'activeSemester' => $activeSemester,
            'classes'        => $classes,
            'subjects'       => $subjects,
            'filters'        => $request->only(['semester_id', 'academic_class_id', 'subject_id', 'type']),
        ]);
    }

    /**
     * Show form to create a new ASAS or ASAT assessment.
     * Only allowed on the active semester.
     */
    public function create(Request $request)
    {
        // Prioritize semester within the active academic year
        $activeSemester = Semester::where('is_active', true)
            ->whereHas('academicYear', fn($q) => $q->where('is_active', true))
            ->with('academicYear')
            ->first();

        // Fallback: any active semester
        if (!$activeSemester) {
            $activeSemester = Semester::where('is_active', true)->whereHas('academicYear')->with('academicYear')->first();
        }

        if (!$activeSemester) {
            return redirect()->route('teacher.final-assessments.index')
                ->with('error', 'Tidak ada semester aktif. Hubungi administrator.');
        }

        // Determine allowed type based on semester name
        $semesterName = strtolower($activeSemester->name);
        $allowedTypes = [];

        if (str_contains($semesterName, 'ganjil') || str_contains($semesterName, '1')) {
            $allowedTypes = ['ASAS'];
        } elseif (str_contains($semesterName, 'genap') || str_contains($semesterName, '2')) {
            $allowedTypes = ['ASAT'];
        } else {
            // Fallback: allow both
            $allowedTypes = ['ASAS', 'ASAT'];
        }

        $classes = AcademicClass::orderBy('name')->get();
        $subjects = Subject::with('academicClasses:id')->orderBy('name')->get();

        $selectedClassId = $request->class_id;
        $students = [];

        if ($selectedClassId) {
            $class = AcademicClass::with('students')->find($selectedClassId);
            if ($class) {
                $students = $class->students;
            }
        }

        return Inertia::render('Teacher/FinalAssessments/Form', [
            'activeSemester' => $activeSemester,
            'allowedTypes'   => $allowedTypes,
            'classes'        => $classes,
            'subjects'       => $subjects,
            'students'       => $students,
            'selectedClassId'=> $selectedClassId,
        ]);
    }

    /**
     * Store a new ASAS/ASAT assessment.
     */
    public function store(Request $request)
    {
        $activeSemester = Semester::where('is_active', true)
            ->whereHas('academicYear', fn($q) => $q->where('is_active', true))
            ->first()
            ?? Semester::where('is_active', true)->whereHas('academicYear')->first();

        if (!$activeSemester) {
            return back()->with('error', 'Tidak ada semester aktif.');
        }

        $request->validate([
            'academic_class_id' => 'required|exists:academic_classes,id',
            'subject_id'        => 'required|exists:subjects,id',
            'type'              => 'required|in:ASAS,ASAT',
            'kktp'              => 'required|integer|min:0|max:100',
            'kka'               => 'required|integer|min:0|max:100',
            'description'       => 'nullable|string',
            'scores'            => 'required|array|min:1',
            'scores.*.student_id' => 'required|exists:students,id',
            'scores.*.score'    => 'required|numeric|min:0|max:100',
            'scores.*.notes'    => 'nullable|string|max:255',
            'scores.*.attitude_score' => 'required|numeric|min:0|max:100',
            'scores.*.interest_score' => 'required|numeric|min:0|max:100',
        ]);

        // Check for duplicates
        $exists = FinalAssessment::where([
            'semester_id'       => $activeSemester->id,
            'academic_class_id' => $request->academic_class_id,
            'subject_id'        => $request->subject_id,
            'type'              => $request->type,
        ])->exists();

        if ($exists) {
            return back()->withErrors([
                'type' => "Data {$request->type} untuk kelas dan mata pelajaran ini sudah ada di semester aktif. Gunakan fitur edit untuk memperbarui."
            ]);
        }

        // Fetch real attendance percentage map in backend for secure calculation
        $attendanceMap = [];
        $agendas = ClassAgenda::where('academic_class_id', $request->academic_class_id)
            ->where('subject_id', $request->subject_id)
            ->whereBetween('date', [$activeSemester->start_date, $activeSemester->end_date])
            ->pluck('id');
            
        $totalAgendas = $agendas->count();
        if ($totalAgendas > 0) {
            $attendances = StudentAttendance::whereIn('class_agenda_id', $agendas)
                ->get()
                ->groupBy('student_id');
                
            foreach ($request->scores as $scoreData) {
                $studentId = $scoreData['student_id'];
                $studentAtts = $attendances->get($studentId);
                if ($studentAtts) {
                    $present = $studentAtts->filter(function($att) {
                        $status = strtolower($att->status->value ?? $att->status);
                        return in_array($status, ['hadir', 'terlambat']);
                    })->count();
                    $attendanceMap[$studentId] = round(($present / $totalAgendas) * 100);
                } else {
                    $attendanceMap[$studentId] = 100;
                }
            }
        }

        DB::transaction(function () use ($request, $activeSemester, $attendanceMap) {
            $assessment = FinalAssessment::create([
                'semester_id'       => $activeSemester->id,
                'academic_class_id' => $request->academic_class_id,
                'subject_id'        => $request->subject_id,
                'teacher_id'        => Auth::id(),
                'type'              => $request->type,
                'kktp'              => $request->kktp ?? 75,
                'kka'               => $request->kka ?? 75,
                'description'       => $request->description,
            ]);

            foreach ($request->scores as $scoreData) {
                $studentId = $scoreData['student_id'];
                $attPct = $attendanceMap[$studentId] ?? 100;
                $attitude = $scoreData['attitude_score'];
                $interest = $scoreData['interest_score'];
                $charScore = round(($attPct * 0.60) + ($attitude * 0.20) + ($interest * 0.20));

                FinalAssessmentScore::create([
                    'final_assessment_id' => $assessment->id,
                    'student_id'          => $studentId,
                    'score'               => $scoreData['score'],
                    'notes'               => $scoreData['notes'] ?? null,
                    'attendance_percentage' => $attPct,
                    'attitude_score'      => $attitude,
                    'interest_score'      => $interest,
                    'character_score'     => $charScore,
                ]);
            }
        });

        return redirect()->route('teacher.final-assessments.index')
            ->with('success', "Asesmen {$request->type} berhasil disimpan.");
    }

    /**
     * Show edit form for an existing assessment.
     * Only editable if semester is still active.
     */
    public function edit($id)
    {
        $assessment = FinalAssessment::with(['scores.student', 'academicClass', 'subject', 'semester.academicYear'])
            ->findOrFail($id);

        if ($assessment->teacher_id !== Auth::id()) {
            abort(403);
        }

        if (!$assessment->semester->is_active) {
            return redirect()->route('teacher.final-assessments.index')
                ->with('error', 'Data asesmen dari semester yang sudah tidak aktif tidak dapat diedit.');
        }

        $activeSemester = $assessment->semester;
        $semesterName   = strtolower($activeSemester->name);

        $allowedTypes = [];
        if (str_contains($semesterName, 'ganjil') || str_contains($semesterName, '1')) {
            $allowedTypes = ['ASAS'];
        } elseif (str_contains($semesterName, 'genap') || str_contains($semesterName, '2')) {
            $allowedTypes = ['ASAT'];
        } else {
            $allowedTypes = ['ASAS', 'ASAT'];
        }

        $subjects = Subject::with('academicClasses:id')->orderBy('name')->get();

        return Inertia::render('Teacher/FinalAssessments/Form', [
            'assessment'     => $assessment,
            'activeSemester' => $activeSemester,
            'allowedTypes'   => $allowedTypes,
            'subjects'       => $subjects,
            'classes'        => AcademicClass::orderBy('name')->get(),
            'students'       => $assessment->scores->map(function ($s) {
                return array_merge($s->student->toArray(), [
                    'score' => $s->score,
                    'notes' => $s->notes,
                    'attendance_percentage' => $s->attendance_percentage ?? 100,
                    'attitude_score' => $s->attitude_score ?? '',
                    'interest_score' => $s->interest_score ?? '',
                    'character_score' => $s->character_score ?? '',
                ]);
            }),
        ]);
    }

    /**
     * Update an existing assessment.
     */
    public function update(Request $request, $id)
    {
        $assessment = FinalAssessment::with('semester')->findOrFail($id);

        if ($assessment->teacher_id !== Auth::id()) {
            abort(403);
        }

        if (!$assessment->semester->is_active) {
            return back()->with('error', 'Data asesmen dari semester yang sudah tidak aktif tidak dapat diedit.');
        }

        $request->validate([
            'kktp'        => 'required|integer|min:0|max:100',
            'kka'         => 'required|integer|min:0|max:100',
            'description' => 'nullable|string',
            'scores'      => 'required|array|min:1',
            'scores.*.student_id' => 'required|exists:students,id',
            'scores.*.score'      => 'required|numeric|min:0|max:100',
            'scores.*.notes'      => 'nullable|string|max:255',
            'scores.*.attitude_score' => 'required|numeric|min:0|max:100',
            'scores.*.interest_score' => 'required|numeric|min:0|max:100',
        ]);

        $activeSemester = $assessment->semester;
        
        $attendanceMap = [];
        $agendas = ClassAgenda::where('academic_class_id', $assessment->academic_class_id)
            ->where('subject_id', $assessment->subject_id)
            ->whereBetween('date', [$activeSemester->start_date, $activeSemester->end_date])
            ->pluck('id');
            
        $totalAgendas = $agendas->count();
        if ($totalAgendas > 0) {
            $attendances = StudentAttendance::whereIn('class_agenda_id', $agendas)
                ->get()
                ->groupBy('student_id');
                
            foreach ($request->scores as $scoreData) {
                $studentId = $scoreData['student_id'];
                $studentAtts = $attendances->get($studentId);
                if ($studentAtts) {
                    $present = $studentAtts->filter(function($att) {
                        $status = strtolower($att->status->value ?? $att->status);
                        return in_array($status, ['hadir', 'terlambat']);
                    })->count();
                    $attendanceMap[$studentId] = round(($present / $totalAgendas) * 100);
                } else {
                    $attendanceMap[$studentId] = 100;
                }
            }
        }

        DB::transaction(function () use ($request, $assessment, $attendanceMap) {
            $assessment->update([
                'description' => $request->description,
                'kktp'        => $request->kktp ?? 75,
                'kka'         => $request->kka ?? 75,
            ]);

            foreach ($request->scores as $scoreData) {
                $studentId = $scoreData['student_id'];
                $attPct = $attendanceMap[$studentId] ?? 100;
                $attitude = $scoreData['attitude_score'];
                $interest = $scoreData['interest_score'];
                $charScore = round(($attPct * 0.60) + ($attitude * 0.20) + ($interest * 0.20));

                FinalAssessmentScore::updateOrCreate(
                    [
                        'final_assessment_id' => $assessment->id,
                        'student_id'          => $scoreData['student_id'],
                    ],
                    [
                        'score' => $scoreData['score'],
                        'notes' => $scoreData['notes'] ?? null,
                        'attendance_percentage' => $attPct,
                        'attitude_score'      => $attitude,
                        'interest_score'      => $interest,
                        'character_score'     => $charScore,
                    ]
                );
            }
        });

        return redirect()->route('teacher.final-assessments.index')
            ->with('success', "Asesmen {$assessment->type} berhasil diperbarui.");
    }

    /**
     * Delete an assessment (only if semester is active).
     */
    public function destroy($id)
    {
        $assessment = FinalAssessment::with('semester')->findOrFail($id);

        if ($assessment->teacher_id !== Auth::id()) {
            abort(403);
        }

        if (!$assessment->semester->is_active) {
            return back()->with('error', 'Data asesmen dari semester yang sudah tidak aktif tidak dapat dihapus.');
        }

        $assessment->delete();

        return back()->with('success', "Asesmen {$assessment->type} berhasil dihapus.");
    }

    /**
     * Get students by class for AJAX.
     */
    public function getStudents(Request $request, $classId)
    {
        $subjectId = $request->query('subject_id');
        $activeSemester = Semester::where('is_active', true)->whereHas('academicYear')->first();

        $class = AcademicClass::with(['students' => function($q) {
            $q->wherePivot('is_active', true)->orderBy('name');
        }])->findOrFail($classId);

        $attendanceMap = [];
        $totalAgendas = 0;

        if ($subjectId && $activeSemester) {
            $agendas = ClassAgenda::where('academic_class_id', $classId)
                ->where('subject_id', $subjectId)
                ->whereBetween('date', [$activeSemester->start_date, $activeSemester->end_date])
                ->pluck('id');

            $totalAgendas = $agendas->count();

            if ($totalAgendas > 0) {
                $attendances = StudentAttendance::whereIn('class_agenda_id', $agendas)
                    ->get()
                    ->groupBy('student_id');

                foreach ($class->students as $student) {
                    $studentAtts = $attendances->get($student->id);
                    if ($studentAtts) {
                        $present = $studentAtts->filter(function($att) {
                            $status = strtolower($att->status->value ?? $att->status);
                            return in_array($status, ['hadir', 'terlambat']);
                        })->count();
                        $attendanceMap[$student->id] = round(($present / $totalAgendas) * 100);
                    } else {
                        $attendanceMap[$student->id] = 100;
                    }
                }
            }
        }

        $students = $class->students->map(function($student) use ($attendanceMap) {
            return array_merge($student->toArray(), [
                'attendance_percentage' => $attendanceMap[$student->id] ?? 100,
            ]);
        });

        return response()->json($students);
    }

    /**
     * Export to Excel.
     */
    public function exportExcel(Request $request)
    {
        $data = $this->getExportData($request);

        $meta = [
            'school_name'  => Setting::get('school_name', 'SALIRA ACADEMY'),
            'class_name'   => $data['class_name'],
            'subject_name' => $data['subject_name'],
            'semester'     => $data['semester_label'],
            'type'         => $data['type_label'],
            'teacher_name' => Auth::user()->name,
        ];

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\FinalAssessmentExport($data, $meta),
            'rekap_asesmen_akhir.xlsx'
        );
    }

    /**
     * Export to PDF.
     */
    public function exportPdf(Request $request)
    {
        $data = $this->getExportData($request);

        $logo = Setting::get('school_logo');
        $logoPath = null;
        if ($logo) {
            if (file_exists(public_path('storage/' . $logo))) {
                $logoPath = public_path('storage/' . $logo);
            } elseif (file_exists(storage_path('app/public/' . $logo))) {
                $logoPath = storage_path('app/public/' . $logo);
            }
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.final_assessment_pdf', array_merge($data, [
            'logo'         => $logoPath,
            'school_name'  => Setting::get('school_name', 'SALIRA ACADEMY'),
            'school_address' => Setting::get('school_address'),
            'teacher_name' => Auth::user()->name,
        ]))->setPaper('a4', 'portrait');

        return $pdf->stream('rekap_asesmen_akhir.pdf');
    }

    /**
     * Shared data builder for exports.
     */
    private function getExportData(Request $request): array
    {
        $query = FinalAssessment::with(['scores.student', 'academicClass', 'subject', 'semester.academicYear'])
            ->where('teacher_id', Auth::id());

        if ($request->semester_id) {
            $query->where('semester_id', $request->semester_id);
        }
        if ($request->academic_class_id) {
            $query->where('academic_class_id', $request->academic_class_id);
        }
        if ($request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }

        $assessments = $query->get();

        $semester = $request->semester_id
            ? Semester::whereHas('academicYear')->with('academicYear')->find($request->semester_id)
            : null;

        return [
            'assessments'    => $assessments->toArray(),
            'class_name'     => $request->academic_class_id
                ? (AcademicClass::find($request->academic_class_id)?->name ?? 'Semua Kelas')
                : 'Semua Kelas',
            'subject_name'   => $request->subject_id
                ? (Subject::find($request->subject_id)?->name ?? 'Semua Mapel')
                : 'Semua Mapel',
            'semester_label' => $semester
                ? "{$semester->name} — {$semester->academicYear->name}"
                : 'Semua Semester',
            'type_label'     => $request->type ?: 'ASAS & ASAT',
        ];
    }
}

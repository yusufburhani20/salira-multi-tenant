<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicClass;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentScore;
use App\Models\StudentConsultation;
use App\Models\Setting;
use App\Models\Semester;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class StudentReportController extends Controller
{
    use \App\Http\Controllers\Concerns\ResolvesActiveSemester;

    public function resume()
    {
        $classes = AcademicClass::with(['academicYear', 'students' => function($q) {
            $q->wherePivot('is_active', true)->orderBy('name');
        }])->get();

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

        return Inertia::render('Admin/Reports/StudentResume', [
            'classes' => $classes,
            'semesters' => $semesters,
            'activeSemesterId' => $activeSemester?->id,
        ]);
    }

    private function resolveSemesterDates(Request $request)
    {
        if ($request->filled('semester_id')) {
            $sem = Semester::find($request->semester_id);
            if ($sem) {
                $request->merge([
                    'start_date' => $sem->start_date,
                    'end_date' => $sem->end_date,
                ]);
            }
        } elseif (!$request->has('start_date') && !$request->has('end_date')) {
            $activeSem = $this->getActiveSemester();
            if ($activeSem) {
                $request->merge([
                    'semester_id' => $activeSem->id,
                    'start_date' => $activeSem->start_date,
                    'end_date' => $activeSem->end_date,
                ]);
            }
        }
    }

    public function resumeData(Request $request)
    {
        $this->resolveSemesterDates($request);

        $request->validate([
            'student_id' => 'required|exists:students,id',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $studentId = (int) $request->student_id;
        $startDate = $request->start_date;
        $endDate   = $request->end_date;

        // ── 1. Student Profile ──────────────────────────────────────────────
        $student = Student::with(['academicClasses' => function($q) {
            $q->wherePivot('is_active', true)->with('academicYear');
        }])->findOrFail($studentId);

        // ── 2. Attendance Summary ───────────────────────────────────────────
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

        // ── 3. Academic Performance ─────────────────────────────────────────
        // Group by subject_id using DB-level join for accuracy
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

        // ── 4. Consultation History ─────────────────────────────────────────
        $consultations = StudentConsultation::where('student_id', $studentId)
            ->whereBetween('consultation_date', [$startDate, $endDate])
            ->with('homeroomTeacher:id,name')
            ->orderByDesc('consultation_date')
            ->get();

        $startCarbon = Carbon::parse($startDate);
        $endCarbon   = Carbon::parse($endDate);

        return response()->json([
            'student'       => $student,
            'attendance'    => $attendanceSummary,
            'academics'     => $academics,
            'consultations' => $consultations,
            'range'         => $startCarbon->format('d M Y') . ' – ' . $endCarbon->format('d M Y'),
        ]);
    }

    public function resumePdf(Request $request)
    {
        $this->resolveSemesterDates($request);
        $data = $this->resumeData($request)->getData(true);

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
}

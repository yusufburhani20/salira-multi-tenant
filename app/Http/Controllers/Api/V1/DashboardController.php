<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StudentAttendance;
use App\Models\StudentScore;
use App\Models\AcademicClass;
use App\Models\Student;
use App\Models\PermissionRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Return dashboard stats:
     *  - attendance_chart: 7-day student attendance counts (by teacher's classes)
     *  - top_students: Top 5 students by average daily assessment score
     *  - leave_summary: Logged-in user leave request summary
     */
    public function stats(Request $request)
    {
        $user = Auth::user();

        // Fetch all classes as fallback or context if needed later
        $myClassIds = AcademicClass::pluck('id');

        $schoolId = $user->school_id;
        $activeSemester = \App\Models\Semester::where('is_active', true)
            ->whereHas('academicYear', function ($q) use ($schoolId) {
                $q->where('is_active', true);
                if ($schoolId) {
                    $q->withoutGlobalScope('school')->where('school_id', $schoolId);
                }
            })->first();

        if ($activeSemester) {
            $semEndDate = Carbon::parse($activeSemester->end_date);
            $calcEndDate = $semEndDate->isFuture() ? Carbon::today() : $semEndDate;
            $semStartDate = Carbon::parse($activeSemester->start_date);
            $calcStartDate = $calcEndDate->copy()->subDays(6);
            $startDate = $calcStartDate->greaterThan($semStartDate) ? $calcStartDate : $semStartDate;
            $endDate = $calcEndDate;
        } else {
            $startDate = Carbon::today()->subDays(6);
            $endDate = Carbon::today();
        }

        $attendanceChart = [];
        for ($i = $startDate->diffInDays($endDate); $i >= 0; $i--) {
            $day = (clone $endDate)->subDays($i);
            $dayMap = [
                0 => 'Min',
                1 => 'Sen',
                2 => 'Sel',
                3 => 'Rab',
                4 => 'Kam',
                5 => 'Jum',
                6 => 'Sab'
            ];
            $label = $day->isToday() ? 'Hari ini' : $dayMap[$day->dayOfWeek];

            $stats = StudentAttendance::whereDate('date', $day)
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $attendanceChart[] = [
                'label'  => $label,
                'date'   => $day->format('Y-m-d'),
                'hadir'  => (int)($stats['hadir'] ?? $stats['terlambat'] ?? 0),
                'sakit'  => (int)($stats['sakit'] ?? 0),
                'izin'   => (int)($stats['izin'] ?? 0),
                'alpha'  => (int)($stats['alpha'] ?? 0),
            ];
        }

        // 3. Leaderboards / Rankings
        $classId = null; // API doesn't filter by class for global dashboard
        
        // a. Attendance Ranking (Top 5)
        $attendanceRanking = (function () use ($classId, $activeSemester, $schoolId) {
            $subquery = \Illuminate\Support\Facades\DB::table('student_attendances')
                ->join('students', 'student_attendances.student_id', '=', 'students.id')
                ->select('student_attendances.student_id', 'student_attendances.date')
                ->when($classId, fn($q) => $q->where('student_attendances.academic_class_id', $classId))
                ->when($activeSemester, fn($q) => $q->whereBetween('student_attendances.date', [
                    $activeSemester->start_date instanceof \Carbon\Carbon ? $activeSemester->start_date->format('Y-m-d') : $activeSemester->start_date,
                    $activeSemester->end_date instanceof \Carbon\Carbon ? $activeSemester->end_date->format('Y-m-d') : $activeSemester->end_date
                ]))
                ->when($schoolId, fn($q) => $q->where('students.school_id', $schoolId))
                ->groupBy('student_attendances.student_id', 'student_attendances.date')
                ->havingRaw("SUM(CASE WHEN student_attendances.status IN ('hadir', 'terlambat') THEN 1 ELSE 0 END) > 0")
                ->havingRaw("SUM(CASE WHEN student_attendances.status IN ('sakit', 'izin') THEN 1 ELSE 0 END) = 0")
                ->havingRaw("SUM(CASE WHEN student_attendances.status = 'alpha' THEN 1 ELSE 0 END) < 3");

            $attRankingQuery = \Illuminate\Support\Facades\DB::table(\Illuminate\Support\Facades\DB::raw("({$subquery->toSql()}) as daily_presence"))
                ->mergeBindings($subquery)
                ->select('student_id', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
                ->groupBy('student_id')
                ->orderByDesc('total');

            $topAttendanceItems = $attRankingQuery->limit(5)->get();
            $topAttendanceStudentIds = $topAttendanceItems->pluck('student_id');
            $topAttendanceStudents = Student::with('academicClasses')
                ->whereIn('id', $topAttendanceStudentIds)
                ->get()
                ->keyBy('id');

            return $topAttendanceItems->map(function($item) use ($topAttendanceStudents) {
                $student = $topAttendanceStudents->get($item->student_id);
                $className = $student && $student->academic_class ? $student->academic_class->name : '';
                return [
                    'name' => $student->name ?? 'Unknown',
                    'class_name' => $className,
                    'value' => (int) $item->total,
                ];
            });
        })();

        // b. Assessment Ranking (Top 5)
        $assessmentRanking = (function () use ($schoolId, $activeSemester, $classId) {
            $scoreRankingQuery = \App\Models\StudentScore::query()
                ->join('students', 'student_scores.student_id', '=', 'students.id')
                ->join('daily_assessments', 'student_scores.daily_assessment_id', '=', 'daily_assessments.id')
                ->select('student_scores.student_id', \Illuminate\Support\Facades\DB::raw('AVG(score) as average'))
                ->when($schoolId, fn($q) => $q->where('students.school_id', $schoolId))
                ->groupBy('student_scores.student_id')
                ->orderByDesc('average')
                ->with('student.academicClasses');

            if ($activeSemester) {
                $scoreRankingQuery->whereBetween('daily_assessments.date', [
                    $activeSemester->start_date instanceof \Carbon\Carbon ? $activeSemester->start_date->format('Y-m-d') : $activeSemester->start_date,
                    $activeSemester->end_date instanceof \Carbon\Carbon ? $activeSemester->end_date->format('Y-m-d') : $activeSemester->end_date
                ]);
            }

            return $scoreRankingQuery->limit(5)->get()->map(function($item) {
                $student = $item->student;
                $className = $student && $student->academic_class ? $student->academic_class->name : '';
                return [
                    'name' => $student->name ?? 'Unknown',
                    'class_name' => $className,
                    'value' => round($item->average, 1),
                ];
            });
        })();

        // 4. Today's attendance summary for all classes
        $todaySummary = StudentAttendance::whereDate('date', today())
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // 5. Leave summary for logged-in teacher
        $leaveSummary = DB::table('permission_requests')
            ->where('user_id', $user->id)
            ->whereYear('created_at', now()->year)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'attendance_chart'   => $attendanceChart,
            'attendance_ranking' => $attendanceRanking,
            'assessment_ranking' => $assessmentRanking,
            'today_summary'      => [
                'hadir' => (int)($todaySummary['hadir'] ?? 0),
                'sakit' => (int)($todaySummary['sakit'] ?? 0),
                'izin'  => (int)($todaySummary['izin'] ?? 0),
                'alpha' => (int)($todaySummary['alpha'] ?? 0),
            ],
            'leave_summary'    => [
                'pending'  => (int)($leaveSummary['pending'] ?? 0),
                'approved' => (int)($leaveSummary['approved'] ?? 0),
                'rejected' => (int)($leaveSummary['rejected'] ?? 0),
                'total'    => array_sum($leaveSummary),
            ],
        ]);
    }
}

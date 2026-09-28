<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\StudentAttendance;
use App\Models\StudentConsultation;
use App\Models\InventoryItem;
use App\Models\InventoryBarcode;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

use App\Http\Controllers\Concerns\HasSchoolScope;

class DashboardController extends Controller
{
    use HasSchoolScope;
    public function index(Request $request)
    {
        if ($request->user()->hasRole('Kepala Sekolah')) {
            return redirect()->route('admin.leader-dashboard');
        }

        $today = Carbon::today();
        $classId = $request->academic_class_id;

        // 0. Classes for Filter
        $classes = \App\Models\AcademicClass::all();

        // 0b. Students Per Class with today's attendance recap
        try {
            $allClasses = \App\Models\AcademicClass::with([
                'students' => fn($q) => $q->wherePivot('is_active', true)->select('students.id'),
            ])->get();

            // Get today's attendance grouped by class and student
            $todayAttendancesByClass = \App\Models\StudentAttendance::whereDate('date', $today)
                ->get()
                ->groupBy('academic_class_id');

            $studentsPerClass = $allClasses->map(function ($class) use ($todayAttendancesByClass) {
                $totalStudents = $class->students->count();
                $todayEntries = $todayAttendancesByClass->get($class->id, collect());
                $byStudent = $todayEntries->groupBy('student_id');

                $hadir = 0; $izin = 0; $alpha = 0;
                foreach ($byStudent as $studentId => $entries) {
                    $status = \App\Models\StudentAttendance::getDailyStatusFromAttendances($entries);
                    if ($status === 'hadir' || $status === 'terlambat') $hadir++;
                    elseif ($status === 'izin' || $status === 'sakit') $izin++;
                    elseif ($status === 'alpha') $alpha++;
                }

                return [
                    'id'             => $class->id,
                    'name'           => $class->name,
                    'student_count'  => $totalStudents,
                    'hadir'          => $hadir,
                    'izin'           => $izin,
                    'alpha'          => $alpha,
                    'belum_absen'    => max(0, $totalStudents - $hadir - $izin - $alpha),
                ];
            })->sortBy('name')->values();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Dashboard studentsPerClass failed: ' . $e->getMessage());
            $studentsPerClass = collect();
        }
        
        // 1. Basic Stats (Filtered by Class if selected)
        $studentsQuery = StudentAttendance::whereDate('date', $today);
        if ($classId) $studentsQuery->where('academic_class_id', $classId);

        $consultationQuery = StudentConsultation::where('follow_up_status', '!=', 'completed');
        if ($classId) $consultationQuery->where('class_id', $classId);

        // Cache stats selama 5 menit — data absensi tidak berubah setiap detik
        // Kunci cache per-sekolah agar data sekolah berbeda tidak campur
        $schoolId = $this->schoolId();
        $statsCacheKey = 'dashboard_stats_' . ($schoolId ?? 'all') . '_' . $today->toDateString() . '_class_' . ($classId ?: 'all');
        try {
            $stats = Cache::remember($statsCacheKey, 300, function () use ($studentsQuery, $consultationQuery, $schoolId) {
                $todayAttendances = (clone $studentsQuery)->get()->groupBy('student_id');
                
                $presentCount = 0;
                $permitCount = 0;
                foreach ($todayAttendances as $studentId => $dayEntries) {
                    $status = \App\Models\StudentAttendance::getDailyStatusFromAttendances($dayEntries);
                    if ($status === 'hadir' || $status === 'terlambat') {
                        $presentCount++;
                    } elseif ($status === 'izin' || $status === 'sakit') {
                        $permitCount++;
                    }
                }

                return [
                    'students_present'      => $presentCount,
                    'students_permit'       => $permitCount,
                    'consultations_pending' => $consultationQuery->count(),
                    'items_borrowed'        => InventoryItem::where('status', 'dipinjam')->count(),
                ];
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Dashboard stats failed: ' . $e->getMessage());
            $stats = [
                'students_present'      => 0,
                'students_permit'       => 0,
                'consultations_pending' => 0,
                'items_borrowed'        => 0,
            ];
        }

        // Resolve active semester
        $activeSemester = \App\Models\Semester::where('is_active', true)
            ->whereHas('academicYear', fn ($q) => $q->where('is_active', true))
            ->first()
            ?? \App\Models\Semester::where('is_active', true)->first();

        // 2. Attendance Chart (Custom Range or Last 7 Days of active semester)
        $totalStudents = $classId 
            ? Student::whereHas('academicClasses', fn($q) => $q->where('academic_classes.id', $classId)->where('class_members.is_active', true))->count() 
            : Student::count();
        $totalStudents = $totalStudents ?: 1;

        if ($request->start_date) {
            $startDate = Carbon::parse($request->start_date);
        } else {
            if ($activeSemester) {
                $semEndDate = Carbon::parse($activeSemester->end_date);
                $calcEndDate = $semEndDate->isFuture() ? Carbon::today() : $semEndDate;
                $semStartDate = Carbon::parse($activeSemester->start_date);
                $calcStartDate = $calcEndDate->copy()->subDays(6);
                $startDate = $calcStartDate->greaterThan($semStartDate) ? $calcStartDate : $semStartDate;
            } else {
                $startDate = Carbon::today()->subDays(6);
            }
        }

        if ($request->end_date) {
            $endDate = Carbon::parse($request->end_date);
        } else {
            if ($activeSemester) {
                $semEndDate = Carbon::parse($activeSemester->end_date);
                $endDate = $semEndDate->isFuture() ? Carbon::today() : $semEndDate;
            } else {
                $endDate = Carbon::today();
            }
        }
        
        if ($startDate->greaterThan($endDate)) {
            $temp = $startDate;
            $startDate = $endDate;
            $endDate = $temp;
        }

        $diffInDays = $startDate->diffInDays($endDate);
        if ($diffInDays > 30) { // Max 31 days
            $startDate = (clone $endDate)->subDays(30);
            $diffInDays = 30;
        }

        try {
            $allAttendances = StudentAttendance::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
                ->when($classId, fn($q) => $q->where('academic_class_id', $classId))
                ->get()
                ->groupBy([
                    function ($val) {
                        return Carbon::parse($val->date)->format('Y-m-d');
                    },
                    'student_id'
                ]);

            $presentCounts = [];
            foreach ($allAttendances as $dateStr => $students) {
                $presentToday = 0;
                foreach ($students as $studentId => $dayEntries) {
                    $dailyStatus = \App\Models\StudentAttendance::getDailyStatusFromAttendances($dayEntries);
                    if ($dailyStatus === 'hadir' || $dailyStatus === 'terlambat') {
                        $presentToday++;
                    }
                }
                $presentCounts[$dateStr] = $presentToday;
            }

            $chartData = [];
            for ($i = $diffInDays; $i >= 0; $i--) {
                $date = (clone $endDate)->subDays($i);
                $dateStr = $date->toDateString();
                $presentCount = $presentCounts[$dateStr] ?? 0;
                $percentage = round(($presentCount / $totalStudents) * 100);
                
                $chartData[] = [
                    'label' => $date->isToday() ? 'Hari ini' : 'H-'.$i,
                    'height' => $percentage,
                    'date' => $date->format('d/m'),
                    'present' => $presentCount,
                    'total' => $totalStudents,
                ];
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Dashboard chartData failed: ' . $e->getMessage());
            $chartData = [];
        }

        // 3. Leaderboards / Rankings
        // a. Attendance Ranking (Top 5)
        try {
            $subquery = \Illuminate\Support\Facades\DB::table('student_attendances')
                ->join('students', 'student_attendances.student_id', '=', 'students.id')
                ->select('student_attendances.student_id', 'student_attendances.date')
                ->when($classId, fn($q) => $q->where('student_attendances.academic_class_id', $classId))
                ->when($activeSemester, fn($q) => $q->whereBetween('student_attendances.date', [$activeSemester->start_date, $activeSemester->end_date]))
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

            $attendanceRanking = $topAttendanceItems->map(function($item) use ($topAttendanceStudents) {
                $student = $topAttendanceStudents->get($item->student_id);
                $className = $student && $student->academic_class ? $student->academic_class->name : '';
                return [
                    'name' => $student->name ?? 'Unknown',
                    'class_name' => $className,
                    'value' => (int) $item->total,
                    'avatar' => $student->avatar ?? null,
                ];
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Dashboard attendanceRanking failed: ' . $e->getMessage());
            $attendanceRanking = collect();
        }

        // b. Assessment Ranking (Top 5)
        try {
            $scoreRankingQuery = \App\Models\StudentScore::query()
                ->join('students', 'student_scores.student_id', '=', 'students.id')
                ->join('daily_assessments', 'student_scores.daily_assessment_id', '=', 'daily_assessments.id')
                ->select('student_scores.student_id', \Illuminate\Support\Facades\DB::raw('AVG(score) as average'))
                ->when($schoolId, fn($q) => $q->where('students.school_id', $schoolId))
                ->groupBy('student_scores.student_id')
                ->orderByDesc('average')
                ->with('student.academicClasses');

            if ($activeSemester) {
                $scoreRankingQuery->whereBetween('daily_assessments.date', [$activeSemester->start_date, $activeSemester->end_date]);
            }

            if ($classId) {
                $scoreRankingQuery->where('daily_assessments.academic_class_id', $classId);
            }

            $assessmentRanking = $scoreRankingQuery->limit(5)->get()->map(function($item) {
                $student = $item->student;
                $className = $student && $student->academic_class ? $student->academic_class->name : '';
                return [
                    'name' => $student->name ?? 'Unknown',
                    'class_name' => $className,
                    'value' => round($item->average, 1),
                    'avatar' => $student->avatar ?? null,
                ];
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Dashboard assessmentRanking failed: ' . $e->getMessage());
            $assessmentRanking = collect();
        }

        // 4. User Monitoring & Personal Attendance
        try {
            $activeUsers = User::whereHas('sessions', function($q) {
                $q->where('last_activity', '>=', now()->subMinutes(5)->getTimestamp());
            })->select('id', 'name', 'email', 'avatar')->get();

            // lastLogins: hanya tampilkan user dari sekolah yang sama
            $lastLogins = User::whereNotNull('last_login_at')
                ->latest('last_login_at')
                ->select('id', 'name', 'email', 'avatar', 'last_login_at')
                ->limit(5)->get()
                ->map(function($user) {
                    $user->time_ago = $user->last_login_at->diffForHumans();
                    return $user;
                });

            $todayAttendance = Attendance::where('user_id', $request->user()->id)
                ->whereDate('date', $today)->first();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Dashboard activeUsers/lastLogins/todayAttendance failed: ' . $e->getMessage());
            $activeUsers = collect();
            $lastLogins = collect();
            $todayAttendance = null;
        }

        // 5. Inventory Summary — 1 query GROUP BY, bukan 5 query terpisah
        try {
            $invCacheKey = 'inventory_stats_' . ($this->schoolId() ?? 'all');
            $invGrouped = Cache::remember($invCacheKey, 300, function () use ($schoolId) {
                return InventoryBarcode::select('inventory_barcodes.status', DB::raw('count(*) as total'))
                    ->join('inventory_items', 'inventory_barcodes.item_id', '=', 'inventory_items.id')
                    ->when($schoolId, fn($q) => $q->where('inventory_items.school_id', $schoolId))
                    ->groupBy('inventory_barcodes.status')
                    ->pluck('total', 'inventory_barcodes.status')
                    ->toArray();
            });
            $inventoryStats = [
                'total'     => array_sum($invGrouped),
                'tersedia'  => $invGrouped['tersedia'] ?? 0,
                'dipinjam'  => $invGrouped['dipinjam'] ?? 0,
                'perbaikan' => $invGrouped['perbaikan'] ?? 0,
                'dihapus'   => $invGrouped['dihapus'] ?? 0,
            ];
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Dashboard inventoryStats failed: ' . $e->getMessage());
            $inventoryStats = [
                'total'     => 0,
                'tersedia'  => 0,
                'dipinjam'  => 0,
                'perbaikan' => 0,
                'dihapus'   => 0,
            ];
        }

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'activeUsers' => $activeUsers,
            'lastLogins' => $lastLogins,
            'todayAttendance' => $todayAttendance,
            'attendanceRanking' => $attendanceRanking,
            'assessmentRanking' => $assessmentRanking,
            'inventoryStats' => $inventoryStats,
            'classes' => $classes,
            'studentsPerClass' => $studentsPerClass,
            'activeSemester' => $activeSemester,
            'filters' => [
                'academic_class_id' => $request->academic_class_id,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ]
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StudentAttendance;
use App\Models\Attendance;
use App\Models\Student;
use App\Models\User;
use App\Models\Bill;
use App\Models\InventoryBarcode;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

use App\Http\Controllers\Concerns\HasSchoolScope;

class LeaderDashboardController extends Controller
{
    use HasSchoolScope;
    public function index(\Illuminate\Http\Request $request)
    {
        $today = Carbon::today()->toDateString();
        
        $classId = $request->academic_class_id;
        
        // 1. Statistik Kehadiran Siswa Hari Ini (cached 5 menit)
        $statsCacheKey = 'leader_stats_' . ($this->schoolId() ?? 'all') . '_' . $today . '_class_' . ($classId ?: 'all');
        [$totalStudents, $studentPresence] = Cache::remember($statsCacheKey, 300, function () use ($today, $classId) {
            $totalStudentsQuery = Student::query();
            if ($classId) {
                $totalStudentsQuery->whereHas('academicClasses', fn($q) => $q->where('academic_classes.id', $classId)->where('class_members.is_active', true));
            }
            $total = $totalStudentsQuery->count();

            $presenceQuery = StudentAttendance::whereDate('date', $today);
            if ($classId) {
                $presenceQuery->where('academic_class_id', $classId);
            }
            
            $todayAttendances = $presenceQuery->get()->groupBy('student_id');
            
            $presence = ['hadir' => 0, 'sakit' => 0, 'izin' => 0, 'alpha' => 0, 'terlambat' => 0];
            foreach ($todayAttendances as $studentId => $dayEntries) {
                $status = \App\Models\StudentAttendance::getDailyStatusFromAttendances($dayEntries);
                if (array_key_exists($status, $presence)) {
                    $presence[$status]++;
                }
            }

            return [$total, $presence];
        });

        // 2. Statistik Kehadiran Guru Hari Ini
        $totalTeachers = User::role(['Guru', 'Wali Kelas'])->count();
        $teacherPresenceCount = Attendance::whereDate('date', $today)
            ->whereNotNull('check_in')
            ->whereHas('user', function($query) {
                $query->role(['Guru', 'Wali Kelas']);
            })
            ->count();

        // 3. Ringkasan Keuangan (Bulan Ini)
        $billingStats = Bill::where('month', Carbon::now()->format('F'))
            ->where('year', Carbon::now()->year)
            ->select('status', DB::raw('sum(amount) as total'))
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        // 4. Tren Kehadiran Siswa
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::today()->subDays(6);
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::today();
        
        if ($startDate->greaterThan($endDate)) {
            $temp = $startDate;
            $startDate = $endDate;
            $endDate = $temp;
        }

        $diffInDays = $startDate->diffInDays($endDate);
        if ($diffInDays > 30) {
            $startDate = (clone $endDate)->subDays(30);
            $diffInDays = 30;
        }

        $allAttendances = StudentAttendance::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->when($classId, fn($q) => $q->where('academic_class_id', $classId))
            ->get()
            ->groupBy([
                function ($val) {
                    return Carbon::parse($val->date)->format('Y-m-d');
                },
                'student_id'
            ]);

        $trendCounts = [];
        foreach ($allAttendances as $dateStr => $students) {
            $presentToday = 0;
            foreach ($students as $studentId => $dayEntries) {
                $dailyStatus = \App\Models\StudentAttendance::getDailyStatusFromAttendances($dayEntries);
                if ($dailyStatus === 'hadir' || $dailyStatus === 'terlambat') {
                    $presentToday++;
                }
            }
            $trendCounts[$dateStr] = $presentToday;
        }

        $weeklyTrend = [];
        for ($i = $diffInDays; $i >= 0; $i--) {
            $date = (clone $endDate)->subDays($i);
            $dateStr = $date->toDateString();
            $count = $trendCounts[$dateStr] ?? 0;
            
            $weeklyTrend[] = [
                'date' => $date->format('d/m'),
                'count' => $count
            ];
        }

        // 5. User Monitoring & Personal Attendance
        $activeUsers = User::whereHas('sessions', function($q) {
            $q->where('last_activity', '>=', now()->subMinutes(5)->getTimestamp());
        })->select('id', 'name', 'email', 'avatar')->get();

        $lastLogins = User::whereNotNull('last_login_at')
            ->latest('last_login_at')
            ->select('id', 'name', 'email', 'avatar', 'last_login_at')
            ->limit(5)->get()
            ->map(function($user) {
                $user->time_ago = $user->last_login_at->diffForHumans();
                return $user;
            });

        // 6. Inventory Summary — filter by school via InventoryItem join
        $invCacheKey = 'inventory_stats_' . ($this->schoolId() ?? 'all');
        $invGrouped = Cache::remember($invCacheKey, 300, function () {
            return InventoryBarcode::select('inventory_barcodes.status', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
                ->join('inventory_items', 'inventory_barcodes.item_id', '=', 'inventory_items.id')
                ->when($this->schoolId(), fn($q) => $q->where('inventory_items.school_id', $this->schoolId()))
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

        return Inertia::render('Admin/Dashboard/Leader', [
            'stats' => [
                'students' => [
                    'total' => $totalStudents,
                    'present' => ($studentPresence['hadir'] ?? 0) + ($studentPresence['terlambat'] ?? 0),
                    'absent' => $totalStudents - (($studentPresence['hadir'] ?? 0) + ($studentPresence['terlambat'] ?? 0) + ($studentPresence['sakit'] ?? 0) + ($studentPresence['izin'] ?? 0)),
                    'sick' => $studentPresence['sakit'] ?? 0,
                    'permission' => $studentPresence['izin'] ?? 0,
                ],
                'teachers' => [
                    'total' => $totalTeachers,
                    'present' => $teacherPresenceCount,
                ],
                'finance' => [
                    'paid' => (float)($billingStats['paid']?->total ?? 0),
                    'unpaid' => (float)($billingStats['unpaid']?->total ?? 0),
                ],
                'weeklyTrend' => $weeklyTrend
            ],
            'activeUsers' => $activeUsers,
            'lastLogins' => $lastLogins,
            'inventoryStats' => $inventoryStats,
            'filters' => [
                'academic_class_id' => $classId,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'classes' => \App\Models\AcademicClass::orderBy('name')->get(['id', 'name']),
        ]);
    }
}

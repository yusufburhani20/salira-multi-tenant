<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\AttendanceSession;
use App\Models\AttendanceLog;
use App\Models\Geofence;
use App\Models\User;
use App\Enums\PermissionType;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use App\Services\ImageCompressionService;
use Illuminate\Support\Facades\DB;

class StaffAttendanceController extends Controller
{
    public function scanner(Request $request)
    {
        $user = $request->user();
        $date = Carbon::today()->format('Y-m-d');
        $dayOfWeek = Carbon::today()->dayOfWeek;

        // Active geofences
        $activeSchoolId = session('active_school_id') ?? $user->school_id;
        $geofences = Geofence::where('is_active', true)
            ->where(function($q) use ($activeSchoolId) {
                $q->where('school_id', $activeSchoolId)->orWhereNull('school_id');
            })
            ->get();

        // Get sessions that are valid for today (based on day_of_week)
        $sessions = AttendanceSession::where('is_active', true)->get()->filter(function ($session) use ($dayOfWeek) {
            $days = $session->days_of_week; // casted to array
            return empty($days) || in_array($dayOfWeek, $days);
        })->values();

        // Determine currently active session (if any) based on time
        $nowTime = Carbon::now()->format('H:i:s');
        $activeSession = $sessions->first(function ($session) use ($nowTime) {
            return $nowTime >= $session->start_time && $nowTime <= $session->end_time;
        });

        // Get user's today logs
        $todayLogs = AttendanceLog::with('session')
            ->where('user_id', $user->id)
            ->where('date', $date)
            ->get();

        // Prepare data for Scanner page
        $permissions = $user->permissionRequests()->with('addressedTo')->latest()->get();
        $types = [];
        foreach(PermissionType::cases() as $case) {
            $types[] = ['value' => $case->value, 'label' => $case->label()];
        }
        $approvers = User::role('Kepala Sekolah')->get(['id', 'name']);

        // DASHBOARD DATA
        // Get all staff users
        $allStaff = User::role(['Guru', 'Staff/TU', 'Wali Kelas', 'Kepala Sekolah'])->get(['id', 'name']);
        
        // Get today's logs for GTK/Shalat/Pulang to calculate stats
        $allTodayLogs = AttendanceLog::with(['user', 'session'])
            ->where('date', $date)
            ->get();
            
        // Unique users who have 'hadir' or 'tawasul' in any session today
        $hadirUserIds = $allTodayLogs->filter(function($log) {
            return in_array($log->status, ['hadir', 'tawasul']);
        })->pluck('user_id')->unique();
        $hadirUsers = $allStaff->whereIn('id', $hadirUserIds)->values();

        // Unique users who have logged 'pulang' today (or in a session type='pulang')
        $pulangUserIds = $allTodayLogs->filter(function($log) {
            return $log->session && $log->session->type === 'pulang';
        })->pluck('user_id')->unique();
        $pulangUsers = $allStaff->whereIn('id', $pulangUserIds)->values();

        // Today's approved permissions
        $todayPermissions = \App\Models\PermissionRequest::where('status', 'approved')
            ->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->get();
            
        $izinUserIds = $todayPermissions->whereIn('type', ['izin_pribadi', 'izin_dinas'])->pluck('user_id')->unique();
        $izinUsers = $allStaff->whereIn('id', $izinUserIds)->values();

        $sakitUserIds = $todayPermissions->where('type', 'sakit')->pluck('user_id')->unique();
        $sakitUsers = $allStaff->whereIn('id', $sakitUserIds)->values();

        $liburUserIds = $todayPermissions->where('type', 'libur_bergantian')->pluck('user_id')->unique();
        $liburUsers = $allStaff->whereIn('id', $liburUserIds)->values();

        $accountedUserIds = collect([])
            ->concat($hadirUserIds)
            ->concat($izinUserIds)
            ->concat($sakitUserIds)
            ->concat($liburUserIds)
            ->unique();

        $alfaUsers = $allStaff->whereNotIn('id', $accountedUserIds)->values();

        // Ranking (Users with earliest check-in today)
        $ranking = AttendanceLog::with('user:id,name,avatar')
            ->where('date', $date)
            ->whereHas('session', function($q) {
                $q->where('type', 'gtk');
            })
            ->orderBy('time', 'asc')
            ->take(5)
            ->get();

        return Inertia::render('User/Attendances/Scanner', [
            'geofences' => $geofences,
            'sessions' => $sessions,
            'activeSession' => $activeSession,
            'todayLogs' => $todayLogs,
            'permissions' => $permissions,
            'types' => $types,
            'approvers' => $approvers,
            'dashboardStats' => [
                'total_staff' => $allStaff->count(),
                'hadir' => $hadirUsers,
                'pulang' => $pulangUsers,
                'izin' => $izinUsers,
                'sakit' => $sakitUsers,
                'cuti' => [],
                'libur' => $liburUsers,
                'alfa' => $alfaUsers,
                'ranking' => $ranking,
                'all_logs' => $allTodayLogs, // Detailed history
            ]
        ]);
    }

    private function getDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earth_radius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * asin(sqrt($a));
        return $earth_radius * $c;
    }

    private function verifyGeofence($lat, $lon, $schoolId = null)
    {
        $query = Geofence::where('is_active', true);
        if ($schoolId) {
            $query->where(function($q) use ($schoolId) {
                $q->where('school_id', $schoolId)->orWhereNull('school_id');
            });
        }
        
        $geofences = $query->get();
        if ($geofences->isEmpty()) {
            return ['valid' => true, 'notes' => 'No active geofences configured'];
        }

        foreach ($geofences as $geofence) {
            $dist = $this->getDistance($lat, $lon, $geofence->latitude, $geofence->longitude);
            if ($dist <= $geofence->radius) {
                return [
                    'valid' => true, 
                    'notes' => "Inside " . $geofence->name . " (Distance: " . round($dist) . "m)"
                ];
            }
        }

        return ['valid' => false, 'notes' => 'Outside all geofence zones'];
    }

    public function storeLog(Request $request)
    {
        $request->validate([
            'attendance_session_id' => 'required|exists:attendance_sessions,id',
            'status' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'photo' => 'required|image|max:2048',
        ]);

        $user = Auth::user();
        $date = Carbon::today()->format('Y-m-d');
        $time = Carbon::now()->format('H:i:s');
        $session = AttendanceSession::findOrFail($request->attendance_session_id);

        // Check time constraint
        if ($time < $session->start_time || $time > $session->end_time) {
            return back()->with('error', "Belum waktunya presensi untuk sesi ini ({$session->start_time} - {$session->end_time}).");
        }

        // Check if already logged for this session today
        $existingLog = AttendanceLog::where('user_id', $user->id)
            ->where('attendance_session_id', $session->id)
            ->where('date', $date)
            ->first();

        if ($existingLog) {
            return back()->with('error', "Anda sudah melakukan presensi untuk sesi {$session->name} hari ini.");
        }

        $activeSchoolId = session('active_school_id') ?? $user->school_id;
        $geoCheck = $this->verifyGeofence($request->latitude, $request->longitude, $activeSchoolId);
        
        if (!$geoCheck['valid']) {
            return back()->with('error', 'Gagal Presensi: Anda berada di luar radius lokasi yang diizinkan.');
        }

        $path = ImageCompressionService::compressAndStore(
            $request->file('photo'),
            'attendances/logs',
            1200,
            75
        );

        AttendanceLog::create([
            'user_id' => $user->id,
            'attendance_session_id' => $session->id,
            'date' => $date,
            'time' => $time,
            'status' => $request->status,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'photo_path' => $path,
            'ip_address' => $request->ip(),
            'device_id' => $request->header('User-Agent'),
            'verification_status' => 'valid',
            'system_notes' => $geoCheck['notes'],
        ]);

        return back()->with('success', "Presensi {$session->name} berhasil dicatat.");
    }
}

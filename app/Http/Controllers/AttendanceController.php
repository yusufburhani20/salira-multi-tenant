<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Geofence;
use App\Services\ImageCompressionService;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Enums\AttendanceStatus;
use App\Enums\VerificationStatus;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    private function getDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earth_radius = 6371000; // Radius of Earth in meters
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
            return ['valid' => true, 'notes' => 'No active geofences configured', 'geofence' => null];
        }

        foreach ($geofences as $geofence) {
            $dist = $this->getDistance($lat, $lon, $geofence->latitude, $geofence->longitude);
            if ($dist <= $geofence->radius) {
                return [
                    'valid' => true, 
                    'notes' => "Inside " . $geofence->name . " (Distance: " . round($dist) . "m)",
                    'geofence' => $geofence
                ];
            }
        }

        return ['valid' => false, 'notes' => 'Outside all geofence zones', 'geofence' => null];
    }

    public function checkIn(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'photo' => 'required|image|max:2048', // Max 2MB
            'notes' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        $date = Carbon::today();

        // Check if already checked in today
        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        if ($existing && $existing->check_in) {
            return back()->with('error', 'You have already checked in today.');
        }

        // Ambil context sekolah yang sedang aktif (bisa beda dengan sekolah utama)
        $activeSchoolId = session('active_school_id') ?? $user->school_id;

        $geoCheck = $this->verifyGeofence($request->latitude, $request->longitude, $activeSchoolId);
        if (!$geoCheck['valid']) {
            return back()->with('error', 'Gagal Check-In: Anda berada di luar radius lokasi yang diizinkan.');
        }

        $status = 'hadir';
        $now = Carbon::now();
        
        if ($geoCheck['geofence'] && $geoCheck['geofence']->work_start_time) {
            $startTime = Carbon::createFromFormat('H:i:s', $geoCheck['geofence']->work_start_time);
            if ($now->greaterThan($startTime)) {
                $status = 'terlambat';
            }
        }

        $verificationStatus = $geoCheck['valid'] ? 'valid' : 'system_flagged';
        $notes = $geoCheck['notes'];

        $path = ImageCompressionService::compressAndStore(
            $request->file('photo'),
            'attendances/checkin',
            1200,
            75
        );

        Attendance::updateOrCreate(
            ['user_id' => $user->id, 'date' => $date],
            [
                'school_id' => $activeSchoolId,
                'check_in' => Carbon::now()->format('H:i:s'),
                'status' => $status,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'photo_path' => $path,
                'ip_address' => $request->ip(),
                'device_id' => $request->header('User-Agent'),
                'verification_status' => $verificationStatus,
                'system_notes' => $notes,
                'notes' => $request->notes,
            ]
        );

        return back()->with('success', 'Checked in successfully.');
    }

    public function checkOut(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'photo' => 'nullable|image|max:2048', // photo might be optional for checkout
            'notes' => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        $date = Carbon::today();

        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $date)
            ->first();

        if (!$existing || !$existing->check_in) {
            return back()->with('error', 'You must check in first.');
        }

        if ($existing->check_out) {
            return back()->with('error', 'You have already checked out today.');
        }

        $geoCheck = $this->verifyGeofence($request->latitude, $request->longitude, $existing->school_id);
        if (!$geoCheck['valid']) {
            return back()->with('error', 'Gagal Check-Out: Anda berada di luar radius lokasi yang diizinkan.');
        }

        $now = Carbon::now();
        $notes = $existing->system_notes . " | CheckOut: " . $geoCheck['notes'];
        $newStatus = $existing->status;
        
        if ($geoCheck['geofence'] && $geoCheck['geofence']->work_end_time) {
            $endTime = Carbon::createFromFormat('H:i:s', $geoCheck['geofence']->work_end_time);
            if ($now->greaterThan($endTime)) {
                $notes .= " (Lembur)";
                $newStatus = 'lembur';
            } elseif ($now->lessThan($endTime)) {
                $notes .= " (Pulang Lebih Awal)";
                $newStatus = 'pulang_awal';
            }
        }

        // Verification status: only flag if current location is invalid OR previous status was already flagged
        // We use value if it's an enum, or directly if it's a string.
        $prevValid = is_string($existing->verification_status) 
            ? $existing->verification_status === 'valid' 
            : $existing->verification_status->value === 'valid';

        $verificationStatus = ($geoCheck['valid'] && $prevValid) ? 'valid' : 'system_flagged';
        
        $checkoutPath = null;
        if ($request->hasFile('photo')) {
            $checkoutPath = ImageCompressionService::compressAndStore(
                $request->file('photo'),
                'attendances/checkout',
                1200,
                75
            );
        }

        $existing->update([
            'check_out' => Carbon::now()->format('H:i:s'),
            'status' => $newStatus,
            'system_notes' => $notes,
            'verification_status' => $verificationStatus,
            'checkout_photo_path' => $checkoutPath,
            'checkout_notes' => $request->notes,
        ]);

        return back()->with('success', 'Checked out successfully.');
    }

    public function history(Request $request)
    {
        $user = Auth::user();
        
        $month = $request->input('month', Carbon::now()->format('m'));
        $year = $request->input('year', Carbon::now()->format('Y'));
        
        $attendances = Attendance::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->orderBy('date', 'desc')
            ->get();
            
        // Hitung stats
        $totalDays = $attendances->count();
        $present = $attendances->filter(fn($a) => in_array($a->status->value ?? $a->status, ['hadir', 'terlambat', 'lembur', 'pulang_awal']))->count();
        $late = $attendances->filter(fn($a) => ($a->status->value ?? $a->status) === 'terlambat')->count();
        $permit = $attendances->filter(fn($a) => in_array($a->status->value ?? $a->status, ['izin', 'sakit']))->count();
        $alpha = $attendances->filter(fn($a) => ($a->status->value ?? $a->status) === 'alpha')->count();
        
        $geofences = Geofence::where('is_active', true)->get();

        return Inertia::render('User/Attendances/History', [
            'attendances' => $attendances,
            'geofences' => $geofences,
            'stats' => [
                'total_days' => $totalDays,
                'present' => $present,
                'late' => $late,
                'permit' => $permit,
                'alpha' => $alpha,
                'attendance_rate' => $totalDays > 0 ? round(($present / $totalDays) * 100, 1) : 0,
            ],
            'filters' => [
                'month' => $month,
                'year' => $year,
            ]
        ]);
    }
}

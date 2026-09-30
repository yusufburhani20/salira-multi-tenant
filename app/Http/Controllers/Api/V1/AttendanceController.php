<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceResource;
use App\Http\Resources\StudentAttendanceResource;
use App\Models\Attendance;
use App\Models\StudentAttendance;
use App\Models\Geofence;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
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

    public function index(Request $request)
    {
        $user = $request->user();

        // Jika user adalah Student, tarik dari tabel student_attendances
        if (class_basename($user) === 'Student') {
            $attendances = StudentAttendance::where('student_id', $user->id)
                ->orderBy('date', 'desc')
                ->paginate(15);
            return StudentAttendanceResource::collection($attendances);
        }

        // Jika user adalah Guru/Staff, tarik dari tabel attendances
        $attendances = Attendance::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->paginate(15);
        
        return AttendanceResource::collection($attendances);
    }

    public function today(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();

        if (class_basename($user) === 'Student') {
            $attendance = StudentAttendance::where('student_id', $user->id)
                ->whereDate('date', $today)
                ->first();
            return response()->json([
                'data' => $attendance ? new StudentAttendanceResource($attendance) : null
            ]);
        }

        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('date', $today)
            ->first();

        return response()->json([
            'data' => $attendance ? new AttendanceResource($attendance) : null
        ]);
    }

    public function checkIn(Request $request)
    {
        $user = $request->user();

        // Hanya Guru/Staff yang bisa check-in pribadi via endpoint ini
        if (class_basename($user) === 'Student') {
            return response()->json(['message' => 'Siswa tidak dapat melakukan check-in mandiri di sini.'], 403);
        }

        $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|max:2048',
            'school_id' => 'nullable|exists:schools,id',
        ]);
        
        $activeSchoolId = $request->school_id ?? $user->school_id;

        if ($request->latitude && $request->longitude) {
            $geoCheck = $this->verifyGeofence($request->latitude, $request->longitude, $activeSchoolId);
            if (!$geoCheck['valid']) {
                return response()->json(['message' => 'Anda berada di luar radius lokasi yang diizinkan.'], 403);
            }
        } else {
            return response()->json(['message' => 'Koordinat lokasi (GPS) diperlukan untuk absensi.'], 400);
        }

        $today = Carbon::today()->toDateString();
        $attendance = Attendance::firstOrCreate(
            ['user_id' => $user->id, 'date' => $today],
            [
                'school_id' => $activeSchoolId,
                'check_in' => Carbon::now()->toTimeString(),
                'status' => 'hadir',
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'notes' => $request->notes,
            ]
        );

        if ($attendance->wasRecentlyCreated) {
            // Ini adalah check-in
            if ($request->hasFile('photo')) {
                $path = $request->file('photo')->store('attendances', 'public');
                $attendance->update(['photo_path' => $path]);
            }
        } else {
            // Ini adalah check-out (absen kedua di hari yang sama)
            $updateData = [
                'check_out' => Carbon::now()->toTimeString()
            ];
            
            if ($request->hasFile('photo')) {
                $path = $request->file('photo')->store('attendances/checkout', 'public');
                $updateData['checkout_photo_path'] = $path;
            }
            
            $attendance->update($updateData);
        }

        return response()->json([
            'message' => $attendance->wasRecentlyCreated ? 'Check-in berhasil' : 'Check-out berhasil',
            'data' => new AttendanceResource($attendance)
        ]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceSession;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

class AttendanceSessionController extends Controller
{
    public function index()
    {
        $schoolId = session('active_school_id');
        
        $sessions = AttendanceSession::when($schoolId, function ($q) use ($schoolId) {
            return $q->where('school_id', $schoolId)->orWhereNull('school_id');
        })->get();

        return Inertia::render('Admin/AttendanceSessions/Index', [
            'sessions' => $sessions
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type' => 'required|in:gtk,shalat,pulang,kajian',
            'start_time' => 'required|date_format:H:i|before:end_time',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'days_of_week' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $schoolId = session('active_school_id');

        AttendanceSession::create([
            'school_id' => $schoolId,
            'name' => $request->name,
            'type' => $request->type,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'days_of_week' => $request->days_of_week,
            'is_active' => $request->is_active ?? true,
        ]);

        return back()->with('success', 'Jadwal sesi berhasil ditambahkan.');
    }

    public function update(Request $request, AttendanceSession $attendanceSession)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'type' => 'required|in:gtk,shalat,pulang,kajian',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'days_of_week' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $attendanceSession->update($request->only([
            'name', 'type', 'start_time', 'end_time', 'days_of_week', 'is_active'
        ]));

        return back()->with('success', 'Jadwal sesi berhasil diperbarui.');
    }

    public function destroy(AttendanceSession $attendanceSession)
    {
        $attendanceSession->delete();
        return back()->with('success', 'Jadwal sesi berhasil dihapus.');
    }
}

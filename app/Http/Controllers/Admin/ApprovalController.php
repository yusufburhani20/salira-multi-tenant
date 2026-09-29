<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PermissionRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Enums\PermissionStatus;

class ApprovalController extends Controller
{
    public function index()
    {
        // View all permissions with user/student details
        $permissions = PermissionRequest::with(['user', 'student', 'approvedBy'])
                        ->latest()
                        ->get();

        return Inertia::render('Admin/Approvals/Index', [
            'permissions' => $permissions
        ]);
    }

    public function update(Request $request, PermissionRequest $approval)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:1000'
        ]);

        // Load relasi student beserta kelas aktifnya terlebih dahulu
        $approval->load(['student.academicClasses']);

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $approval) {
            $approval->update([
                'status'           => $request->status,
                'approved_by'      => $request->user()->id,
                'approved_at'      => now(),
                'rejection_reason' => $request->status === 'rejected' ? $request->rejection_reason : null,
            ]);

            // Jika ini IZIN SISWA dan DISETUJUI, buat record absensi otomatis
            if ($approval->student_id && $request->status === 'approved') {
                $start = \Carbon\Carbon::parse($approval->start_date);
                $end   = \Carbon\Carbon::parse($approval->end_date);

                for ($date = $start; $date->lte($end); $date->addDay()) {
                    \App\Models\StudentAttendance::updateOrCreate(
                        [
                            'student_id'      => $approval->student_id,
                            'date'            => $date->toDateString(),
                            'schedule_id'     => null,
                            'class_agenda_id' => null,
                        ],
                        [
                            'academic_class_id' => $approval->student->academic_class_id,
                            'recorded_by'       => $request->user()->id,
                            'status'            => $approval->type === 'sakit' ? 'sakit' : 'izin',
                            'notes'             => 'Izin disetujui: ' . $approval->reason,
                        ]
                    );
                }
            } 
            // Jika ini IZIN PEGAWAI (user) dan DISETUJUI, buat record absensi otomatis
            elseif ($approval->user_id && $request->status === 'approved') {
                $start = \Carbon\Carbon::parse($approval->start_date);
                $end   = \Carbon\Carbon::parse($approval->end_date);

                for ($date = $start; $date->lte($end); $date->addDay()) {
                    \App\Models\Attendance::updateOrCreate(
                        [
                            'user_id' => $approval->user_id,
                            'date'    => $date->toDateString(),
                        ],
                        [
                            'status'              => $approval->type === 'sakit' ? \App\Enums\AttendanceStatus::sakit : \App\Enums\AttendanceStatus::izin,
                            'verification_status' => \App\Enums\VerificationStatus::valid,
                            'notes'               => 'Izin disetujui: ' . $approval->reason,
                        ]
                    );
                }
            }
        });

        // Send Notification (Guru/Siswa)
        if ($approval->user) {
            $approval->user->notify(new \App\Notifications\PermissionStatusChanged($approval));
        }

        return back()->with('success', 'Permohonan izin telah ' . ($request->status === 'approved' ? 'diterima' : 'ditolak') . '.');
    }
}

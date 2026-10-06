<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PermissionRequest as LeavePermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $query = LeavePermission::with('addressedTo')->where('user_id', Auth::id());

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $leaves = $query->latest()->paginate(20);

        return response()->json([
            'data' => $leaves->map(fn($l) => $this->formatLeave($l)),
            'meta' => [
                'current_page' => $leaves->currentPage(),
                'last_page'    => $leaves->lastPage(),
                'total'        => $leaves->total(),
            ],
        ]);
    }

    public function getFormData()
    {
        $approvers = \App\Models\User::role('Kepala Sekolah')->get(['id', 'name']);
        return response()->json([
            'approvers' => $approvers,
            'types'     => collect(\App\Enums\PermissionType::cases())->map(fn($c) => [
                'value' => $c->value,
                'label' => $c->label(),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'             => 'required|string|in:sakit,izin,izin_pribadi,izin_dinas,cuti,dispensasi,libur_bergantian,dinas_luar',
            'start_date'       => 'required|date',
            'end_date'         => 'required|date|after_or_equal:start_date',
            'reason'           => 'required|string|max:1000',
            'addressed_to'     => 'required|exists:users,id',
            'attachment'       => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'task_description' => 'nullable|string|max:500',
            'task_file'        => 'nullable|file|mimes:doc,docx,pdf,jpg,jpeg,png|max:5120',
        ]);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('permissions', 'public');
        }

        $taskFilePath = null;
        if ($request->hasFile('task_file')) {
            $taskFilePath = $request->file('task_file')->store('permissions/tasks', 'public');
        }

        $leave = LeavePermission::create([
            'user_id'          => Auth::id(),
            'type'             => $validated['type'],
            'start_date'       => $validated['start_date'],
            'end_date'         => $validated['end_date'],
            'reason'           => $validated['reason'],
            'addressed_to'     => $validated['addressed_to'],
            'attachment_path'  => $attachmentPath,
            'task_description' => $validated['task_description'] ?? null,
            'task_file_path'   => $taskFilePath,
            'status'           => 'pending',
        ]);

        // Kirim notifikasi ke Kepala Sekolah yang dipilih
        try {
            $targetUser = \App\Models\User::find($leave->addressed_to);
            if ($targetUser) {
                $targetUser->notify(new \App\Notifications\NewPermissionRequest($leave));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gagal notif izin: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Perizinan berhasil diajukan',
            'data'    => $this->formatLeave($leave->load('addressedTo')),
        ], 201);
    }

    public function destroy($id)
    {
        $leave = LeavePermission::where('user_id', Auth::id())
            ->where('status', 'pending')
            ->findOrFail($id);
        $leave->delete();
        return response()->json(['message' => 'Perizinan berhasil dibatalkan']);
    }

    private function formatLeave(LeavePermission $l): array
    {
        return [
            'id'               => $l->id,
            'type'             => $l->type->value ?? $l->type,
            'start_date'       => $l->start_date,
            'end_date'         => $l->end_date,
            'reason'           => $l->reason,
            'status'           => $l->status->value ?? $l->status,
            'addressed_to'     => $l->addressed_to,
            'addressed_to_name'=> $l->addressedTo?->name,
            'attachment_path'  => $l->attachment_path ? ('/storage/' . $l->attachment_path) : null,
            'task_description' => $l->task_description,
            'task_file_path'   => $l->task_file_path ? ('/storage/' . $l->task_file_path) : null,
            'created_at'       => $l->created_at?->toDateString(),
        ];
    }
}

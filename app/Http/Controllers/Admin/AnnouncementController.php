<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\Announcement;
use App\Models\Student;
use App\Notifications\AnnouncementNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    use HasSchoolScope;
    public function index()
    {
        return Inertia::render('Admin/Announcements/Index', [
            'announcements' => Announcement::latest()->paginate(15)
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:info,warning,success,important',
            'target' => 'required|string|in:students,all',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $announcement = Announcement::create($validated);

        // Kirim notifikasi dengan jeda 3 detik per 10 siswa (cegah spam/rate-limit WA & Telegram)
        if ($validated['target'] === 'all' || $validated['target'] === 'students') {
            $delaySeconds = 0;
            Student::chunk(10, function ($students) use ($announcement, &$delaySeconds) {
                foreach ($students as $student) {
                    $student->notify(
                        (new AnnouncementNotification($announcement))
                            ->delay(now()->addSeconds($delaySeconds))
                    );
                }
                $delaySeconds += 3; // Tambah 3 detik jeda setiap batch 10 siswa
            });
        }

        return back()->with('success', 'Pengumuman berhasil diterbitkan.');
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|string|in:info,warning,success,important',
            'target' => 'required|string|in:students,all',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        $announcement->update($validated);

        return back()->with('success', 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return back()->with('success', 'Pengumuman berhasil dihapus.');
    }
}


<?php

namespace App\Http\Controllers\Admin;

use App\Exports\EventAttendanceExport;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\Event;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class EventController extends Controller
{
    use HasSchoolScope;
    public function index(Request $request)
    {
        $events = Event::with('creator')
            ->withCount('attendances')
            ->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Events/Index', [
            'events' => $events
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['is_active'] = true;

        Event::create($validated);

        return back()->with('success', 'Event baru berhasil dibuat.');
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'is_active' => 'required|boolean',
        ]);

        $event->update($validated);

        return back()->with('success', 'Event berhasil diperbarui.');
    }

    public function toggleStatus(Event $event)
    {
        $event->update([
            'is_active' => !$event->is_active,
        ]);

        $message = $event->is_active ? 'Event berhasil dibuka / diaktifkan.' : 'Event berhasil ditutup.';

        return back()->with('success', $message);
    }

    public function destroy(Event $event)
    {
        $event->delete();

        return back()->with('success', 'Event berhasil dihapus.');
    }

    public function attendances(Event $event)
    {
        $attendances = $event->attendances()
            ->with('user')
            ->latest()
            ->get()
            ->map(function ($att) {
                return [
                    'id' => $att->id,
                    'user_name' => $att->user->name ?? ($att->guest_name ?: 'Peserta / Tamu'),
                    'user_nip' => $att->user->nip ?? (empty($att->user_id) ? 'Tamu / Eksternal' : '-'),
                    'check_in_time' => $att->created_at->timezone('Asia/Jakarta')->format('d/m/Y H:i:s'),
                    'proof_url' => asset('storage/' . $att->proof_path),
                ];
            });

        return response()->json($attendances);
    }

    public function exportExcel(Event $event)
    {
        Carbon::setLocale('id');
        $event->load(['creator', 'attendances.user']);

        $meta = [
            'school_name' => \App\Models\Setting::get('school_name', 'SALIRA ACADEMY'),
            'printed_at'  => Carbon::now()->timezone('Asia/Jakarta')->isoFormat('D MMMM YYYY HH:mm:ss') . ' WIB',
        ];

        $fileName = 'laporan_event_' . Str::slug($event->name) . '_' . date('Ymd') . '.xlsx';

        return Excel::download(new EventAttendanceExport($event, $meta), $fileName);
    }

    public function exportPdf(Event $event)
    {
        Carbon::setLocale('id');
        $event->load(['creator', 'attendances.user']);

        $logoSetting = \App\Models\Setting::get('school_logo');
        $logoPath = null;
        if ($logoSetting) {
            if (file_exists(public_path('storage/' . $logoSetting))) {
                $logoPath = public_path('storage/' . $logoSetting);
            } elseif (file_exists(storage_path('app/public/' . $logoSetting))) {
                $logoPath = storage_path('app/public/' . $logoSetting);
            } elseif (file_exists($logoSetting)) {
                $logoPath = $logoSetting;
            }
        }

        $pdf = Pdf::loadView('reports.event_pdf', [
            'title'          => 'LAPORAN KEHADIRAN EVENT / RAPAT',
            'school_name'    => \App\Models\Setting::get('school_name', 'SALIRA ACADEMY'),
            'school_address' => \App\Models\Setting::get('school_address'),
            'school_city'    => \App\Models\Setting::get('school_city', 'Tasikmalaya'),
            'logo'           => $logoPath,
            'event'          => $event,
        ])
        ->setPaper('a4', 'portrait')
        ->setOption([
            'isRemoteEnabled' => true,
            'isHtml5ParserEnabled' => true,
        ]);

        return $pdf->stream('laporan_event_' . Str::slug($event->name) . '.pdf');
    }
}



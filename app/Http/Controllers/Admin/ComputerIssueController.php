<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\ComputerIssue;
use App\Models\ComputerUnit;
use App\Services\ImageCompressionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ComputerIssueController extends Controller
{
    use HasSchoolScope;
    /**
     * Display a listing of the reported computer issues.
     */
    public function index(Request $request)
    {
        $status = $request->input('status', '');
        $search = $request->input('search', '');

        $issuesQuery = ComputerIssue::with('unit.lab')
            ->orderBy('created_at', 'desc');

        if ($status) {
            $issuesQuery->where('status', $status);
        }

        if ($search) {
            $issuesQuery->where(function ($q) use ($search) {
                $q->where('reporter_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('unit', function ($qu) use ($search) {
                        $qu->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        }

        $issues = $issuesQuery->paginate(15)->withQueryString();

        return Inertia::render('Admin/ComputerIssues/Index', [
            'issues' => $issues,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ]
        ]);
    }

    /**
     * Show the public reporting form.
     */
    public function reportForm(Request $request)
    {
        $code = $request->input('code', '');
        $unit = null;

        if ($code) {
            $unit = ComputerUnit::with('lab')->where('code', $code)->first();
        }

        return Inertia::render('Public/ComputerIssues/Report', [
            'prefilledCode' => $code,
            'unit' => $unit
        ]);
    }

    /**
     * Store a newly created computer issue in storage (publicly).
     */
    public function storeIssue(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'pc_code' => 'required|string|exists:computer_units,code',
            'reporter_name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'photo' => 'nullable|image|max:2048', // max 2MB
        ]);

        if ($validator->fails()) {
            return redirect()->route('public.computer-issues.report', ['code' => $request->pc_code])
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $unit = ComputerUnit::where('code', $request->pc_code)->firstOrFail();

            $photoPath = null;
            if ($request->hasFile('photo')) {
                $photoPath = ImageCompressionService::compressAndStore(
                    $request->file('photo'),
                    'computer_issues',
                    1200,
                    80
                );
            }

            $issue = ComputerIssue::create([
                'computer_unit_id' => $unit->id,
                'reporter_name' => $request->reporter_name,
                'description' => $request->description,
                'photo_path' => $photoPath,
                'status' => 'pending',
            ]);

            // Automatically set unit status to broken
            $unit->update(['status' => 'broken']);

            return redirect()->route('public.computer-issues.report', ['code' => $request->pc_code])
                ->with('success', 'Laporan kerusakan berhasil dikirim. Laporan Anda sedang menunggu perbaikan.')
                ->with('ticket_code', $issue->ticket_code);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gagal membuat tiket kerusakan: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);

            return redirect()->route('public.computer-issues.report', ['code' => $request->pc_code])
                ->withErrors(['error' => 'Gagal menyimpan laporan ke database: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Mark a computer issue as resolved.
     */
    public function resolve(Request $request, ComputerIssue $issue)
    {
        $request->validate([
            'resolution_notes' => 'required|string|max:1000',
            'pc_status' => 'required|in:active,maintenance,broken',
        ]);

        $issue->update([
            'status' => 'resolved',
            'resolution_notes' => $request->resolution_notes,
            'resolved_by' => auth()->id(),
            'resolved_at' => now(),
        ]);

        // Update the unit's status accordingly (typically back to active/baik)
        $issue->unit->update(['status' => $request->pc_status]);

        return back()->with('success', 'Tiket kerusakan berhasil diselesaikan.');
    }

    /**
     * Mark a computer issue as in progress.
     */
    public function process(ComputerIssue $issue)
    {
        $issue->update([
            'status' => 'open',
        ]);

        // Automatically set the unit's status to maintenance
        $issue->unit->update(['status' => 'maintenance']);

        return back()->with('success', 'Tiket kerusakan sekarang dalam proses perbaikan.');
    }
}


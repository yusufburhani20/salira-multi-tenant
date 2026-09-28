<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\ComputerLab;
use App\Models\ComputerUnit;
use App\Models\ComputerIssue;
use App\Models\User;
use App\Mail\StockOpnameReportMail;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ComputerLabController extends Controller
{
    use HasSchoolScope;
    /**
     * Display a listing of the computer labs.
     */
    public function index()
    {
        $labs = ComputerLab::withCount('units')->get();

        // Fetch users for Head of Program role, fallback to admins or general users
        $kepalaPrograms = User::role('Kepala Program')->get();
        if ($kepalaPrograms->isEmpty()) {
            $kepalaPrograms = User::role('Super Admin')->get();
            if ($kepalaPrograms->isEmpty()) {
                $kepalaPrograms = User::all();
            }
        }

        return Inertia::render('Admin/ComputerLabs/Index', [
            'labs' => $labs,
            'kepalaPrograms' => $kepalaPrograms
        ]);
    }

    /**
     * Store a newly created computer lab in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        ComputerLab::create($request->only('name', 'location', 'description'));

        return back()->with('success', 'Lab Komputer berhasil ditambahkan.');
    }

    /**
     * Display the specified computer lab and its units.
     */
    public function show(ComputerLab $lab)
    {
        $lab->load('units');

        // Fetch users for Head of Program role, fallback to admins or general users
        $kepalaPrograms = User::role('Kepala Program')->get();
        if ($kepalaPrograms->isEmpty()) {
            $kepalaPrograms = User::role('Super Admin')->get();
            if ($kepalaPrograms->isEmpty()) {
                $kepalaPrograms = User::all();
            }
        }

        return Inertia::render('Admin/ComputerLabs/Show', [
            'lab' => $lab,
            'kepalaPrograms' => $kepalaPrograms
        ]);
    }

    /**
     * Update the specified computer lab.
     */
    public function update(Request $request, ComputerLab $lab)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $lab->update($request->only('name', 'location', 'description'));

        return back()->with('success', 'Lab Komputer berhasil diperbarui.');
    }

    /**
     * Remove the specified computer lab.
     */
    public function destroy(ComputerLab $lab)
    {
        $lab->delete();
        return redirect()->route('admin.computer-labs.index')->with('success', 'Lab Komputer berhasil dihapus.');
    }

    public function storeUnit(Request $request, ComputerLab $lab)
    {
        $request->validate([
            'code' => 'required|string|unique:computer_units,code',
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:pc,switch,router,lemari,other',
            'brand' => 'nullable|string|max:255',
            'processor' => 'nullable|string|max:255',
            'ram' => 'nullable|string|max:255',
            'storage' => 'nullable|string|max:255',
            'gpu' => 'nullable|string|max:255',
            'os' => 'nullable|string|max:255',
            'status' => 'required|in:active,maintenance,broken',
            'note' => 'nullable|string',
        ]);

        $lab->units()->create($request->all());

        return back()->with('success', 'Unit/Barang berhasil ditambahkan.');
    }

    /**
     * Update PC Unit info.
     */
    public function updateUnit(Request $request, ComputerUnit $unit)
    {
        $request->validate([
            'code' => 'required|string|unique:computer_units,code,' . $unit->id,
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:pc,switch,router,lemari,other',
            'brand' => 'nullable|string|max:255',
            'processor' => 'nullable|string|max:255',
            'ram' => 'nullable|string|max:255',
            'storage' => 'nullable|string|max:255',
            'gpu' => 'nullable|string|max:255',
            'os' => 'nullable|string|max:255',
            'status' => 'required|in:active,maintenance,broken',
            'note' => 'nullable|string',
        ]);

        $unit->update($request->all());

        return back()->with('success', 'Unit PC berhasil diperbarui.');
    }

    /**
     * Remove PC Unit.
     */
    public function destroyUnit(ComputerUnit $unit)
    {
        $unit->delete();
        return back()->with('success', 'Unit PC berhasil dihapus.');
    }

    /**
     * Bulk print QR Codes inside PDF layout.
     */
    public function printQrs(ComputerLab $lab)
    {
        $units = $lab->units;

        $pdf = Pdf::loadView('exports.pc_qr_pdf', [
            'lab' => $lab,
            'units' => $units
        ])->setOption('isRemoteEnabled', true);

        return $pdf->stream('qr-codes-' . str_replace(' ', '_', $lab->name) . '.pdf');
    }

    /**
     * Generate Stock Opname PDF and send it to the selected Head of Program email.
     */
    public function sendReport(Request $request, ComputerLab $lab)
    {
        $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $recipient = User::findOrFail($request->recipient_id);
        $units = $lab->units;

        $stats = [
            'total' => $units->count(),
            'active' => $units->where('status', 'active')->count(),
            'maintenance' => $units->where('status', 'maintenance')->count(),
            'broken' => $units->where('status', 'broken')->count(),
        ];

        // Fetch issues reported this week within date range
        $recentIssues = ComputerIssue::with('unit')
            ->whereIn('computer_unit_id', $units->pluck('id'))
            ->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59'])
            ->get();

        $dateRange = date('d-m-Y', strtotime($request->start_date)) . ' s/d ' . date('d-m-Y', strtotime($request->end_date));
        $laboranName = auth()->user()->name;

        // Generate the PDF
        $pdf = Pdf::loadView('exports.stock_opname_pdf', [
            'lab' => $lab,
            'units' => $units,
            'stats' => $stats,
            'recentIssues' => $recentIssues,
            'dateRange' => $dateRange,
            'laboranName' => $laboranName,
            'recipientName' => $recipient->name,
            'notes' => $request->notes,
        ]);

        // Send Email
        Mail::to($recipient->email)->send(new StockOpnameReportMail(
            $pdf->output(),
            $dateRange,
            $request->notes,
            $laboranName
        ));

        return back()->with('success', 'Laporan Stock Opname berhasil dikirim ke email Kepala Program.');
    }

    /**
     * Generate and download Stock Opname PDF directly.
     */
    public function downloadReport(Request $request, ComputerLab $lab)
    {
        $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $recipient = User::findOrFail($request->recipient_id);
        $units = $lab->units;

        $stats = [
            'total' => $units->count(),
            'active' => $units->where('status', 'active')->count(),
            'maintenance' => $units->where('status', 'maintenance')->count(),
            'broken' => $units->where('status', 'broken')->count(),
        ];

        // Fetch issues reported this week within date range
        $recentIssues = ComputerIssue::with('unit')
            ->whereIn('computer_unit_id', $units->pluck('id'))
            ->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59'])
            ->get();

        $dateRange = date('d-m-Y', strtotime($request->start_date)) . ' s/d ' . date('d-m-Y', strtotime($request->end_date));
        $laboranName = auth()->user()->name;

        // Generate the PDF
        $pdf = Pdf::loadView('exports.stock_opname_pdf', [
            'lab' => $lab,
            'units' => $units,
            'stats' => $stats,
            'recentIssues' => $recentIssues,
            'dateRange' => $dateRange,
            'laboranName' => $laboranName,
            'recipientName' => $recipient->name,
            'notes' => $request->notes,
        ]);

        return $pdf->stream('stock-opname-' . str_replace(' ', '_', $lab->name) . '-' . date('Ymd') . '.pdf');
    }
}


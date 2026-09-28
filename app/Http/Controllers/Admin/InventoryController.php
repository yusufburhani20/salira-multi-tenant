<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Setting;
use App\Exports\InventoryExport;

class InventoryController extends Controller
{
    use HasSchoolScope;
    public function index(Request $request)
    {
        $query = InventoryItem::with('category')
            ->withCount([
                'barcodes',
                'barcodes as barcodes_tersedia_count'  => fn($q) => $q->where('status', 'tersedia'),
                'barcodes as barcodes_dipinjam_count'  => fn($q) => $q->where('status', 'dipinjam'),
                'barcodes as barcodes_perbaikan_count' => fn($q) => $q->where('status', 'perbaikan'),
                'barcodes as barcodes_baik_count'      => fn($q) => $q->where('condition', 'baik'),
                'barcodes as barcodes_rusak_count'     => fn($q) => $q->whereIn('condition', ['rusak_ringan', 'rusak_berat']),
            ]);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $items = $query->latest()->paginate(15)->withQueryString();
        $categories = InventoryCategory::all();

        $stats = [
            'total'     => \App\Models\InventoryBarcode::count(),
            'tersedia'  => \App\Models\InventoryBarcode::where('status', 'tersedia')->count(),
            'dipinjam'  => \App\Models\InventoryBarcode::where('status', 'dipinjam')->count(),
            'perbaikan' => \App\Models\InventoryBarcode::where('status', 'perbaikan')->count(),
        ];

        return Inertia::render('Admin/Inventory/Index', [
            'items'      => $items,
            'categories' => $categories,
            'stats'      => $stats,
            'filters'    => $request->only(['search', 'category_id', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'    => 'required|exists:inventory_categories,id',
            'code'           => 'required|string|max:50|unique:inventory_items,code',
            'name'           => 'required|string|max:191',
            'description'    => 'nullable|string',
            'brand'          => 'nullable|string|max:100',
            'total_quantity' => 'required|integer|min:1',
            'unit_price'     => 'nullable|numeric|min:0',
            'condition'      => 'required|in:baik,rusak_ringan,rusak_berat',
            'status'         => 'required|in:tersedia,dipinjam,perbaikan,dihapus',
            'location'       => 'nullable|string|max:191',
        ]);

        InventoryItem::create($validated);

        return back()->with('success', 'Barang berhasil ditambahkan.');
    }

    public function update(Request $request, InventoryItem $item)
    {
        $validated = $request->validate([
            'category_id'    => 'required|exists:inventory_categories,id',
            'code'           => 'required|string|max:50|unique:inventory_items,code,' . $item->id,
            'name'           => 'required|string|max:191',
            'description'    => 'nullable|string',
            'brand'          => 'nullable|string|max:100',
            'total_quantity' => 'required|integer|min:1',
            'unit_price'     => 'nullable|numeric|min:0',
            'condition'      => 'required|in:baik,rusak_ringan,rusak_berat',
            'status'         => 'required|in:tersedia,dipinjam,perbaikan,dihapus',
            'location'       => 'nullable|string|max:191',
        ]);

        $item->update($validated);

        return back()->with('success', 'Barang berhasil diperbarui.');
    }

    public function destroy(InventoryItem $item)
    {
        $item->delete();
        return back()->with('success', 'Barang berhasil dihapus.');
    }

    public function show(InventoryItem $item)
    {
        $item->load(['category', 'barcodes', 'logs.user', 'logs.barcode']);

        return Inertia::render('Admin/Inventory/Show', [
            'item' => $item,
            'schoolName' => Setting::get('school_name', 'SALIRA ACADEMY'),
            'schoolLogo' => Setting::get('school_logo') ? asset('storage/' . Setting::get('school_logo')) : '/images/logo-salira.png',
        ]);
    }

    public function logs(Request $request)
    {
        $query = InventoryLog::with(['item', 'barcode', 'user'])
            ->latest();

        if ($request->filled('item_id')) {
            $query->where('item_id', $request->item_id);
        }
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->paginate(20)->withQueryString();

        return Inertia::render('Admin/Inventory/Logs', [
            'logs'    => $logs,
            'filters' => $request->only(['item_id', 'action']),
        ]);
    }

    // Category CRUD
    public function storeCategory(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:20|unique:inventory_categories,code',
            'name' => 'required|string|max:191',
        ]);
        InventoryCategory::create($request->only('code', 'name', 'description'));
        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    // Exports
    public function exportExcel()
    {
        return Excel::download(new InventoryExport(), 'laporan_inventaris.xlsx');
    }

    public function exportPdf()
    {
        $items = InventoryItem::with('category')->withCount([
            'barcodes as total_unit',
            'barcodes as tersedia' => function ($query) {
                $query->where('status', 'tersedia');
            },
            'barcodes as dipinjam' => function ($query) {
                $query->where('status', 'dipinjam');
            },
            'barcodes as perbaikan' => function ($query) {
                $query->where('status', 'perbaikan');
            },
            'barcodes as dihapus' => function ($query) {
                $query->where('status', 'dihapus');
            }
        ])->get();

        $settings = [
            'title' => 'Laporan Rekapitulasi Inventaris',
            'school_name' => Setting::get('school_name', 'SALIRA ACADEMY'),
            'logo' => Setting::get('school_logo'),
            'class_name' => 'Semua Kategori',
            'range' => now()->format('d M Y'),
            'subject_name' => null
        ];

        $pdf = Pdf::loadView('reports.inventory_pdf', array_merge($settings, [
            'items' => $items
        ]))->setPaper('a4', 'landscape');

        return $pdf->stream('laporan_inventaris.pdf');
    }
}


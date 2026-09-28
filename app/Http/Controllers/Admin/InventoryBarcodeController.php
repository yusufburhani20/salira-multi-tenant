<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\InventoryBarcode;
use App\Models\InventoryItem;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InventoryBarcodeController extends Controller
{
    use HasSchoolScope;
    /**
     * Generate & store new barcode units for an item.
     */
    public function store(Request $request, InventoryItem $item)
    {
        $request->validate([
            'quantity'      => 'required|integer|min:1|max:100',
            'serial_prefix' => 'nullable|string|max:50',
        ]);

        $created = [];
        for ($i = 0; $i < $request->quantity; $i++) {
            $barcodeValue = strtoupper($item->code) . '-' . now()->format('ymd') . '-' . strtoupper(Str::random(6));
            $serial = $request->serial_prefix
                ? $request->serial_prefix . '-' . str_pad($i + 1, 3, '0', STR_PAD_LEFT)
                : null;

            $created[] = InventoryBarcode::create([
                'item_id'       => $item->id,
                'barcode_value' => $barcodeValue,
                'serial_number' => $serial,
                'condition'     => 'baik',
                'status'        => 'tersedia',
            ]);
        }

        // Log: masuk
        InventoryLog::create([
            'item_id'  => $item->id,
            'user_id'  => auth()->id(),
            'action'   => 'masuk',
            'quantity' => $request->quantity,
            'notes'    => "Generate {$request->quantity} unit barcode baru",
        ]);

        return back()->with('success', "Berhasil generate {$request->quantity} barcode.");
    }

    /**
     * Delete a single barcode unit.
     */
    public function destroy(InventoryBarcode $barcode)
    {
        $barcode->delete();
        return back()->with('success', 'Barcode berhasil dihapus.');
    }

    /**
     * Scanner page.
     */
    public function scanner()
    {
        return Inertia::render('Admin/Inventory/Scanner');
    }

    /**
     * API: Lookup barcode value and return item info.
     */
    public function scan(Request $request)
    {
        $request->validate(['barcode_value' => 'required|string']);

        $barcode = InventoryBarcode::with('item.category')
            ->where('barcode_value', $request->barcode_value)
            ->first();

        if (!$barcode) {
            return response()->json(['found' => false, 'message' => 'Barcode tidak ditemukan.'], 404);
        }

        return response()->json([
            'found'   => true,
            'barcode' => [
                'id'             => $barcode->id,
                'barcode_value'  => $barcode->barcode_value,
                'serial_number'  => $barcode->serial_number,
                'condition'      => $barcode->condition,
                'status'         => $barcode->status,
            ],
            'item' => [
                'id'       => $barcode->item->id,
                'name'     => $barcode->item->name,
                'code'     => $barcode->item->code,
                'brand'    => $barcode->item->brand,
                'location' => $barcode->item->location,
                'category' => $barcode->item->category->name ?? '-',
            ],
        ]);
    }

    /**
     * API: Execute action (pinjam / kembali / perbaikan / pemusnahan).
     */
    public function action(Request $request)
    {
        $request->validate([
            'barcode_id'       => 'required|exists:inventory_barcodes,id',
            'action'           => 'required|in:pinjam,kembali,perbaikan,selesai_perbaikan,pemusnahan',
            'notes'            => 'nullable|string|max:500',
            'borrow_days'      => 'nullable|integer|min:1|max:365',
            'borrower_email'   => 'nullable|email',
        ]);

        $barcode = InventoryBarcode::findOrFail($request->barcode_id);

        // Validation rules per action
        $actionStatusMap = [
            'pinjam'            => ['allowed' => ['tersedia'], 'newStatus' => 'dipinjam'],
            'kembali'           => ['allowed' => ['dipinjam'], 'newStatus' => 'tersedia'],
            'perbaikan'         => ['allowed' => ['tersedia', 'dipinjam'], 'newStatus' => 'perbaikan'],
            'selesai_perbaikan' => ['allowed' => ['perbaikan'], 'newStatus' => 'tersedia'],
            'pemusnahan'        => ['allowed' => ['tersedia', 'perbaikan', 'dipinjam', 'rusak_ringan', 'rusak_berat'], 'newStatus' => 'dihapus'],
        ];

        $rule = $actionStatusMap[$request->action];
        if (!in_array($barcode->status->value, $rule['allowed'])) {
            return response()->json([
                'success' => false,
                'message' => "Aksi '{$request->action}' tidak dapat dilakukan. Status barang saat ini: {$barcode->status->value}.",
            ], 422);
        }

        $barcode->update(['status' => $rule['newStatus']]);

        $expectedReturnDate = null;
        if ($request->action === 'pinjam' && $request->borrow_days) {
            $expectedReturnDate = now()->addDays($request->borrow_days);
        }

        InventoryLog::create([
            'item_id'              => $barcode->item_id,
            'barcode_id'           => $barcode->id,
            'user_id'              => auth()->id(),
            'action'               => $request->action,
            'quantity'             => 1,
            'notes'                => $request->notes,
            'borrower_email'       => $request->action === 'pinjam' ? $request->borrower_email : null,
            'expected_return_date' => $expectedReturnDate,
        ]);

        if ($request->action === 'pinjam' && $request->borrower_email && $expectedReturnDate) {
            $barcode->load('item.category');
            \Illuminate\Support\Facades\Mail::to($request->borrower_email)
                ->queue(new \App\Mail\InventoryBorrowedMail($barcode, $barcode->item, $expectedReturnDate));
        }

        return response()->json([
            'success' => true,
            'message' => "Aksi '{$request->action}' berhasil dicatat.",
            'new_status' => $rule['newStatus'],
        ]);
    }
}


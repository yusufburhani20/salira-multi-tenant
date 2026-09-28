<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\Bill;
use App\Models\AcademicClass;
use App\Notifications\BillGeneratedNotification;
use App\Services\MidtransService;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class BillController extends Controller
{
    use HasSchoolScope;
    public function index(Request $request)
    {
        $bills = Bill::with('student')->latest()->paginate(10);
        $classes = AcademicClass::all();
        
        return Inertia::render('Admin/Bills/Index', [
            'bills' => $bills,
            'classes' => $classes,
            'finance_contact' => Setting::get('finance_contact', '')
        ]);
    }

    public function create()
    {
        $classes = AcademicClass::all();
        $students = \App\Models\Student::select('id', 'name', 'nis')->orderBy('name')->get();

        return Inertia::render('Admin/Bills/Create', [
            'classes' => $classes,
            'students' => $students
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'target_type' => 'required|in:class,student',
            'class_id' => 'required_if:target_type,class|nullable|exists:academic_classes,id',
            'student_id' => 'required_if:target_type,student|nullable|exists:students,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020',
            'amount' => 'required|numeric|min:1',
            'title' => 'required|string|max:255',
        ]);

        $midtransService = new MidtransService();
        $count = 0;

        $targetStudents = collect();

        if ($request->target_type === 'class') {
            $class = AcademicClass::with('students')->findOrFail($request->class_id);
            $targetStudents = $class->students;
        } else {
            $student = \App\Models\Student::findOrFail($request->student_id);
            $targetStudents->push($student);
        }

        foreach ($targetStudents as $student) {
            // Check if exact same bill already exists
            $existing = Bill::where('student_id', $student->id)
                ->where('month', $request->month)
                ->where('year', $request->year)
                ->where('title', $request->title)
                ->first();

            if (!$existing) {
                // Generate unique sequential bill number
                $lastId = Bill::max('id');
                $nextId = str_pad(($lastId ? $lastId + 1 : 1), 6, '0', STR_PAD_LEFT);
                $billNumber = 'INV-' . $request->year . str_pad($request->month, 2, '0', STR_PAD_LEFT) . '-' . $nextId;

                $bill = Bill::create(array_merge([
                    'bill_number' => $billNumber,
                    'student_id' => $student->id,
                    'title' => $request->title,
                    'month' => $request->month,
                    'year' => $request->year,
                    'amount' => $request->amount,
                ], $this->schoolContext()));

                // Notify via Telegram and Email
                $student->notify(new BillGeneratedNotification($bill));
                $count++;
            }
        }

        $msg = $request->target_type === 'class' ? "{$count} tagihan massal berhasil di-generate" : "1 tagihan individu berhasil di-generate";
        return redirect()->route('admin.bills.index')->with('success', $msg . " dan notifikasi dikirimkan.");
    }

    public function checkStatus($id = null)
    {
        $midtransService = new MidtransService();
        $updatedCount = 0;

        if ($id) {
            $bills = Bill::where('id', $id)->where('status', '!=', 'paid')->get();
        } else {
            $bills = Bill::where('status', 'pending')->orWhere('status', 'unpaid')->get();
        }

        foreach ($bills as $bill) {
            if (!$bill->snap_token) continue;

            $status = $midtransService->checkTransactionStatus($bill);
            
            if ($status === 'paid' && $bill->status !== 'paid') {
                $bill->update([
                    'status' => 'paid',
                    'paid_at' => now()
                ]);
                $bill->student->notify(new \App\Notifications\BillPaidNotification($bill));
                $updatedCount++;
            }
        }

        $msg = $id ? "Status tagihan telah disinkronisasi." : "Berhasil sinkronisasi massal. {$updatedCount} tagihan berubah menjadi lunas.";
        return redirect()->back()->with('success', $msg);
    }

    public function markAsPaidManual(Request $request, Bill $bill)
    {
        if ($bill->status === 'paid') {
            return redirect()->back()->with('error', 'Tagihan ini sudah lunas.');
        }

        $bill->update([
            'status' => 'paid',
            'paid_at' => now()
        ]);

        // Kirim notifikasi lunas
        $bill->student->notify(new \App\Notifications\BillPaidNotification($bill));

        return redirect()->back()->with('success', 'Tagihan berhasil ditandai sebagai lunas (pembayaran manual/cash).');
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'finance_contact' => 'nullable|string|max:20',
        ]);

        Setting::set('finance_contact', $request->finance_contact);

        return redirect()->back()->with('success', 'Kontak admin keuangan berhasil diperbarui.');
    }
}


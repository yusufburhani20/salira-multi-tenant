<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\Bill;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinanceController extends Controller
{
    use HasSchoolScope;
    public function index()
    {
        // 1. Revenue by Month (Last 12 months)
        $revenueByMonth = Bill::where('status', 'paid')
            ->where('paid_at', '>=', Carbon::now()->subYear())
            ->select(
                DB::raw('DATE_FORMAT(paid_at, "%Y-%m") as month_year'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month_year')
            ->orderBy('month_year')
            ->get();

        // 2. Expenses by Month (Last 12 months)
        $expensesByMonth = \App\Models\Expense::where('date', '>=', Carbon::now()->subYear())
            ->select(
                DB::raw('DATE_FORMAT(date, "%Y-%m") as month_year'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month_year')
            ->orderBy('month_year')
            ->get();

        // 3. Status Distribution (Volume)
        $statusDistribution = Bill::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // 4. Collection Ratio (Value)
        $collectionRatio = Bill::select('status', DB::raw('SUM(amount) as total_value'))
            ->groupBy('status')
            ->get();

        // 5. Revenue by Bill Category (Top 5)
        $revenueByCategory = Bill::where('status', 'paid')
            ->with('category')
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category ? $item->category->name : 'Uncategorized',
                    'total' => (float) $item->total
                ];
            });

        // 6. Expense by Category
        $expenseByCategory = \App\Models\Expense::with('category')
            ->select('category_id', DB::raw('SUM(amount) as total'))
            ->groupBy('category_id')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->category ? $item->category->name : 'Uncategorized',
                    'total' => (float) $item->total
                ];
            });

        // 7. KPIs
        $totalCollected = (float) Bill::where('status', 'paid')->sum('amount');
        $totalExpenses = (float) \App\Models\Expense::sum('amount');

        $kpis = [
            'total_collected' => $totalCollected,
            'total_expenses' => $totalExpenses,
            'cash_balance' => $totalCollected - $totalExpenses,
            'total_outstanding' => (float) Bill::where('status', '!=', 'paid')->sum('amount'),
            'total_bills_count' => Bill::count(),
            'paid_bills_count' => Bill::where('status', 'paid')->count(),
        ];

        return Inertia::render('Admin/Finance/Index', [
            'revenueByMonth' => $revenueByMonth,
            'expensesByMonth' => $expensesByMonth,
            'statusDistribution' => $statusDistribution,
            'collectionRatio' => $collectionRatio,
            'revenueByCategory' => $revenueByCategory,
            'expenseByCategory' => $expenseByCategory,
            'kpis' => $kpis
        ]);
    }
}


<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasSchoolScope;
use App\Models\FinanceCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinanceCategoryController extends Controller
{
    use HasSchoolScope;
    public function index()
    {
        return Inertia::render('Admin/Finance/Categories/Index', [
            'categories' => FinanceCategory::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense',
            'description' => 'nullable|string',
        ]);

        FinanceCategory::create(array_merge($request->only('name', 'type', 'description'), $this->schoolContext()));

        return redirect()->back()->with('success', 'Kategori berhasil ditambahkan');
    }

    public function update(Request $request, FinanceCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense',
            'description' => 'nullable|string',
        ]);

        $category->update($request->all());

        return redirect()->back()->with('success', 'Kategori berhasil diperbarui');
    }

    public function destroy(FinanceCategory $category)
    {
        $category->delete();
        return redirect()->back()->with('success', 'Kategori berhasil dihapus');
    }
}


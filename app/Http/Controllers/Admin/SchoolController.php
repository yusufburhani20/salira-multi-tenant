<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * SchoolController — hanya bisa diakses oleh Super Admin Yayasan.
 * Mengelola data sekolah-sekolah yang terdaftar di sistem SALIRA.
 */
class SchoolController extends Controller
{
    public function index()
    {
        $schools = School::withCount(['users', 'students'])
            ->orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id'             => $s->id,
                'name'           => $s->name,
                'type'           => $s->type,
                'type_label'     => $s->type_label,
                'npsn'           => $s->npsn,
                'slug'           => $s->slug,
                'address'        => $s->address,
                'phone'          => $s->phone,
                'email'          => $s->email,
                'principal_name' => $s->principal_name,
                'principal_nip'  => $s->principal_nip,
                'is_active'      => $s->is_active,
                'users_count'    => $s->users_count,
                'students_count' => $s->students_count,
            ]);

        return Inertia::render('Admin/Schools/Index', [
            'schools' => $schools,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'type'           => 'required|in:SMK,MTs,MA,SMA,SD',
            'npsn'           => 'nullable|string|max:20|unique:schools,npsn',
            'slug'           => 'required|string|max:50|unique:schools,slug|alpha_dash',
            'address'        => 'nullable|string|max:500',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:255',
            'website'        => 'nullable|url|max:255',
            'principal_name' => 'nullable|string|max:255',
            'principal_nip'  => 'nullable|string|max:50',
            'is_active'      => 'boolean',
        ]);

        School::create($validated);

        return back()->with('success', "Sekolah \"{$validated['name']}\" berhasil ditambahkan.");
    }

    public function update(Request $request, School $school)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'type'           => 'required|in:SMK,MTs,MA,SMA,SD',
            'npsn'           => "nullable|string|max:20|unique:schools,npsn,{$school->id}",
            'slug'           => "required|string|max:50|unique:schools,slug,{$school->id}|alpha_dash",
            'address'        => 'nullable|string|max:500',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:255',
            'website'        => 'nullable|url|max:255',
            'principal_name' => 'nullable|string|max:255',
            'principal_nip'  => 'nullable|string|max:50',
            'is_active'      => 'boolean',
        ]);

        $school->update($validated);

        return back()->with('success', "Data sekolah \"{$school->name}\" berhasil diperbarui.");
    }

    public function destroy(School $school)
    {
        if ($school->users()->exists() || $school->students()->exists()) {
            return back()->with('error', 'Sekolah tidak dapat dihapus karena masih memiliki data pengguna atau siswa.');
        }

        $name = $school->name;
        $school->delete();

        return back()->with('success', "Sekolah \"{$name}\" berhasil dihapus.");
    }

    /**
     * Toggle status aktif sekolah
     */
    public function toggleActive(School $school)
    {
        $school->update(['is_active' => ! $school->is_active]);
        $status = $school->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Sekolah \"{$school->name}\" berhasil {$status}.");
    }
}

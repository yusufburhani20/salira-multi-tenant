<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolContextController extends Controller
{
    /**
     * Tampilkan halaman pilih sekolah aktif.
     *
     * Dipanggil setelah login jika user terdeteksi multi-school.
     * User tidak bisa masuk ke dashboard sebelum memilih sekolah.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // Single-school user tidak butuh picker, redirect ke dashboard
        if (!method_exists($user, 'isMultiSchool') || ! $user->isMultiSchool()) {
            // Set session ke sekolah utama jika belum ada
            if (! session('active_school_id') && $user->school_id) {
                session(['active_school_id' => $user->school_id]);
            }
            return redirect()->route('dashboard');
        }

        // Ambil semua sekolah yang bisa diakses user ini
        $schools = method_exists($user, 'allSchools') ? $user->allSchools()->map(fn($school) => [
            'id'          => $school->id,
            'name'        => $school->name,
            'type'        => $school->type,
            'logo'        => $school->logo ? asset('storage/' . $school->logo) : null,
            'is_primary'  => $school->id === $user->school_id,
        ]) : collect();

        return Inertia::render('Auth/SelectSchool', [
            'schools'           => $schools,
            'currentSchoolId'   => session('active_school_id'),
        ]);
    }

    /**
     * Simpan pilihan sekolah aktif ke session.
     *
     * Divalidasi: user harus benar-benar punya akses ke sekolah yang dipilih.
     * Dapat dipanggil kapan saja (bukan hanya saat login) untuk ganti konteks.
     */
    public function switch(Request $request): RedirectResponse
    {
        $request->validate([
            'school_id' => 'required|integer|exists:schools,id',
        ]);

        $user     = $request->user();
        $schoolId = (int) $request->school_id;

        // Guard: pastikan user punya akses ke sekolah yang diminta
        $isSuperAdmin = method_exists($user, 'hasRole') && $user->hasRole('Super Admin');
        if (! $isSuperAdmin && (!method_exists($user, 'hasAccessToSchool') || ! $user->hasAccessToSchool($schoolId))) {
            return back()->with('error', 'Anda tidak memiliki akses ke sekolah tersebut.');
        }

        session(['active_school_id' => $schoolId]);

        $schoolName = School::find($schoolId)?->name ?? 'sekolah';

        return redirect()
            ->intended(route('dashboard'))
            ->with('success', "Konteks sekolah diubah ke {$schoolName}.");
    }

    /**
     * Reset/hapus session active_school_id.
     * Berguna untuk Super Admin yang ingin kembali ke mode "semua sekolah".
     */
    public function reset(Request $request): RedirectResponse
    {
        session()->forget('active_school_id');
        return back()->with('success', 'Konteks sekolah direset.');
    }
}

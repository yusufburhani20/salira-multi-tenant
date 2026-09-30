<?php

namespace App\Http\Controllers\Concerns;

/**
 * Trait HasSchoolScope
 *
 * Menyediakan helper methods untuk mendapatkan school_id konteks aktif.
 *
 * Logika resolusi school_id (urutan prioritas):
 *  1. Session 'active_school_id' — dipilih user melalui school context switcher.
 *     Diset setelah login (jika user multi-school) atau melalui endpoint switch sekolah.
 *  2. Fallback ke users.school_id (sekolah utama user).
 *  3. Null — Super Admin yang bisa akses semua sekolah tanpa filter.
 *
 * Dengan ini, guru multi-sekolah bisa check-in di sekolah yang sedang aktif
 * tanpa perlu login ulang. Satu akun, satu session, konteks sekolah berganti-ganti.
 */
trait HasSchoolScope
{
    /**
     * Kembalikan school_id konteks aktif.
     *
     * Untuk user biasa (single school): mengembalikan users.school_id.
     * Untuk user multi-school: mengembalikan session('active_school_id')
     *   yang dipilih saat login atau via context switcher.
     * Untuk Super Admin: mengembalikan null (akses semua sekolah).
     */
    protected function schoolId(): ?int
    {
        $user = auth()->user();

        if (! $user) {
            return null;
        }

        // Super Admin Yayasan (tidak punya school_id bawaan).
        // Tetapi jika dia sedang switch ke suatu sekolah (ada active_school_id),
        // maka contextnya adalah sekolah tersebut. Jika tidak, maka null (global).
        if ($user->hasRole('Super Admin') && (!isset($user->school_id) || $user->school_id === null)) {
            $sessionSchoolId = session('active_school_id');
            if ($sessionSchoolId) {
                return (int) $sessionSchoolId;
            }
            return null;
        }

        // Prioritas 1: active_school_id dari session (untuk multi-school users)
        $sessionSchoolId = session('active_school_id');
        if ($sessionSchoolId) {
            // Validasi: pastikan user memang punya akses ke sekolah ini
            if ($user->hasAccessToSchool((int) $sessionSchoolId)) {
                return (int) $sessionSchoolId;
            }
            // Session tidak valid, bersihkan
            session()->forget('active_school_id');
        }

        // Prioritas 2: fallback ke sekolah utama user
        return $user->school_id;
    }

    /**
     * Kembalikan array ['school_id' => X] untuk di-merge ke data create/update.
     * Gunakan ini di setiap store() method.
     *
     * Contoh:
     *   Student::create(array_merge($validated, $this->schoolContext()));
     */
    protected function schoolContext(): array
    {
        $schoolId = $this->schoolId();
        return $schoolId ? ['school_id' => $schoolId] : [];
    }

    /**
     * Kembalikan school_id, lempar exception jika tidak ada (user tanpa sekolah).
     * Gunakan ini di controller yang WAJIB punya school context.
     */
    protected function requireSchoolId(): int
    {
        $schoolId = $this->schoolId();

        if (! $schoolId) {
            abort(403, 'Aksi ini memerlukan konteks sekolah. Silakan login sebagai admin sekolah.');
        }

        return $schoolId;
    }
}

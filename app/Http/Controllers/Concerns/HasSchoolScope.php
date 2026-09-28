<?php

namespace App\Http\Controllers\Concerns;

/**
 * Trait HasSchoolScope
 *
 * Pasang trait ini di Controller yang perlu mengelola data per-sekolah.
 * Menyediakan helper methods untuk mendapatkan school_id user yang login.
 *
 * Cara penggunaan:
 *   class StudentController extends Controller {
 *       use HasSchoolScope;
 *
 *       public function store(Request $request) {
 *           Student::create(array_merge($validated, $this->schoolContext()));
 *       }
 *   }
 */
trait HasSchoolScope
{
    /**
     * Kembalikan school_id user yang sedang login.
     * Null berarti Super Admin yang bisa akses semua sekolah.
     */
    protected function schoolId(): ?int
    {
        return auth()->user()?->school_id;
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

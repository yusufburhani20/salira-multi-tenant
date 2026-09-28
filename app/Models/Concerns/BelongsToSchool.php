<?php

namespace App\Models\Concerns;

use App\Models\School;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Trait BelongsToSchool
 *
 * Pasang trait ini di semua Model yang memiliki kolom school_id.
 * Secara otomatis akan menambahkan Global Scope yang memfilter query
 * berdasarkan sekolah user yang sedang login.
 *
 * Pengecualian (tidak difilter):
 * - Super Admin Yayasan (user dengan school_id = NULL)
 * - Konteks tanpa autentikasi (misal: artisan command, queue worker)
 *
 * Cara penggunaan:
 *   use App\Models\Concerns\BelongsToSchool;
 *   class Student extends Model {
 *       use BelongsToSchool;
 *   }
 *
 * Untuk bypass scope (misal di Seeder atau command):
 *   Student::withoutGlobalScope('school')->get();
 *   // atau
 *   Student::withoutSchoolScope()->get();
 */
trait BelongsToSchool
{
    protected static function bootBelongsToSchool(): void
    {
        static::addGlobalScope('school', function (Builder $builder) {
            $user = null;

            // Check multiple guards to support Admin (web), Portal (student), and API (sanctum)
            if (auth()->guard('web')->hasUser()) {
                $user = auth()->guard('web')->user();
            } elseif (auth()->guard('student')->hasUser()) {
                $user = auth()->guard('student')->user();
            } elseif (auth()->guard('sanctum')->hasUser()) {
                $user = auth()->guard('sanctum')->user();
            }

            // 1. Tidak ada user yang login (artisan, queue, console) — skip filter
            if (! $user) {
                return;
            }

            // 2. Super Admin Yayasan (school_id = null) — bisa lihat semua, skip filter
            if (!isset($user->school_id) || $user->school_id === null) {
                return;
            }

            // 3. User biasa — filter berdasarkan school_id mereka
            $table = (new static)->getTable();
            $builder->where("{$table}.school_id", $user->school_id);
        });
    }

    /**
     * Relasi ke model School.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Scope helper untuk bypass filter sekolah secara eksplisit.
     * Berguna di Seeder, Command, atau laporan lintas sekolah.
     *
     * Contoh: Student::withoutSchoolScope()->get()
     */
    public function scopeWithoutSchoolScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('school');
    }

    /**
     * Scope helper untuk filter sekolah tertentu secara eksplisit.
     * Berguna untuk laporan Super Admin yang memilih sekolah spesifik.
     *
     * Contoh: Student::forSchool(2)->get()
     */
    public function scopeForSchool(Builder $query, int $schoolId): Builder
    {
        $table = (new static)->getTable();
        return $query->withoutGlobalScope('school')->where("{$table}.school_id", $schoolId);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = ['school_id', 'key', 'value'];

    /**
     * Cache key prefix untuk settings.
     * Dipisahkan per school_id agar settings tiap sekolah tidak bentrok.
     * Cache di-invalidate otomatis saat setting diubah via set().
     */
    const CACHE_TTL = 3600; // 1 jam

    /**
     * Bangun cache key berdasarkan school_id.
     * Sekolah berbeda = cache key berbeda = data tidak campur.
     */
    protected static function cacheKey(?int $schoolId = null): string
    {
        $id = $schoolId ?? static::resolveSchoolId();
        return 'app_settings_school_' . ($id ?? 'global');
    }

    protected static function resolveSchoolId(): ?int
    {
        if (!auth()->hasUser()) {
            return null;
        }

        $user = auth()->user();

        // Jika user adalah Super Admin Yayasan (tidak punya school_id bawaan)
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin') && (!isset($user->school_id) || $user->school_id === null)) {
            $sessionSchoolId = session('active_school_id');
            if ($sessionSchoolId) {
                return (int) $sessionSchoolId;
            }
            return null;
        }

        return $user->school_id;
    }

    /**
     * Ambil satu setting berdasarkan key, difilter per sekolah.
     * Semua setting di-load sekaligus dalam satu query dan di-cache.
     * Query ke DB hanya terjadi 1x per jam, bukan setiap pemanggilan.
     *
     * Contoh: Setting::get('school_name')
     */
    public static function get($key, $default = null, ?int $schoolId = null): mixed
    {
        $schoolId ??= static::resolveSchoolId();
        $cacheKey = static::cacheKey($schoolId);

        $all = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($schoolId) {
            return static::when(
                $schoolId !== null,
                fn($q) => $q->where('school_id', $schoolId),
                fn($q) => $q->whereNull('school_id'),
            )->pluck('value', 'key')->toArray();
        });

        return $all[$key] ?? $default;
    }

    /**
     * Simpan setting untuk sekolah yang aktif dan invalidate cache.
     */
    public static function set($key, $value, ?int $schoolId = null): static
    {
        $schoolId ??= static::resolveSchoolId();

        $result = static::updateOrCreate(
            ['school_id' => $schoolId, 'key' => $key],
            ['value' => $value]
        );

        Cache::forget(static::cacheKey($schoolId));

        return $result;
    }

    /**
     * Ambil semua settings sekaligus untuk sekolah yang aktif.
     * Digunakan di halaman Pengaturan.
     */
    public static function all($columns = ['*']): \Illuminate\Database\Eloquent\Collection
    {
        $schoolId = static::resolveSchoolId();
        $cacheKey = static::cacheKey($schoolId) . '_collection';

        $items = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($schoolId) {
            return static::when(
                $schoolId !== null,
                fn($q) => $q->where('school_id', $schoolId),
                fn($q) => $q->whereNull('school_id'),
            )->get()->toArray();
        });

        return static::hydrate($items);
    }

    /**
     * Invalidate semua cache settings untuk sekolah tertentu.
     */
    public static function clearCache(?int $schoolId = null): void
    {
        $schoolId ??= static::resolveSchoolId();
        $key = static::cacheKey($schoolId);
        Cache::forget($key);
        Cache::forget($key . '_collection');
    }

    // ── Backward-compat: nama cache lama ─────────────────────────────────────
    // Dihapus saat semua code sudah migrasi ke multi-tenant
    const CACHE_KEY = 'app_settings_all'; // @deprecated — gunakan cacheKey()
}

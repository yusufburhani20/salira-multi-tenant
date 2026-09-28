<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ── Relationships ──────────────────────────────────────────────────────────

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function academicClasses(): HasMany
    {
        return $this->hasMany(AcademicClass::class);
    }

    public function academicYears(): HasMany
    {
        return $this->hasMany(AcademicYear::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class);
    }

    public function announcements(): HasMany
    {
        return $this->hasMany(Announcement::class);
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function inventoryCategories(): HasMany
    {
        return $this->hasMany(InventoryCategory::class);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function financeCategories(): HasMany
    {
        return $this->hasMany(FinanceCategory::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function computerLabs(): HasMany
    {
        return $this->hasMany(ComputerLab::class);
    }

    public function geofences(): HasMany
    {
        return $this->hasMany(Geofence::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Label tampilan untuk type sekolah
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            'SMK' => 'SMK',
            'MTs' => 'Madrasah Tsanawiyah',
            'MA'  => 'Madrasah Aliyah',
            'SMA' => 'SMA',
            'SD'  => 'Sekolah Dasar',
            default => $this->type,
        };
    }

    /**
     * Ambil sekolah aktif berdasarkan user yang login.
     * Jika user adalah Super Admin (school_id = null), kembalikan null.
     */
    public static function ofCurrentUser(): ?self
    {
        $schoolId = auth()->user()?->school_id;
        return $schoolId ? self::find($schoolId) : null;
    }
}

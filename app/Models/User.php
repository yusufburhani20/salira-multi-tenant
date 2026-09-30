<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use App\Enums\UserStatus;
use App\Models\Concerns\BelongsToSchool;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, BelongsToSchool;

    /**
     * Override Spatie's hasRole to provide a standardized wrapper
     * (Optional, since Spatie already has hasRole, we can just use the trait's method directly, 
     * but we will add explicit context checkers below).
     */

    protected $guarded = ['id'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'status' => UserStatus::class,
        'last_login_at' => 'datetime',
    ];

    public function classesAsHomeroom()
    {
        return $this->hasMany(AcademicClass::class, 'homeroom_teacher_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'teacher_id');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function recordedStudentAttendances()
    {
        return $this->hasMany(StudentAttendance::class, 'recorded_by');
    }

    public function eventAttendances()
    {
        return $this->hasMany(EventAttendance::class);
    }

    public function classAgendas()
    {
        return $this->hasMany(ClassAgenda::class, 'teacher_id');
    }

    public function studentConsultations()
    {
        return $this->hasMany(StudentConsultation::class, 'teacher_id');
    }

    public function permissionRequests()
    {
        return $this->hasMany(PermissionRequest::class);
    }

    public function approvedPermissions()
    {
        return $this->hasMany(PermissionRequest::class, 'approved_by');
    }

    public function inventoryLogs()
    {
        return $this->hasMany(InventoryLog::class);
    }

    public function sessions()
    {
        return $this->hasMany(Session::class);
    }

    public function pushSubscriptions()
    {
        return $this->morphMany(PushSubscription::class, 'subscribable');
    }

    public function isOnline()
    {
        return $this->sessions()->where('last_activity', '>=', now()->subMinutes(5)->getTimestamp())->exists();
    }

    public function driveFiles()
    {
        return $this->morphMany(DriveFile::class, 'owner');
    }

    public function sharedDriveFiles()
    {
        return $this->morphMany(DriveFileShare::class, 'shared_to');
    }

    /**
     * Relasi Pivot untuk Role Wali Kelas
     * Mengembalikan kelas-kelas yang mana user ini menjadi wali kelasnya.
     */
    public function classTeacherContexts()
    {
        return $this->belongsToMany(AcademicClass::class, 'class_teachers', 'user_id', 'academic_class_id')
                    ->withoutGlobalScope('active_year')
                    ->withTimestamps();
    }

    /**
     * Relasi Pivot untuk Role Kepala Program Keahlian
     * Mengembalikan program-program yang mana user ini menjadi kepalanya.
     */
    public function programHeadContexts()
    {
        // Karena model Program belum ada, kita pakai referensi langsung atau biarkan kosong sementara
        // Return BelongsToMany jika Model Program sudah dibuat.
        // Asumsi model Program ada di App\Models\Program
        return $this->belongsToMany(\App\Models\Program::class, 'program_heads', 'user_id', 'program_id')->withTimestamps();
    }

    /**
     * Helper untuk cek apakah user adalah wali kelas dari kelas spesifik
     */
    public function isClassTeacherOf($classId)
    {
        return $this->classTeacherContexts()->where('academic_class_id', $classId)->exists();
    }

    /**
     * Helper untuk cek apakah user adalah kepala program dari program spesifik
     */
    public function isProgramHeadOf($programId)
    {
        return $this->programHeadContexts()->where('program_id', $programId)->exists();
    }
    
    public function deviceTokens()
    {
        return $this->morphMany(DeviceToken::class, 'tokenable');
    }

    // ── Multi-School Support ───────────────────────────────────────────────────

    /**
     * Sekolah-sekolah TAMBAHAN tempat user ini juga bertugas.
     * Sekolah utama ada di kolom school_id.
     */
    public function schoolAssignments()
    {
        return $this->hasMany(UserSchoolAssignment::class);
    }

    /**
     * Semua sekolah yang bisa diakses user ini:
     * sekolah utama (school_id) + semua sekolah tambahan yang aktif.
     * Mengembalikan Collection of School.
     */
    public function allSchools()
    {
        $primarySchool = $this->school_id
            ? School::where('id', $this->school_id)->get()
            : collect();

        $additionalSchools = School::whereIn(
            'id',
            $this->schoolAssignments()->active()->pluck('school_id')
        )->get();

        return $primarySchool->merge($additionalSchools)->unique('id')->values();
    }

    /**
     * Semua school_id yang bisa diakses user (primary + tambahan aktif).
     * Berguna untuk query filtering.
     */
    public function allSchoolIds(): array
    {
        $ids = $this->schoolAssignments()->active()->pluck('school_id')->toArray();

        if ($this->school_id) {
            array_unshift($ids, $this->school_id);
        }

        return array_unique($ids);
    }

    /**
     * Apakah user ini mengajar di lebih dari satu sekolah?
     */
    public function isMultiSchool(): bool
    {
        return $this->schoolAssignments()->active()->exists();
    }

    /**
     * Apakah user ini punya akses ke sekolah tertentu?
     * (baik sebagai sekolah utama maupun sekolah tambahan)
     */
    public function hasAccessToSchool(int $schoolId): bool
    {
        if ($this->school_id === $schoolId) {
            return true;
        }

        return $this->schoolAssignments()
            ->active()
            ->where('school_id', $schoolId)
            ->exists();
    }
}

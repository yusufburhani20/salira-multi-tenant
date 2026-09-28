<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use App\Enums\Gender;
use App\Enums\StudentStatus;
use App\Models\Concerns\BelongsToSchool;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Student extends Authenticatable
{
    use HasApiTokens, Notifiable, BelongsToSchool;

    protected $guarded = ['id'];
    protected $casts = [
        'birth_date' => 'date:Y-m-d',
        'gender' => Gender::class,
        'status' => StudentStatus::class,
    ];
    protected $appends = ['academic_class', 'academic_class_id', 'photo_url'];

    public function getPhotoUrlAttribute()
    {
        return $this->photo ? asset('storage/' . $this->photo) : null;
    }

    public function getAcademicClassAttribute()
    {
        return $this->academicClasses->where('pivot.is_active', true)->last();
    }

    public function getAcademicClassIdAttribute()
    {
        // Safe null coalescing
        $ac = $this->academic_class;
        return $ac ? $ac->id : null;
    }

    public function academicClasses()
    {
        return $this->belongsToMany(AcademicClass::class, 'class_members', 'student_id', 'class_id')->withoutGlobalScope('active_year')->withPivot('is_active')->withTimestamps();
    }

    public function attendances()
    {
        return $this->hasMany(StudentAttendance::class);
    }

    public function consultations()
    {
        return $this->hasMany(StudentConsultation::class);
    }

    public function pushSubscriptions()
    {
        return $this->morphMany(PushSubscription::class, 'subscribable');
    }

    public function routeNotificationForMail($notification)
    {
        return $this->parent_email;
    }

    public function driveFiles()
    {
        return $this->morphMany(DriveFile::class, 'owner');
    }

    public function sharedDriveFiles()
    {
        return $this->morphMany(DriveFileShare::class, 'shared_to');
    }

    public function deviceTokens()
    {
        return $this->morphMany(DeviceToken::class, 'tokenable');
    }
}

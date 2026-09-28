<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchool;
use App\Enums\DayOfWeek;

class Schedule extends Model
{
    use BelongsToSchool;

    protected $guarded = ['id'];
    use BelongsToSchool;

    protected $casts = [
        'day' => DayOfWeek::class,
    ];

    public function academicClass()
    {
        return $this->belongsTo(AcademicClass::class, 'class_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classAgendas()
    {
        return $this->hasMany(ClassAgenda::class);
    }
}


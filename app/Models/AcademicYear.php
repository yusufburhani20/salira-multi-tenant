<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchool;

class AcademicYear extends Model
{
    use BelongsToSchool;

    protected $guarded = ['id'];

    public function semesters()
    {
        return $this->hasMany(Semester::class);
    }

    public function academicClasses()
    {
        return $this->hasMany(AcademicClass::class);
    }
}

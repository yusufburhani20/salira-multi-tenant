<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchool;

class AcademicClass extends Model
{
    use BelongsToSchool;
    protected $guarded = ['id'];

    protected static function booted()
    {
        static::addGlobalScope('active_year', function ($builder) {
            // Skip global scope if we are querying specific class ID(s) (eager/lazy loading, find, etc.)
            foreach ($builder->getQuery()->wheres as $where) {
                if (isset($where['column']) && is_string($where['column'])) {
                    $columnWithoutBackticks = str_replace('`', '', $where['column']);
                    $segments = explode('.', $columnWithoutBackticks);
                    if (end($segments) === 'id') {
                        return;
                    }
                }
            }

            $user = null;
            if (auth()->guard('web')->hasUser()) $user = auth()->guard('web')->user();
            elseif (auth()->guard('student')->hasUser()) $user = auth()->guard('student')->user();
            elseif (auth()->guard('sanctum')->hasUser()) $user = auth()->guard('sanctum')->user();

            $schoolId = $user ? $user->school_id : null;
            if (request()->hasSession() && session()->has('active_school_id')) {
                $schoolId = session('active_school_id') ?: $schoolId;
            }

            $cacheKey = 'active_academic_year_id_' . ($schoolId ?? 'all');

            $activeYearIds = \Illuminate\Support\Facades\Cache::remember($cacheKey, 3600, function () use ($schoolId) {
                $query = \Illuminate\Support\Facades\DB::table('academic_years')->where('is_active', true);
                if ($schoolId) {
                    $query->where('school_id', $schoolId);
                }
                return $query->pluck('id')->toArray();
            });

            if (!empty($activeYearIds)) {
                $builder->whereIn($builder->getModel()->getTable() . '.academic_year_id', $activeYearIds);
            }
        });
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->withoutGlobalScope('active_year')
            ->where($field ?? $this->getRouteKeyName(), $value)
            ->firstOrFail();
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function homeroomTeacher()
    {
        return $this->belongsTo(User::class, 'homeroom_teacher_id');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'class_members', 'class_id', 'student_id')->withPivot('is_active')->withTimestamps();
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'class_id');
    }

    public function studentConsultations()
    {
        return $this->hasMany(StudentConsultation::class, 'class_id');
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'academic_class_subject', 'academic_class_id', 'subject_id')->withTimestamps();
    }
}

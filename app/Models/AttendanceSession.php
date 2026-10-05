<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSession extends Model
{
    protected $guarded = ['id'];
    
    protected $casts = [
        'days_of_week' => 'array',
        'is_active' => 'boolean',
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    public function logs()
    {
        return $this->hasMany(AttendanceLog::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class AttendanceLog extends Model
{
    protected $guarded = ['id'];
    
    protected $casts = [
        'date' => 'date:Y-m-d',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];
    
    protected $appends = ['photo_url'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function session()
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }

    public function getPhotoUrlAttribute()
    {
        return $this->photo_path ? Storage::url($this->photo_path) : null;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'title',
        'content',
        'type',
        'target',
        'expires_at',
        'is_active',
    ];
}


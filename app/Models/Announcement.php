<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchool;

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


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriveFolder extends Model
{
    use HasFactory;

    use BelongsToSchool;

    protected $fillable = ['owner_type', 'owner_id', 'name', 'parent_id', 'is_public', 'public_token'];

    public function generatePublicToken()
    {
        return \Illuminate\Support\Str::random(64);
    }

    public function owner()
    {
        return $this->morphTo();
    }

    public function parent()
    {
        return $this->belongsTo(DriveFolder::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(DriveFolder::class, 'parent_id');
    }

    public function files()
    {
        return $this->hasMany(DriveFile::class, 'folder_id');
    }

    public function shares()
    {
        return $this->hasMany(DriveFolderShare::class);
    }
}


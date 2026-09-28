<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ComputerLab extends Model
{
    use BelongsToSchool;

    protected $guarded = ['id'];

    public function units()
    {
        return $this->hasMany(ComputerUnit::class, 'lab_id');
    }
}


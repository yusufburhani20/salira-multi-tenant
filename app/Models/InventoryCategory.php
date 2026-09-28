<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryCategory extends Model
{
    use BelongsToSchool;

    protected $guarded = ['id'];

    public function items()
    {
        return $this->hasMany(InventoryItem::class, 'category_id');
    }
}


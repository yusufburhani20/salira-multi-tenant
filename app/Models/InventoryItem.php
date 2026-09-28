<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchool;
use App\Enums\InventoryCondition;
use App\Enums\InventoryStatus;

class InventoryItem extends Model
{
    use BelongsToSchool;

    protected $guarded = ['id'];
    use BelongsToSchool;

    protected $casts = [
        'condition' => InventoryCondition::class,
        'status' => InventoryStatus::class,
        'unit_price' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    public function barcodes()
    {
        return $this->hasMany(InventoryBarcode::class, 'item_id');
    }

    public function logs()
    {
        return $this->hasMany(InventoryLog::class, 'item_id');
    }
}


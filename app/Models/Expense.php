<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToSchool;

class Expense extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'category_id', 'amount', 'date', 'description', 'recorded_by', 'attachment'
    ];

    use BelongsToSchool;

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(FinanceCategory::class, 'category_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}


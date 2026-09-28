<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinanceCategory extends Model
{
    use BelongsToSchool;

    protected $fillable = ['name', 'type', 'description'];

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'category_id');
    }

    public function bills()
    {
        return $this->hasMany(Bill::class, 'category_id');
    }
}


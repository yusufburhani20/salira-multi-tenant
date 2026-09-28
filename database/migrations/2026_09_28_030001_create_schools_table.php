<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name');                                              // "SMK Idrisiyyah"
            $table->enum('type', ['SMK', 'MTs', 'MA', 'SD', 'SMA'])->default('SMK');
            $table->string('npsn')->nullable()->unique();                        // Nomor Pokok Sekolah Nasional
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('logo')->nullable();                                  // Path ke logo sekolah (opsional, bisa pakai settings)
            $table->string('principal_name')->nullable();                        // Nama kepala sekolah
            $table->string('principal_nip')->nullable();                         // NIP kepala sekolah
            $table->string('slug')->unique()->nullable();                        // Untuk URL: smk, mts, ma
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};

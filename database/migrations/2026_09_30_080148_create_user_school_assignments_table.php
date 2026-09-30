<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel pivot untuk guru/staff yang mengajar di lebih dari satu sekolah.
     *
     * Konteks:
     * - User tetap memiliki school_id (sekolah utama/induk) di tabel users.
     * - Tabel ini HANYA mencatat sekolah TAMBAHAN tempat user juga bertugas.
     * - Role tetap global mengikuti user, tidak berbeda per sekolah.
     * - Saat check-in absensi, user memilih "sedang di sekolah mana" (active_school_id di session).
     *
     * Contoh: Pak Ahmad (school_id=1/SMK) juga mengajar di MTs (school_id=2) dan MA (school_id=3).
     * Maka akan ada 2 record di tabel ini: (user_id=X, school_id=2) dan (user_id=X, school_id=3).
     */
    public function up(): void
    {
        Schema::create('user_school_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('school_id')
                  ->constrained('schools')
                  ->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Satu user hanya boleh punya satu assignment ke sekolah yang sama
            $table->unique(['user_id', 'school_id'], 'uq_user_school_assignment');

            $table->index('user_id', 'idx_usa_user');
            $table->index('school_id', 'idx_usa_school');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_school_assignments');
    }
};

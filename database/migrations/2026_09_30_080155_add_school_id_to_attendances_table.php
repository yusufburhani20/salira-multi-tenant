<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahkan school_id ke tabel attendances.
     *
     * Konteks: Guru yang mengajar di lebih dari 1 sekolah bisa check-in di
     * sekolah manapun. school_id mencatat DI MANA guru tersebut absen hari itu.
     * Rekap absensi guru tetap digabung (query by user_id), tapi bisa
     * difilter per sekolah oleh admin masing-masing sekolah.
     *
     * Nullable karena data attendance yang sudah ada sebelumnya tidak punya school context.
     * Akan diisi dari users.school_id melalui seeder/backfill jika diperlukan.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (! Schema::hasColumn('attendances', 'school_id')) {
                $table->foreignId('school_id')
                      ->nullable()
                      ->after('user_id')
                      ->constrained('schools')
                      ->nullOnDelete();

                $table->index('school_id', 'idx_attendances_school');
            }
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'school_id')) {
                try { $table->dropIndex('idx_attendances_school'); } catch (\Throwable) {}
                try { $table->dropForeign(['school_id']); } catch (\Throwable) {}
                $table->dropColumn('school_id');
            }
        });
    }
};

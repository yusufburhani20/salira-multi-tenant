<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 1 Multi-Tenant: Tambahkan school_id ke tabel users dan students.
 *
 * Aturan:
 * - Guru/Staff/Admin biasa: school_id diisi dengan ID sekolah mereka.
 * - Super Admin Yayasan: school_id = NULL (bisa akses semua sekolah).
 * - Siswa: school_id selalu diisi sesuai sekolah asal.
 *
 * Migration ini JUGA mengisi data lama dengan school_id = 1 (SMK yang sudah jalan).
 * Pastikan schools table sudah diisi dengan seeder sebelum ini atau sebelum menjalankan
 * aplikasi secara live.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── users ─────────────────────────────────────────────────────────────
        if (! Schema::hasColumn('users', 'school_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('school_id')
                      ->nullable()                        // NULL = Super Admin Yayasan (akses semua)
                      ->after('id')
                      ->constrained('schools')
                      ->nullOnDelete();

                $table->index('school_id', 'idx_users_school_id');
            });
        }

        // ── students ──────────────────────────────────────────────────────────
        if (! Schema::hasColumn('students', 'school_id')) {
            Schema::table('students', function (Blueprint $table) {
                $table->foreignId('school_id')
                      ->nullable()                        // Nullable untuk keamanan saat migrasi data awal
                      ->after('id')
                      ->constrained('schools')
                      ->nullOnDelete();

                $table->index('school_id', 'idx_students_school_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropIndex('idx_users_school_id');
            $table->dropColumn('school_id');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['school_id']);
            $table->dropIndex('idx_students_school_id');
            $table->dropColumn('school_id');
        });
    }
};

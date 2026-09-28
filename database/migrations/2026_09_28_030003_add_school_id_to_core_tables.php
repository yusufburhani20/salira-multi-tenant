<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 2 Multi-Tenant: Tambahkan school_id ke semua tabel inti.
 *
 * Tabel yang diproses dalam migration ini:
 *  1. academic_years
 *  2. academic_classes
 *  3. subjects
 *  4. schedules
 *  5. geofences
 *  6. announcements
 *  7. inventory_categories
 *  8. inventory_items
 *  9. bills
 * 10. finance_categories
 * 11. expenses
 * 12. events
 * 13. computer_labs
 * 14. settings
 * 15. drive_folders
 *
 * Semua kolom school_id bersifat nullable untuk kompatibilitas data existing.
 * Jalankan AssignExistingDataToSchoolSeeder setelah migration ini.
 */
return new class extends Migration
{
    /**
     * Daftar tabel yang akan ditambahkan school_id.
     * Format: [nama_tabel, nama_index]
     */
    private array $tables = [
        ['academic_years',       'idx_academic_years_school'],
        ['academic_classes',     'idx_academic_classes_school'],
        ['subjects',             'idx_subjects_school'],
        ['schedules',            'idx_schedules_school'],
        ['geofences',            'idx_geofences_school'],
        ['announcements',        'idx_announcements_school'],
        ['inventory_categories', 'idx_inv_categories_school'],
        ['inventory_items',      'idx_inv_items_school'],
        ['bills',                'idx_bills_school'],
        ['finance_categories',   'idx_finance_cat_school'],
        ['expenses',             'idx_expenses_school'],
        ['events',               'idx_events_school'],
        ['computer_labs',        'idx_computer_labs_school'],
        ['settings',             'idx_settings_school'],
        ['drive_folders',        'idx_drive_folders_school'],
    ];

    public function up(): void
    {
        foreach ($this->tables as [$table, $index]) {
            if (! Schema::hasColumn($table, 'school_id')) {
                Schema::table($table, function (Blueprint $blueprint) use ($index) {
                    $blueprint->foreignId('school_id')
                              ->nullable()
                              ->after('id')
                              ->constrained('schools')
                              ->nullOnDelete();

                    $blueprint->index('school_id', $index);
                });
            }
        }

        // ── settings: tambahkan index komposit (school_id, key) ──────────────
        // Settings akan diquery selalu bersamaan school_id + key
        if (Schema::hasTable('settings') && Schema::hasColumn('settings', 'school_id')) {
            Schema::table('settings', function (Blueprint $blueprint) {
                // Drop unique index lama jika ada (key saja sudah tidak unik lagi karena per-sekolah)
                if (Schema::hasIndex('settings', 'settings_key_unique')) {
                    $blueprint->dropUnique('settings_key_unique');
                }

                // Tambah unique composite: satu key hanya boleh ada sekali per sekolah
                if (!Schema::hasIndex('settings', 'uq_settings_school_key')) {
                    $blueprint->unique(['school_id', 'key'], 'uq_settings_school_key');
                }
            });
        }
    }

    public function down(): void
    {
        // Hapus composite index di settings terlebih dulu
        if (Schema::hasTable('settings') && Schema::hasColumn('settings', 'school_id')) {
            Schema::table('settings', function (Blueprint $blueprint) {
                try { $blueprint->dropUnique('uq_settings_school_key'); } catch (\Throwable) {}
            });
        }

        foreach (array_reverse($this->tables) as [$table, $index]) {
            if (Schema::hasColumn($table, 'school_id')) {
                Schema::table($table, function (Blueprint $blueprint) use ($index) {
                    try { $blueprint->dropIndex($index); } catch (\Throwable) {}
                    try { $blueprint->dropForeign(['school_id']); } catch (\Throwable) {}
                    $blueprint->dropColumn('school_id');
                });
            }
        }
    }
};

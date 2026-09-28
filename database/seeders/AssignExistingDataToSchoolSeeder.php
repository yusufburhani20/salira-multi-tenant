<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeder untuk mengisi school_id = 1 pada semua data existing (SMK).
 *
 * Jalankan setelah SchoolSeeder dan semua migration add_school_id:
 *   php artisan db:seed --class=AssignExistingDataToSchoolSeeder
 *
 * HANYA DIJALANKAN SEKALI saat migrasi awal ke multi-tenant.
 */
class AssignExistingDataToSchoolSeeder extends Seeder
{
    public function run(): void
    {
        $schoolId = 1; // SMK Idrisiyyah

        $this->command->info("Mengisi school_id = {$schoolId} untuk semua data existing...");

        /**
         * Daftar tabel yang perlu diisi.
         * Format: [nama_tabel, label_tampilan]
         */
        $tables = [
            // Fase 1
            ['users',               'users'],
            ['students',            'students'],
            // Fase 2
            ['academic_years',      'academic_years'],
            ['academic_classes',    'academic_classes'],
            ['subjects',            'subjects'],
            ['schedules',           'schedules'],
            ['geofences',           'geofences'],
            ['announcements',       'announcements'],
            ['inventory_categories','inventory_categories'],
            ['inventory_items',     'inventory_items'],
            ['bills',               'bills'],
            ['finance_categories',  'finance_categories'],
            ['expenses',            'expenses'],
            ['events',              'events'],
            ['computer_labs',       'computer_labs'],
            ['settings',            'settings'],
            ['drive_folders',       'drive_folders'],
        ];

        foreach ($tables as [$table, $label]) {
            if (! \Illuminate\Support\Facades\Schema::hasTable($table)) {
                $this->command->warn("  ⚠ Tabel '{$table}' tidak ditemukan, dilewati.");
                continue;
            }

            if (! \Illuminate\Support\Facades\Schema::hasColumn($table, 'school_id')) {
                $this->command->warn("  ⚠ Tabel '{$table}' belum punya kolom school_id, dilewati.");
                continue;
            }

            $updated = DB::table($table)->whereNull('school_id')->update(['school_id' => $schoolId]);
            $this->command->line("  ✓ {$label}: {$updated} baris diupdate");
        }

        // Invalidate semua cache settings agar setting per-sekolah langsung aktif
        \Illuminate\Support\Facades\Cache::forget('app_settings_all');
        \Illuminate\Support\Facades\Cache::forget('app_settings_all_collection_array');
        \Illuminate\Support\Facades\Cache::forget('app_settings_school_1');
        \Illuminate\Support\Facades\Cache::forget('app_settings_school_1_collection');

        $this->command->newLine();
        $this->command->info("✅ Selesai! Semua data existing sudah ditandai sebagai milik sekolah ID: {$schoolId}");
    }
}

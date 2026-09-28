<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

/**
 * Seeder untuk data sekolah awal.
 *
 * Jalankan: php artisan db:seed --class=SchoolSeeder
 *
 * PENTING: Jalankan ini SEBELUM migration add_school_id,
 * atau setelah migration dengan artisan db:seed --class=SchoolSeeder,
 * kemudian baru update school_id di tabel users dan students.
 */
class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        School::firstOrCreate(
            ['id' => 1],
            [
                'name'           => 'SMK Idrisiyyah',
                'type'           => 'SMK',
                'npsn'           => null,   // Isi dengan NPSN asli
                'slug'           => 'smk',
                'principal_name' => null,   // Isi dengan nama kepala sekolah
                'is_active'      => true,
            ]
        );

        // Uncomment saat ingin menambahkan sekolah berikutnya:
        //
        // School::firstOrCreate(
        //     ['id' => 2],
        //     [
        //         'name'           => 'MTs Idrisiyyah',
        //         'type'           => 'MTs',
        //         'slug'           => 'mts',
        //         'is_active'      => true,
        //     ]
        // );
        //
        // School::firstOrCreate(
        //     ['id' => 3],
        //     [
        //         'name'           => 'MA Idrisiyyah',
        //         'type'           => 'MA',
        //         'slug'           => 'ma',
        //         'is_active'      => true,
        //     ]
        // );
    }
}

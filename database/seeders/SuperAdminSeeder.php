<?php

namespace Database\Seeders;

use App\Models\User;
use App\Enums\UserStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeder untuk membuat akun Super Admin Yayasan.
 *
 * Super Admin Yayasan memiliki:
 * - school_id = NULL (bisa akses data semua sekolah)
 * - Role "Super Admin"
 *
 * Jalankan: php artisan db:seed --class=SuperAdminSeeder
 *
 * PENTING: Ganti email dan password setelah selesai setup!
 */
class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'superadmin@yayasan-idrisiyyah.sch.id';

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name'      => 'Super Admin Yayasan',
                'email'     => $email,
                'password'  => Hash::make('Salira@2025!'), // Ganti setelah login pertama!
                'school_id' => null,                        // NULL = akses semua sekolah
                'status'    => UserStatus::active,
                'nip'       => null,
                'phone'     => null,
            ]
        );

        // Assign role Super Admin
        if (! $user->hasRole('Super Admin')) {
            $user->assignRole('Super Admin');
        }

        $this->command->info("✅ Super Admin Yayasan berhasil dibuat:");
        $this->command->table(
            ['Field', 'Value'],
            [
                ['Email',     $email],
                ['Password',  'Salira@2025! (segera ganti setelah login!)'],
                ['school_id', 'NULL (akses semua sekolah)'],
                ['Role',      'Super Admin'],
            ]
        );
    }
}

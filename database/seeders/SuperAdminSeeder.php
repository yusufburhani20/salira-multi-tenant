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
 */
class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'adminyayasan@idrisiyyah.sch.id';
        $nip = 'adminyayasan';
        $password = 'password';

        // Cari user yang punya role Super Admin, atau buat baru
        $user = User::role('Super Admin')->first() ?? clone new User;

        $user->fill([
            'name'      => 'Super Admin Yayasan',
            'email'     => $email,
            'password'  => Hash::make($password),
            'school_id' => null,
            'status'    => UserStatus::active,
            'nip'       => $nip,
        ]);
        
        $user->save();

        // Assign role Super Admin
        if (! $user->hasRole('Super Admin')) {
            $user->assignRole('Super Admin');
        }

        $this->command->info("✅ Super Admin Yayasan berhasil diperbarui:");
        $this->command->table(
            ['Field', 'Value'],
            [
                ['Email / NIP (Username)', "$email / $nip"],
                ['Password',  $password],
                ['school_id', 'NULL (akses semua sekolah)'],
                ['Role',      'Super Admin'],
            ]
        );
    }
}

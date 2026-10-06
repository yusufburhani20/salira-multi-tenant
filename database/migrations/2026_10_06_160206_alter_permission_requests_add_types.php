<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ubah enum untuk menambahkan izin_pribadi, izin_dinas, libur_bergantian, dan dinas_luar
        DB::statement("ALTER TABLE permission_requests MODIFY COLUMN `type` ENUM('sakit','izin','cuti','dispensasi','izin_pribadi','izin_dinas','libur_bergantian','dinas_luar') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE permission_requests MODIFY COLUMN `type` ENUM('sakit','izin','cuti','dispensasi') NOT NULL");
    }
};

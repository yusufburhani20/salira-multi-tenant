<?php

namespace App\Enums;

enum PermissionType: string
{
    case sakit = 'sakit';
    case izin = 'izin';
    case izin_pribadi = 'izin_pribadi';
    case izin_dinas = 'izin_dinas';
    case cuti = 'cuti';
    case dispensasi = 'dispensasi';
    case libur_bergantian = 'libur_bergantian';
    case dinas_luar = 'dinas_luar';

    public function label(): string
    {
        return match($this) {
            self::sakit          => 'Sakit',
            self::izin           => 'Izin',
            self::izin_pribadi   => 'Izin Pribadi',
            self::izin_dinas     => 'Izin Dinas',
            self::cuti           => 'Cuti',
            self::dispensasi     => 'Dispensasi',
            self::libur_bergantian => 'Libur Bergantian',
            self::dinas_luar     => 'Dinas Luar',
        };
    }
}

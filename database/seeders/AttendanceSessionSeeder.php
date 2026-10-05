<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AttendanceSession;

class AttendanceSessionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sessions = [
            [
                'name' => 'Presensi GTK',
                'type' => 'gtk',
                'days_of_week' => [1, 2, 3, 4, 5, 6], // Mon-Sat
                'start_time' => '06:00:00',
                'end_time' => '08:00:00',
            ],
            [
                'name' => 'Shalat Dzuhur Berjamaah',
                'type' => 'shalat',
                'days_of_week' => [1, 2, 3, 4, 5, 6],
                'start_time' => '11:30:00',
                'end_time' => '14:00:00',
            ],
            [
                'name' => 'Presensi Pulang',
                'type' => 'pulang',
                'days_of_week' => [1, 2, 3, 4, 5, 6],
                'start_time' => '15:00:00',
                'end_time' => '18:00:00',
            ],
            [
                'name' => 'Kajian Ilmiah',
                'type' => 'kajian',
                'days_of_week' => [3], // Wednesday
                'start_time' => '04:30:00',
                'end_time' => '08:00:00',
            ],
            [
                'name' => 'Kajian Makhsus',
                'type' => 'kajian',
                'days_of_week' => [4], // Thursday
                'start_time' => '18:00:00',
                'end_time' => '23:00:00',
            ]
        ];

        foreach ($sessions as $session) {
            AttendanceSession::create($session);
        }
    }
}

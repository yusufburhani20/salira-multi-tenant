import React from 'react';
import { Link } from '@inertiajs/react';

export default function MobileDashboard({ stats, studentsPerClass, chartData, activeSemester }: any) {
    return (
        <div className="flex flex-col w-full pb-20 font-body-md text-body-md text-on-surface antialiased bg-surface">
            {/* Top Vibrant Royal Hero Section */}
            <div className="relative bg-primary-container text-on-primary px-gutter-sm pt-space-md pb-10 overflow-hidden">
                <div className="relative z-10 flex flex-col gap-space-sm">
                    {/* Live Status & Clock Pill */}
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/20 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
                            <span className="font-label-sm text-label-sm font-semibold tracking-wider text-on-primary uppercase">Sistem Aktif</span>
                        </div>
                        <span className="font-label-sm text-label-sm tracking-wide font-medium text-on-primary">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    {/* Welcome Headings */}
                    <div className="mt-1">
                        <p className="font-headline-sm text-headline-sm font-semibold text-on-primary tracking-tight">Selamat Datang</p>
                        <p className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-primary tracking-tight leading-tight mt-0.5">Optimalkan Pengelolaan Akademik</p>
                        <p className="font-body-sm text-body-sm mt-1 text-on-primary">Pantau presensi, penilaian kelas, dan inventaris secara real-time.</p>
                    </div>
                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-space-xs mt-space-sm">
                        <Link href={route('portal.attendance.scanner')} className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-surface-container-lowest text-primary font-title text-title active:scale-[0.98] transition-transform">
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                            <span className="font-headline-sm text-[13px] font-bold">Presensi Pegawai</span>
                        </Link>
                        <Link href={route('admin.reports.index')} className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-surface-container-lowest/15 backdrop-blur-md text-on-primary font-title text-title hover:bg-surface-container-lowest/25 active:scale-[0.98] transition-all">
                            <span className="material-symbols-outlined text-[20px]">assignment</span>
                            <span className="font-headline-sm text-[13px] font-semibold">Akses Laporan</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Sheet with Smooth Rounded Top Edge */}
            <div className="relative -mt-6 bg-surface-container-lowest rounded-t-3xl px-gutter-sm pt-space-lg pb-space-xl flex flex-col gap-space-lg">
                {/* Filter & Scope Bar */}
                <div className="flex items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-full">
                        <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">Semua Kelas ({studentsPerClass?.length || 0} Rombel)</span>
                    </div>
                    <div className="flex items-center gap-1 bg-secondary-container/40 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        <span className="font-label-sm text-label-sm text-on-secondary-container font-semibold">{activeSemester?.name || 'Semester Aktif'}</span>
                    </div>
                </div>

                {/* 4 Key Academic Metrics (2x2 Compact Grid) */}
                <div className="grid grid-cols-2 gap-space-xs">
                    {/* Metric 1 */}
                    <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between min-h-[102px]">
                        <div className="flex items-center justify-between">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Siswa Hadir</span>
                            <div className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[18px]">group</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">{stats?.students_present || 0}</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-surface-container-highest font-label-sm text-[10px] text-on-surface-variant font-medium">Hari ini</span>
                        </div>
                    </div>
                    {/* Metric 2 */}
                    <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between min-h-[102px]">
                        <div className="flex items-center justify-between">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Izin / Sakit</span>
                            <div className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center text-tertiary">
                                <span className="material-symbols-outlined text-[18px]">local_hospital</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">{stats?.students_permit || 0}</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">siswa</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-surface-container-highest font-label-sm text-[10px] text-on-surface-variant font-medium">Surat keterangan ada</span>
                        </div>
                    </div>
                    {/* Metric 3 */}
                    <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between min-h-[102px]">
                        <div className="flex items-center justify-between">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Konsultasi BK</span>
                            <div className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-[18px]">support_agent</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">{stats?.consultations_pending || 0}</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">tiket</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-surface-container-highest font-label-sm text-[10px] text-on-surface-variant font-medium">Layanan tertunda</span>
                        </div>
                    </div>
                    {/* Metric 4 */}
                    <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between min-h-[102px]">
                        <div className="flex items-center justify-between">
                            <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant">Pinjam Sarpras</span>
                            <div className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary-container">
                                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">{stats?.items_borrowed || 0}</span>
                                <span className="font-label-sm text-label-sm text-on-surface-variant">Aset</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-primary-fixed font-label-sm text-[10px] text-on-primary-fixed-variant font-semibold">Aktif Dipinjam</span>
                        </div>
                    </div>
                </div>

                {/* Rombel Presence Breakdown Cards */}
                {studentsPerClass && studentsPerClass.length > 0 && (
                    <div className="flex flex-col gap-space-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Distribusi Absensi Rombel</h2>
                            </div>
                        </div>
                        <div className="flex gap-space-xs overflow-x-auto pb-2 -mx-gutter-sm px-gutter-sm scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                            {studentsPerClass.map((cls: any, idx: number) => (
                                <div key={idx} className="min-w-[150px] bg-surface-container-low p-3 rounded-xl flex flex-col justify-between flex-shrink-0">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-label-md text-label-md font-bold text-on-surface">{cls.kelas}</span>
                                            {cls.belum_absen > 0 && <span className="w-2 h-2 rounded-full bg-error"></span>}
                                        </div>
                                        <p className="font-headline-md text-headline-md font-bold text-primary mt-1">{cls.student_count} <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">siswa</span></p>
                                    </div>
                                    <div className="mt-3 pt-2 bg-surface-container-lowest rounded-lg p-2 flex flex-col gap-1">
                                        <div className="flex items-center justify-between font-label-sm text-[11px]">
                                            <span className="text-on-surface-variant">Hadir</span>
                                            <span className="font-bold text-on-surface">{cls.hadir}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-label-sm text-[11px]">
                                            <span className="text-on-surface-variant">Izin/Sakit</span>
                                            <span className="font-bold text-on-surface">{cls.izin + cls.sakit}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-label-sm text-[11px] text-error font-semibold">
                                            <span>Belum Absen</span>
                                            <span>{cls.belum_absen}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Attendance Percentage Bar Chart Visual */}
                <div className="bg-surface-container-low p-space-md rounded-2xl flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-title text-title text-on-surface font-bold">Tren Kehadiran Siswa</h3>
                            <p className="font-body-sm text-body-sm text-on-surface-variant">7 hari terakhir</p>
                        </div>
                        <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1 rounded-full text-primary font-label-sm text-label-sm font-semibold">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            <span>Minggu Ini</span>
                        </div>
                    </div>
                    {/* Compact Bar Chart Graphic */}
                    <div className="pt-4 pb-1">
                        <div className="h-32 flex items-end justify-between gap-1.5 px-1">
                            {chartData?.map((item: any, i: number) => {
                                const isToday = i === chartData.length - 1;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                        <span className={`font-label-sm text-[10px] ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}>{item.height}%</span>
                                        <div className={`w-full rounded-t-md ${isToday ? 'bg-secondary-fixed' : 'bg-primary-fixed-dim'}`} style={{ height: `${Math.max(item.height, 4)}%` }}></div>
                                        <span className={`font-label-sm text-[10px] ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}>{item.date.substring(0,5)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

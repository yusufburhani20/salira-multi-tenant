import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

export default function MobileDashboard({
    stats,
    studentsPerClass,
    chartData,
    activeSemester,
    attendanceRanking,
    assessmentRanking,
    inventoryStats,
}: any) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const [leaderboardTab, setLeaderboardTab] = useState<'kehadiran' | 'nilai'>('kehadiran');

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    const rankBadge = (rank: number) => {
        if (rank === 1) return { bg: 'bg-primary-fixed', text: 'text-primary' };
        if (rank === 2) return { bg: 'bg-secondary-fixed', text: 'text-secondary' };
        return { bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' };
    };

    const totalInventory = (inventoryStats?.available || 0) + (inventoryStats?.borrowed || 0) + (inventoryStats?.under_repair || 0) + (inventoryStats?.lost || 0);
    const availablePct = totalInventory > 0 ? Math.round((inventoryStats?.available || 0) / totalInventory * 100) : 100;
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

    return (
        <div className="flex flex-col w-full pb-24 font-body-md text-body-md text-on-surface antialiased bg-surface">

            {/* ── HERO SECTION ── */}
            <div className="relative bg-primary-container text-on-primary px-gutter-sm pt-space-md pb-10 overflow-hidden">
                <div className="relative z-10 flex flex-col gap-space-sm">
                    {/* Status & Time Pill */}
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/20 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse"></span>
                            <span className="font-label-sm text-label-sm font-semibold tracking-wider text-on-primary uppercase">Sistem Aktif</span>
                        </div>
                        <span className="font-label-sm text-label-sm tracking-wide font-medium text-on-primary">
                            {timeStr} • {dateStr}
                        </span>
                    </div>

                    {/* Welcome Text */}
                    <div className="mt-1">
                        <p className="font-headline-sm text-headline-sm font-semibold text-on-primary tracking-tight">
                            Selamat Datang, {user?.name?.split(' ')[0] || 'Admin'}
                        </p>
                        <p className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-primary tracking-tight leading-tight mt-0.5">
                            Optimalkan Pengelolaan Akademik
                        </p>
                        <p className="font-body-sm text-body-sm mt-1 text-on-primary opacity-90">
                            Pantau presensi, penilaian kelas, dan inventaris secara real-time.
                        </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-space-xs mt-space-sm">
                        <Link
                            href={route('attendances.scanner')}
                            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-surface-container-lowest text-primary font-title text-title active:scale-[0.98] transition-transform"
                        >
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                            <span className="font-headline-sm text-[13px] font-bold">Presensi Pegawai</span>
                        </Link>
                        <Link
                            href={route('admin.reports.index')}
                            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-surface-container-lowest/15 backdrop-blur-md text-on-primary font-title text-title hover:bg-surface-container-lowest/25 active:scale-[0.98] transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">assignment</span>
                            <span className="font-headline-sm text-[13px] font-semibold">Akses Laporan</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── CONTENT SHEET ── */}
            <div className="relative -mt-6 bg-surface-container-lowest rounded-t-3xl px-gutter-sm pt-space-lg pb-space-xl flex flex-col gap-space-lg">

                {/* Filter & Scope Bar */}
                <div className="flex items-center justify-between gap-space-xs">
                    <div className="flex items-center gap-1.5 bg-surface-container-low px-3 py-1.5 rounded-full">
                        <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
                        <span className="font-label-md text-label-md text-on-surface font-semibold">
                            Semua Kelas ({studentsPerClass?.length || 0} Rombel)
                        </span>
                    </div>
                    <div className="flex items-center gap-1 bg-secondary-container/40 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        <span className="font-label-sm text-label-sm text-on-secondary-container font-semibold">
                            {activeSemester?.name || 'Semester Aktif'}
                        </span>
                    </div>
                </div>

                {/* ── 4 Key Metrics ── */}
                <div className="grid grid-cols-2 gap-space-xs">
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
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-surface-container-highest font-label-sm text-[10px] text-on-surface-variant font-medium">
                                {stats?.students_permit > 0 ? 'Surat keterangan ada' : 'Surat keterangan nihil'}
                            </span>
                        </div>
                    </div>
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
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-surface-container-highest font-label-sm text-[10px] text-on-surface-variant font-medium">
                                {stats?.consultations_pending > 0 ? 'Layanan tertunda' : 'Layanan terselesaikan'}
                            </span>
                        </div>
                    </div>
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
                                <span className="font-label-sm text-label-sm text-on-surface-variant">/ {totalInventory} Aset</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-primary-fixed font-label-sm text-[10px] text-on-primary-fixed-variant font-semibold">
                                {availablePct}% Siap Digunakan
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Rombel Presence Breakdown ── */}
                {studentsPerClass && studentsPerClass.length > 0 && (
                    <div className="flex flex-col gap-space-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Distribusi Absensi Rombel</h2>
                            </div>
                            <span className="font-label-sm text-label-sm font-semibold text-primary">Lihat Semua</span>
                        </div>
                        <div className="flex gap-space-xs overflow-x-auto pb-2 -mx-gutter-sm px-gutter-sm scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                            {studentsPerClass.map((cls: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => (window as any).openClassGrid && (window as any).openClassGrid(cls.id)}
                                    className="min-w-[150px] bg-surface-container-low p-3 rounded-xl flex flex-col justify-between flex-shrink-0 text-left hover:bg-surface-container transition-colors"
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-label-md text-label-md font-bold text-on-surface truncate pr-2 max-w-[100px]">{cls.name || cls.kelas}</span>
                                                {cls.school_name && <span className="text-[9px] text-on-surface-variant font-medium truncate max-w-[100px]">{cls.school_name}</span>}
                                            </div>
                                            {cls.belum_absen > 0 && <span className="w-2 h-2 rounded-full bg-error flex-shrink-0"></span>}
                                        </div>
                                        <p className="font-headline-md text-headline-md font-bold text-primary mt-1">
                                            {cls.student_count} <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">siswa</span>
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-2 bg-surface-container-lowest rounded-lg p-2 flex flex-col gap-1">
                                        <div className="flex items-center justify-between font-label-sm text-[11px]">
                                            <span className="text-on-surface-variant">Hadir</span>
                                            <span className="font-bold text-on-surface">{cls.hadir}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-label-sm text-[11px]">
                                            <span className="text-on-surface-variant">Izin/Sakit</span>
                                            <span className="font-bold text-on-surface">{(cls.izin || 0) + (cls.sakit || 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between font-label-sm text-[11px] text-error font-semibold">
                                            <span>Belum Absen</span>
                                            <span>{cls.belum_absen}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Bar Chart: Tren Kehadiran ── */}
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
                    <div className="pt-4 pb-1">
                        <div className="h-32 flex items-end justify-between gap-1.5 px-1">
                            {chartData?.map((item: any, i: number) => {
                                const isToday = i === chartData.length - 1;
                                const height = Math.max(item.height ?? 0, 4);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                        <span className={`font-label-sm text-[10px] ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}>
                                            {isToday ? 'Hari Ini' : `${item.height}%`}
                                        </span>
                                        <div
                                            className={`w-full rounded-t-md ${isToday ? 'bg-secondary-fixed' : 'bg-primary-fixed-dim'}`}
                                            style={{ height: `${height}%` }}
                                        ></div>
                                        <span className={`font-label-sm text-[10px] ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant font-medium'}`}>
                                            {item.date?.substring(0, 5)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Leaderboard / Peringkat Siswa ── */}
                <div className="bg-surface-container-low p-space-md rounded-2xl flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">military_tech</span>
                            <h3 className="font-title text-title text-on-surface font-bold">Peringkat Siswa</h3>
                        </div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                            {activeSemester?.name || 'Semester Aktif'}
                        </span>
                    </div>

                    {/* Segmented Toggle */}
                    <div className="flex bg-surface-container-highest p-1 rounded-xl">
                        <button
                            onClick={() => setLeaderboardTab('kehadiran')}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-label-md text-label-md transition-all ${leaderboardTab === 'kehadiran' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant font-medium'}`}
                        >
                            Kehadiran
                        </button>
                        <button
                            onClick={() => setLeaderboardTab('nilai')}
                            className={`flex-1 py-1.5 px-3 rounded-lg font-label-md text-label-md transition-all ${leaderboardTab === 'nilai' ? 'bg-surface-container-lowest text-primary font-bold shadow-sm' : 'text-on-surface-variant font-medium'}`}
                        >
                            Rata-rata Nilai
                        </button>
                    </div>

                    {/* Ranked List */}
                    <div className="flex flex-col gap-2 mt-1">
                        {leaderboardTab === 'kehadiran' ? (
                            attendanceRanking && attendanceRanking.length > 0 ? (
                                attendanceRanking.slice(0, 5).map((item: any, i: number) => {
                                    const rank = i + 1;
                                    const badge = rankBadge(rank);
                                    return (
                                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-7 h-7 rounded-full ${badge.bg} flex items-center justify-center font-label-sm text-label-sm font-bold ${badge.text} flex-shrink-0`}>{rank}</div>
                                                <div className="min-w-0">
                                                    <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.name}</p>
                                                    <p className="font-label-sm text-label-sm text-on-surface-variant">{item.class_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 pl-2">
                                                <span className="font-headline-sm text-[15px] font-bold text-primary">{item.value}</span>
                                                <span className="font-label-sm text-label-sm text-on-surface-variant ml-0.5">Hari</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-8 flex flex-col items-center gap-2 opacity-40">
                                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant">leaderboard</span>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant text-center">Belum ada data ranking</p>
                                </div>
                            )
                        ) : (
                            assessmentRanking && assessmentRanking.length > 0 ? (
                                assessmentRanking.slice(0, 5).map((item: any, i: number) => {
                                    const rank = i + 1;
                                    const badge = rankBadge(rank);
                                    return (
                                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={`w-7 h-7 rounded-full ${badge.bg} flex items-center justify-center font-label-sm text-label-sm font-bold ${badge.text} flex-shrink-0`}>{rank}</div>
                                                <div className="min-w-0">
                                                    <p className="font-body-md text-body-md font-semibold text-on-surface truncate">{item.name}</p>
                                                    <p className="font-label-sm text-label-sm text-on-surface-variant">{item.class_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 pl-2">
                                                <span className="font-headline-sm text-[15px] font-bold text-primary">{item.value}</span>
                                                <span className="font-label-sm text-label-sm text-on-surface-variant ml-0.5">AVG</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-8 flex flex-col items-center gap-2 opacity-40">
                                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant">leaderboard</span>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant text-center">Belum ada data ranking nilai</p>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* ── Status Inventaris Sarpras ── */}
                <div className="bg-surface-container-low p-space-md rounded-2xl flex flex-col gap-space-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[18px]">inventory</span>
                            </div>
                            <div>
                                <h3 className="font-title text-title text-on-surface font-bold">Status Inventaris Sarpras</h3>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">{totalInventory} Unit Fisik Terdaftar</p>
                            </div>
                        </div>
                        <Link href={route('admin.inventory.index')} className="font-label-sm text-label-sm font-bold text-primary">Detail →</Link>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden flex">
                        <div className="bg-tertiary-container h-full transition-all" style={{ width: `${availablePct}%` }}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="flex items-center justify-between bg-surface-container-lowest p-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container"></span>
                                <span className="font-label-md text-label-md text-on-surface">Tersedia</span>
                            </div>
                            <span className="font-title text-title font-bold text-primary">{inventoryStats?.available ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-lowest p-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                                <span className="font-label-md text-label-md text-on-surface">Dipinjam</span>
                            </div>
                            <span className="font-title text-title font-bold text-on-surface-variant">{inventoryStats?.borrowed ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-lowest p-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim"></span>
                                <span className="font-label-md text-label-md text-on-surface">Perbaikan</span>
                            </div>
                            <span className="font-title text-title font-bold text-on-surface-variant">{inventoryStats?.under_repair ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between bg-surface-container-lowest p-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                                <span className="font-label-md text-label-md text-on-surface">Musnah</span>
                            </div>
                            <span className="font-title text-title font-bold text-on-surface-variant">{inventoryStats?.lost ?? 0}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-lowest/80 px-3 py-2 rounded-xl mt-1">
                        <span className="material-symbols-outlined text-[18px] text-tertiary">verified</span>
                        <span className="font-label-sm text-label-sm text-on-surface font-medium">Sinkronisasi QR Barcode: Terverifikasi</span>
                    </div>
                </div>

                {/* ── Active User Card ── */}
                <div className="bg-surface-container-low p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-headline-sm text-headline-sm font-bold">
                            {userInitial}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <p className="font-title text-[14px] font-bold text-on-surface leading-snug">{user?.name || 'Pengguna'}</p>
                                <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
                            </div>
                            <p className="font-body-sm text-[12px] text-on-surface-variant">{user?.email || ''} • Online sekarang</p>
                        </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
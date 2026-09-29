import React from 'react';
import { Link } from '@inertiajs/react';
import { AcademicCapIcon, UserGroupIcon, ClockIcon, ChartBarIcon, DocumentChartBarIcon, TrophyIcon, UsersIcon, ArchiveBoxIcon, UserIcon } from '@heroicons/react/24/outline';

export default function MobileDashboard({ stats, studentsPerClass, chartData, activeUsers, lastLogins, inventoryStats, attendanceRanking, assessmentRanking, activeSemester }: any) {
    return (
        <div className="flex flex-col w-full pb-20">
            {/* Top Vibrant Royal Hero Section */}
            <div className="relative bg-salira-700 text-white px-4 pt-4 pb-10 overflow-hidden">
                <div className="relative z-10 flex flex-col gap-2">
                    {/* Live Status & Clock Pill */}
                    <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[11px] font-semibold tracking-wider text-white uppercase">Sistem Aktif</span>
                        </div>
                        <span className="text-[11px] tracking-wide font-medium text-white/90">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                    
                    {/* Welcome Headings */}
                    <div className="mt-1">
                        <p className="text-sm font-semibold text-white/90 tracking-tight">Selamat Datang</p>
                        <p className="text-2xl font-bold text-white tracking-tight leading-tight mt-0.5">Optimalkan Pengelolaan Akademik</p>
                        <p className="text-xs mt-1 text-white/80">Pantau presensi, penilaian kelas, dan inventaris secara real-time.</p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <Link href={route('portal.attendance.scanner')} className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-white text-salira-700 active:scale-[0.98] transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                            <span className="text-[13px] font-bold">Presensi Pegawai</span>
                        </Link>
                        <Link href={route('admin.reports.index')} className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-white/15 backdrop-blur-md text-white hover:bg-white/25 active:scale-[0.98] transition-all">
                            <DocumentChartBarIcon className="w-5 h-5" />
                            <span className="text-[13px] font-semibold">Akses Laporan</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Sheet with Smooth Rounded Top Edge */}
            <div className="relative -mt-6 bg-white rounded-t-3xl px-4 pt-6 pb-8 flex flex-col gap-6">
                
                {/* Filter & Scope Bar */}
                <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
                        <UsersIcon className="w-4 h-4 text-salira-600" />
                        <span className="text-[13px] text-slate-800 font-semibold">Semua Kelas</span>
                    </div>
                    <div className="flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-salira-600"></span>
                        <span className="text-[11px] text-indigo-700 font-semibold">{activeSemester?.name || 'Semester'}</span>
                    </div>
                </div>

                {/* 4 Key Academic Metrics (2x2 Compact Grid) */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Metric 1: Siswa Hadir */}
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col justify-between min-h-[102px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500">Siswa Hadir</span>
                            <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-salira-600">
                                <UserGroupIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold text-slate-900">{stats?.students_present || 0}</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-500 font-medium">Hari ini</span>
                        </div>
                    </div>

                    {/* Metric 2: Izin / Sakit */}
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col justify-between min-h-[102px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500">Izin / Sakit</span>
                            <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-rose-500">
                                <AcademicCapIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold text-slate-900">{stats?.students_permit || 0}</span>
                                <span className="text-[11px] text-slate-500">siswa</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-500 font-medium">Aktif</span>
                        </div>
                    </div>

                    {/* Metric 3: Konsultasi BK */}
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col justify-between min-h-[102px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500">Konsultasi BK</span>
                            <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-amber-500">
                                <DocumentChartBarIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold text-slate-900">{stats?.consultations_pending || 0}</span>
                                <span className="text-[11px] text-slate-500">tiket</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-500 font-medium">Tertunda</span>
                        </div>
                    </div>

                    {/* Metric 4: Pinjam Sarpras */}
                    <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex flex-col justify-between min-h-[102px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-500">Pinjam Sarpras</span>
                            <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-500">
                                <ArchiveBoxIcon className="w-4 h-4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold text-slate-900">{stats?.items_borrowed || 0}</span>
                                <span className="text-[11px] text-slate-500">aset</span>
                            </div>
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-salira-100 border border-salira-200 text-[10px] text-salira-700 font-semibold">Dipinjam</span>
                        </div>
                    </div>
                </div>

                {/* Rombel Presence Breakdown Cards - Horizontal Scroll */}
                {studentsPerClass && studentsPerClass.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <UsersIcon className="w-5 h-5 text-salira-600" />
                                <h2 className="text-[15px] text-slate-900 font-bold">Distribusi Absensi Rombel</h2>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth custom-scrollbar">
                            {studentsPerClass.map((cls: any, idx: number) => (
                                <div key={idx} className="min-w-[150px] bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-between flex-shrink-0">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[13px] font-bold text-slate-900">{cls.kelas}</span>
                                            {cls.belum_absen > 0 && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                                        </div>
                                        <p className="text-xl font-bold text-salira-600 mt-1">{cls.student_count} <span className="text-[11px] text-slate-500 font-normal">siswa</span></p>
                                    </div>
                                    <div className="mt-3 pt-2 bg-white border border-slate-100 rounded-lg p-2 flex flex-col gap-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-500">Hadir</span>
                                            <span className="font-bold text-emerald-600">{cls.hadir}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-500">Izin/Sakit</span>
                                            <span className="font-bold text-amber-600">{cls.izin + cls.sakit}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-rose-600 font-semibold">
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
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-[15px] text-slate-900 font-bold">Tren Kehadiran</h3>
                            <p className="text-[11px] text-slate-500">Berdasarkan data terbaru</p>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full text-salira-600 text-[11px] font-semibold border border-salira-100">
                            <ChartBarIcon className="w-3.5 h-3.5" />
                            <span>Grafik</span>
                        </div>
                    </div>
                    
                    {/* Compact Bar Chart Graphic */}
                    <div className="pt-4 pb-1 overflow-x-auto">
                        <div className="h-32 flex items-end justify-between gap-1.5 px-1 min-w-[300px]">
                            {chartData?.map((item: any, i: number) => {
                                const isToday = i === chartData.length - 1;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                        <span className={`text-[10px] font-bold ${isToday ? 'text-salira-600' : 'text-slate-500'}`}>{item.height}%</span>
                                        <div className={`w-full rounded-t-md transition-all ${isToday ? 'bg-salira-500' : 'bg-slate-300'}`} style={{ height: `${Math.max(item.height, 2)}%` }}></div>
                                        <span className={`text-[10px] font-medium ${isToday ? 'text-salira-600 font-bold' : 'text-slate-500'}`}>{item.date.substring(0,5)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Student Leaderboard / Peringkat Siswa */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-3 mt-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrophyIcon className="w-5 h-5 text-amber-500" />
                            <h3 className="text-[15px] text-slate-900 font-bold">Peringkat Siswa</h3>
                        </div>
                    </div>
                    
                    {/* Ranked List Items */}
                    <div className="flex flex-col gap-2 mt-2">
                        {attendanceRanking?.slice(0,5).map((user: any, i: number) => {
                            const isTop3 = i < 3;
                            const medals = ['🥇', '🥈', '🥉'];
                            return (
                                <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between ${isTop3 ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i===0 ? 'bg-amber-100 text-amber-700' : i===1 ? 'bg-slate-200 text-slate-700' : i===2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {isTop3 ? medals[i] : i+1}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-slate-900 truncate max-w-[140px]">{user.name}</p>
                                            <p className="text-[10px] text-slate-500">{user.kelas?.nama_kelas || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-black text-salira-600">{user.total_hadir}</p>
                                        <p className="text-[9px] text-slate-400 font-semibold uppercase">HARI</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

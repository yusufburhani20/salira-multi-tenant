import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import StatCard from '@/Components/StatCard';
import Card, { CardHeader } from '@/Components/Card';
import MobileDashboard from '@/Components/MobileDashboard';
import { 
    DocumentChartBarIcon, 
    UserIcon, 
    UsersIcon,
    AcademicCapIcon, 
    TrophyIcon, 
    FunnelIcon,
    ArrowUpRightIcon,
    QrCodeIcon,
    ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import SystemClock from '@/Components/SystemClock';
import { useState } from 'react';
import usePWA from '@/hooks/usePWA';

export default function Dashboard({ 
    stats, 
    chartData, 
    activeUsers, 
    lastLogins, 
    todayAttendance, 
    attendanceRanking, 
    assessmentRanking,
    inventoryStats,
    classes,
    studentsPerClass,
    filters,
    activeSemester
}: any) {
    const [classId, setClassId] = useState(filters?.academic_class_id || '');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');

    const [selectedGridClassId, setSelectedGridClassId] = useState<number | null>(null);
    const [gridData, setGridData] = useState<any>(null);
    const [gridLoading, setGridLoading] = useState(false);
    const [gridDate, setGridDate] = useState<string>('');

    const openClassGrid = async (id: number, dateStr: string = '') => {
        setSelectedGridClassId(id);
        setGridDate(dateStr);
        setGridLoading(true);
        try {
            const url = dateStr ? `/dashboard/class/${id}/grid?date=${dateStr}` : `/dashboard/class/${id}/grid`;
            const response = await fetch(url);
            const data = await response.json();
            setGridData(data);
        } catch (error) {
            console.error('Failed to fetch grid data', error);
        } finally {
            setGridLoading(false);
        }
    };

    if (typeof window !== 'undefined') {
        (window as any).openClassGrid = openClassGrid;
    }

    const { props } = usePage();
    const { vapid_public_key } = props as any;
    const { isInstallable, installApp } = usePWA(vapid_public_key);

    const handleFilterChange = (id: string, start: string, end: string) => {
        setClassId(id);
        setStartDate(start);
        setEndDate(end);
        router.get(route('dashboard'), { academic_class_id: id, start_date: start, end_date: end }, { 
            preserveState: true,
            preserveScroll: true,
            only: ['stats', 'chartData', 'attendanceRanking', 'assessmentRanking', 'filters']
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h2 className="text-xl font-black leading-tight text-slate-800 dark:text-slate-200 tracking-tight">
                            Dashboard Overview
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pantau seluruh aktivitas akademik secara real-time</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <FunnelIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <select 
                            value={classId}
                            onChange={(e) => handleFilterChange(e.target.value, startDate, endDate)}
                            className="text-xs font-semibold border-none bg-transparent focus:ring-0 text-slate-600 dark:text-slate-300 cursor-pointer py-0 pl-1 pr-7"
                        >
                            <option value="">Semua Kelas</option>
                            {classes?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                
                {/* Mobile Header (Title & Class Filter) */}
                <div className="lg:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/65 dark:border-slate-700/60 shadow-md shadow-slate-100 dark:shadow-none">
                    <div>
                        <h2 className="text-lg font-black leading-tight text-slate-800 dark:text-slate-200 tracking-tight animate-fade-in">
                            Dashboard Overview
                        </h2>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pantau seluruh aktivitas akademik secara real-time</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
                        <FunnelIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        <select 
                            value={classId}
                            onChange={(e) => handleFilterChange(e.target.value, startDate, endDate)}
                            className="text-xs font-semibold border-none bg-transparent focus:ring-0 text-slate-600 dark:text-slate-300 cursor-pointer py-0 pl-1 pr-7 w-full sm:w-auto"
                        >
                            <option value="">Semua Kelas</option>
                            {classes?.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* ── SECTION 1: Welcome Banner with Quick Actions ── */}
                {/* ── SECTION 1: HeroBanner ── */}
                <section className="relative overflow-hidden rounded-2xl text-white p-7 shadow-lg shadow-salira-700/10 bg-salira-700" data-purpose="hero-banner">
                    {/* Distinctive abstract layered translucent bubbles / circular shapes */}
                    <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-white/10 pointer-events-none"></div>
                    <div className="absolute -top-12 left-44 w-56 h-56 rounded-full bg-white/5 pointer-events-none"></div>
                    <div className="absolute -bottom-36 right-16 w-96 h-96 rounded-full bg-white/10 pointer-events-none"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-1/4 w-64 h-64 rounded-full bg-white/[0.04] pointer-events-none"></div>
                    <div className="absolute -bottom-16 -right-10 w-60 h-60 rounded-full bg-blue-400/20 pointer-events-none"></div>
                    
                    {/* Subtle Decorative Grid Background */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Left Info Banner */}
                        <div className="space-y-3 max-w-2xl">
                            {/* System Status Badges & Server Time */}
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase bg-white/15 backdrop-blur rounded border border-white/20 text-white">
                                    Sistem Terintegrasi
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 rounded border border-emerald-400/30">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Live System
                                </span>
                                <div className="text-xs font-bold flex items-center gap-1.5 tracking-wide text-white">
                                    <SystemClock light />
                                </div>
                            </div>
                            
                            {/* Big Title & Slogan */}
                            <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug">
                                Optimalkan <span className="text-white">Pengelolaan Akademik</span>
                            </h2>
                            <p className="text-salira-100 text-sm leading-relaxed max-w-xl">
                                Pantau presensi, penilaian, dan aktivitas bimbingan secara real-time dengan dashboard cerdas SALIRA.
                            </p>
                        </div>
                        
                        {/* Quick Action Glass Cards */}
                        <div className="flex flex-col sm:flex-row gap-3.5 lg:shrink-0">
                            <a className="group flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 transition-all duration-200" href={route('admin.reports.index')}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition text-white">
                                        <DocumentChartBarIcon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-white leading-tight">Akses Laporan</div>
                                        <div className="text-[11px] text-salira-200">Rekap & Rekapitulasi</div>
                                    </div>
                                </div>
                                <ArrowUpRightIcon className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                            </a>
                            <a className="group flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 transition-all duration-200" href={route('attendances.scanner')}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition text-white">
                                        <QrCodeIcon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs font-bold text-white leading-tight">Presensi Pegawai</div>
                                        <div className="text-[11px] text-salira-200">Check-in Geolokasi</div>
                                    </div>
                                </div>
                                <ArrowUpRightIcon className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 2: KeyMetrics ── */}
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-purpose="kpi-cards">
                    {/* Card 1: Siswa Hadir */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex justify-between items-start transition hover:border-salira-300">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Siswa Hadir</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900">{stats?.students_present || 0}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                <span>100%</span>
                                <span className="text-slate-400 font-normal">hari ini</span>
                            </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
                            <UserIcon className="w-5 h-5" />
                        </div>
                    </div>
                    {/* Card 2: Izin / Sakit */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex justify-between items-start transition hover:border-salira-300">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Izin / Sakit</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900">{stats?.students_permit || 0}</span>
                            </div>
                            <div className="mt-2 text-xs font-medium text-slate-400">
                                {stats?.students_permit > 0 ? `${stats.students_permit} izin aktif` : 'Tidak ada izin aktif'}
                            </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
                            <AcademicCapIcon className="w-5 h-5" />
                        </div>
                    </div>
                    {/* Card 3: Konsultasi Tertunda */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex justify-between items-start transition hover:border-salira-300">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Konsultasi Tertunda</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900">{stats?.consultations_pending || 0}</span>
                            </div>
                            <div className="mt-2 text-xs font-medium text-slate-400">
                                {stats?.consultations_pending > 0 ? 'Butuh perhatian' : 'Semua bimbingan selesai'}
                            </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
                            <DocumentChartBarIcon className="w-5 h-5" />
                        </div>
                    </div>
                    {/* Card 4: Barang Dipinjam */}
                    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex justify-between items-start transition hover:border-salira-300">
                        <div>
                            <p className="text-xs font-medium text-slate-500">Barang Dipinjam</p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-900">{stats?.items_borrowed || 0}</span>
                            </div>
                            <div className="mt-2 text-xs font-medium text-slate-400">
                                {stats?.items_borrowed > 0 ? 'Logistik terpakai' : 'Logistik tersedia penuh'}
                            </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
                            <TrophyIcon className="w-5 h-5" />
                        </div>
                    </div>
                </section>

                {/* ── SECTION 2b: Data Siswa Per Kelas (Distribusi Kelas & Kehadiran) ── */}
                {studentsPerClass && studentsPerClass.length > 0 && (
                    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4" data-purpose="class-distribution">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-salira-50 text-salira-600 border border-salira-100">
                                    <UsersIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Distribusi Kelas & Kehadiran</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">Gambaran performa absensi hari ini per kelas</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{studentsPerClass.length} Kelas</span>
                        </div>
                        <div className="overflow-x-auto pb-2 custom-scrollbar">
                            <div className="flex gap-4" style={{ minWidth: Math.max(studentsPerClass.length * 200, 400) + 'px' }}>
                                {studentsPerClass.map((cls: any, i: number) => {
                                    const maxStudents = Math.max(...studentsPerClass.map((c: any) => c.student_count), 1);
                                    const isActive = String(classId) === String(cls.id);
                                    const colors = [
                                        'from-violet-500 to-violet-400',
                                        'from-indigo-500 to-indigo-400',
                                        'from-blue-500 to-blue-400',
                                        'from-sky-500 to-sky-400',
                                        'from-cyan-500 to-cyan-400',
                                        'from-teal-500 to-teal-400',
                                        'from-emerald-500 to-emerald-400',
                                        'from-rose-500 to-rose-400',
                                    ];
                                    const color = colors[i % colors.length];


                                    return (
                                        <button
                                            key={cls.id}
                                            onClick={() => openClassGrid(cls.id)}
                                            className={`flex-1 min-w-[200px] rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer group ${
                                                isActive
                                                    ? 'bg-salira-600 border-transparent shadow-lg shadow-salira-600/30 ring-2 ring-salira-600 ring-offset-2 scale-[1.02]'
                                                    : 'bg-white border-slate-200 hover:border-salira-300 hover:shadow-md hover:bg-slate-50'
                                            }`}
                                        >
                                            {/* Header Card */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <div className={`text-[11px] font-extrabold uppercase tracking-wide truncate ${
                                                        isActive ? 'text-white' : 'text-slate-600'
                                                    }`}>
                                                        {cls.name}
                                                    </div>
                                                    {cls.school_name && (
                                                        <div className={`text-[9px] font-semibold truncate mt-0.5 ${
                                                            isActive ? 'text-white/80' : 'text-slate-400'
                                                        }`}>
                                                            {cls.school_name}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`p-1.5 rounded-md ${
                                                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-salira-50 group-hover:text-salira-500 transition'
                                                }`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                </div>
                                            </div>

                                            {/* Progress Info */}
                                            <div className="mb-4">
                                                <div className="flex items-baseline gap-1.5 mb-1.5">
                                                    <span className={`text-3xl font-black leading-none ${
                                                        isActive ? 'text-white' : 'text-slate-900'
                                                    }`}>{cls.student_count}</span>
                                                    <span className={`text-[10px] font-bold ${
                                                        isActive ? 'text-white/80' : 'text-slate-400'
                                                    }`}>Siswa</span>
                                                </div>
                                                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isActive ? 'bg-black/20' : 'bg-slate-100'}`}>
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${isActive ? 'bg-white' : 'bg-salira-500'}`}
                                                        style={{ width: `${Math.round((cls.student_count / maxStudents) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className={`rounded-lg p-2 ${isActive ? 'bg-white/10 border border-white/20' : 'bg-emerald-50 border border-emerald-100/50'}`}>
                                                    <div className={`text-[9px] font-bold flex items-center gap-1 mb-0.5 ${isActive ? 'text-white/80' : 'text-emerald-600'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                                                        Hadir
                                                    </div>
                                                    <div className={`text-base font-black ${isActive ? 'text-white' : 'text-emerald-700'}`}>{cls.hadir}</div>
                                                </div>
                                                <div className={`rounded-lg p-2 ${isActive ? 'bg-white/10 border border-white/20' : 'bg-rose-50 border border-rose-100/50'}`}>
                                                    <div className={`text-[9px] font-bold flex items-center gap-1 mb-0.5 ${isActive ? 'text-white/80' : 'text-rose-600'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-rose-400' : 'bg-rose-500'}`}></span>
                                                        Alp/Skt/Izn
                                                    </div>
                                                    <div className={`text-base font-black ${isActive ? 'text-white' : 'text-rose-700'}`}>{cls.alpha + cls.izin + cls.sakit || 0}</div>
                                                </div>
                                            </div>
                                            
                                            {/* Belum absen warning if exists */}
                                            {cls.belum_absen > 0 && (
                                                <div className="mt-2 flex items-center justify-between px-2">
                                                    <span className={`text-[9px] font-bold flex items-center gap-1 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                                                        <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-white/40' : 'bg-slate-400'}`}></span>
                                                        Belum absen
                                                    </span>
                                                    <span className={`text-[9px] font-black ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{cls.belum_absen}</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── SECTION 3: Chart + Active Users + Last Logins ── */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-purpose="charts-and-user-activity">
                    
                    {/* Chart — takes 2 columns on desktop */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Persentase Kehadiran Siswa</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Grafik kehadiran berdasarkan rentang waktu yang dipilih</p>
                            </div>
                            {/* Date Filter Input */}
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700">
                                <svg className="w-4 h-4 text-salira-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => handleFilterChange(classId, e.target.value, endDate)}
                                    className="bg-transparent border-none p-0 text-xs text-slate-700 focus:ring-0 w-24"
                                />
                                <span className="text-slate-400">-</span>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => handleFilterChange(classId, startDate, e.target.value)}
                                    className="bg-transparent border-none p-0 text-xs text-slate-700 focus:ring-0 w-24"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <div className="w-full overflow-x-auto custom-scrollbar pb-2">
                                <div className="relative h-56 w-full flex flex-col justify-between text-[11px] text-slate-400" style={{ minWidth: Math.max(480, (chartData?.length || 0) * 80) + 'px' }}>
                                    {/* Y-axis labels + grid lines */}
                                    {[100, 75, 50, 25].map(v => (
                                        <div key={v} className="border-b border-dashed border-slate-200/80 w-full flex items-center justify-between">
                                            <span className="-translate-y-2.5">{v}</span>
                                        </div>
                                    ))}
                                    <div className="border-b border-slate-200 w-full flex items-center justify-between">
                                        <span className="-translate-y-2.5">0</span>
                                    </div>

                                    {/* Chart bars area — positioned above labels */}
                                    <div className="absolute inset-x-8 bottom-0 top-3 flex items-end justify-between gap-3">
                                        {chartData?.map((item: any, i: number) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                                {item.height > 0 ? (
                                                    <div
                                                        className="w-full max-w-[54px] bg-gradient-to-t from-salira-700 to-salira-500 rounded-t-lg transition duration-200 group-hover:brightness-110 relative"
                                                        style={{ height: `${item.height}%` }}
                                                    >
                                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-salira-700 bg-salira-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-sm">
                                                            {item.height}%
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="w-full max-w-[54px] bg-slate-200 rounded-t h-1 transition"></div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* X-Axis Labels & Stats */}
                                <div className="grid gap-3 text-center pt-3 pl-8 pb-1" style={{ gridTemplateColumns: `repeat(${chartData?.length || 1}, minmax(0, 1fr))`, minWidth: Math.max(480, (chartData?.length || 0) * 80) + 'px' }}>
                                    {chartData?.map((item: any, i: number) => (
                                        <div key={i}>
                                            <div className="text-xs font-bold text-slate-800">{item.date}</div>
                                            <div className="text-[11px] font-bold text-salira-600">{item.height}%</div>
                                            <div className="text-[9px] text-slate-400 truncate">{item.present ?? 0} dari {item.total ?? 0}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column: User Aktif + Last Logins — stacked, takes 1 column */}
                    <div className="flex flex-col gap-6 h-full lg:max-h-[360px]">
                        
                        {/* User Aktif */}
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col min-h-0">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">User Aktif</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">Sedang online sekarang</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600">LIVE</span>
                                </div>
                            </div>
                            <div className="flex-1 mt-3 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                                {activeUsers?.length > 0 ? activeUsers.map((user: any) => (
                                    <div key={user.id} className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-salira-100 text-salira-700 font-extrabold flex items-center justify-center text-xs overflow-hidden">
                                                {user.avatar ? <img src={`/storage/${user.avatar}`} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-slate-700 truncate">{user.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-8 flex flex-col items-center justify-center gap-2 opacity-40">
                                        <UserIcon className="w-7 h-7 text-slate-400" />
                                        <p className="text-xs text-slate-500 font-semibold">Belum ada user aktif</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Log Login Terakhir */}
                        <div className="w-full sm:w-1/2 lg:w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-700/50 overflow-hidden flex flex-col flex-1 min-h-0">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log Login Terakhir</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Audit akses sistem terbaru</p>
                            </div>
                            <div className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                                {lastLogins?.map((user: any) => (
                                    <div key={user.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-default">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm overflow-hidden border border-slate-200 dark:border-slate-600 shrink-0">
                                            {user.avatar ? <img src={`/storage/${user.avatar}`} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                                            <p className="text-[10px] text-indigo-500 font-semibold">{user.time_ago}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
                    
                    {/* Attendance Ranking */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 flex flex-col h-[420px]">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <div className="p-2 rounded-lg bg-salira-50 text-salira-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Ranking Kehadiran</h3>
                                <p className="text-xs text-slate-400">
                                    {activeSemester ? `Semester ${activeSemester.name}` : 'Seluruh data siswa'}
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar">
                            {attendanceRanking?.length > 0 ? attendanceRanking.map((item: any, i: number) => (
                                <RankingRow key={i} item={item} rank={i+1} unit="HARI" isGrade={false} />
                            )) : <EmptyRanking />}
                        </div>
                    </div>

                    {/* Assessment Ranking */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 flex flex-col h-[420px]">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Ranking Penilaian</h3>
                                <p className="text-xs text-slate-400">
                                    {activeSemester ? `Semester ${activeSemester.name}` : 'Seluruh data siswa'}
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar">
                            {assessmentRanking?.length > 0 ? assessmentRanking.map((item: any, i: number) => (
                                <RankingRow key={i} item={item} rank={i+1} unit="AVG" isGrade={true} />
                            )) : <EmptyRanking />}
                        </div>
                    </div>

                    {/* Inventory Summary */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4 flex flex-col">
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                    <ArchiveBoxIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Status Inventaris</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Rekap {inventoryStats?.total || 0} unit fisik</p>
                                </div>
                            </div>
                            <a href={route('admin.inventory.index')} className="text-[10px] font-bold text-salira-600 hover:text-salira-700 bg-salira-50 px-2.5 py-1 rounded-md self-start xl:self-auto transition border border-salira-100 whitespace-nowrap">Detail &rarr;</a>
                        </div>
                        <div className="flex-1 flex flex-col justify-center gap-6 mt-2">
                            {/* Visual Progress Bar */}
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                <div className="bg-emerald-500 transition-all duration-1000" style={{ width: `${((inventoryStats?.tersedia || 0) / (inventoryStats?.total || 1)) * 100}%` }} title={`Tersedia: ${inventoryStats?.tersedia || 0}`} />
                                <div className="bg-blue-500 transition-all duration-1000" style={{ width: `${((inventoryStats?.dipinjam || 0) / (inventoryStats?.total || 1)) * 100}%` }} title={`Dipinjam: ${inventoryStats?.dipinjam || 0}`} />
                                <div className="bg-amber-500 transition-all duration-1000" style={{ width: `${((inventoryStats?.perbaikan || 0) / (inventoryStats?.total || 1)) * 100}%` }} title={`Perbaikan: ${inventoryStats?.perbaikan || 0}`} />
                                <div className="bg-slate-500 transition-all duration-1000" style={{ width: `${((inventoryStats?.dihapus || 0) / (inventoryStats?.total || 1)) * 100}%` }} title={`Dihapus: ${inventoryStats?.dihapus || 0}`} />
                            </div>
                            
                            {/* Legend Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl flex items-center justify-between shadow-sm">
                                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Tersedia</span>
                                    <span className="text-sm font-black text-emerald-600">{inventoryStats?.tersedia || 0}</span>
                                </div>
                                <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl flex items-center justify-between shadow-sm">
                                    <span className="text-[11px] font-bold text-blue-700 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Dipinjam</span>
                                    <span className="text-sm font-black text-blue-600">{inventoryStats?.dipinjam || 0}</span>
                                </div>
                                <div className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl flex items-center justify-between shadow-sm">
                                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Perbaikan</span>
                                    <span className="text-sm font-black text-amber-600">{inventoryStats?.perbaikan || 0}</span>
                                </div>
                                <div className="bg-slate-50/50 border border-slate-100/50 p-3 rounded-xl flex items-center justify-between shadow-sm">
                                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500"></span>Musnah</span>
                                    <span className="text-sm font-black text-slate-500">{inventoryStats?.dihapus || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* CLASS DAILY GRID MODAL */}
            {selectedGridClassId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                                        Rekap Harian: {gridData?.class_name || 'Memuat...'}
                                    </h3>
                                    <p className="text-sm font-semibold text-slate-500 mt-1">{gridData?.date || 'Memuat...'}</p>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm">
                                    <span className="text-xs font-bold text-slate-500">Tanggal:</span>
                                    <input 
                                        type="date" 
                                        value={gridDate || new Date().toISOString().split('T')[0]} 
                                        onChange={(e) => openClassGrid(selectedGridClassId!, e.target.value)}
                                        className="text-xs font-semibold border-none bg-transparent focus:ring-0 p-0 text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedGridClassId(null)}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-0 relative">
                            {gridLoading ? (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="w-10 h-10 border-4 border-salira-200 border-t-salira-600 rounded-full animate-spin"></div>
                                    <p className="mt-4 text-slate-500 font-semibold">Mengambil data absensi...</p>
                                </div>
                            ) : gridData?.columns?.length > 0 ? (
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 font-extrabold text-slate-600 dark:text-slate-300 border-b border-r border-slate-200 dark:border-slate-700 w-1/4">Nama Siswa</th>
                                            {gridData.columns.map((col: any) => (
                                                <th key={col.id} className="p-3 font-semibold text-center border-b border-slate-200 dark:border-slate-700 min-w-[120px]">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200">{col.subject}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">{col.teacher}</div>
                                                    <div className="text-[9px] text-slate-400 mt-1 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 inline-block border border-slate-200 dark:border-slate-700">{col.time}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gridData.students.map((student: any, idx: number) => (
                                            <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                                                <td className="p-4 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-slate-400 font-bold">{idx + 1}.</span>
                                                        {student.name}
                                                    </div>
                                                </td>
                                                {gridData.columns.map((col: any) => {
                                                    const status = student.attendances[col.id];
                                                    return (
                                                        <td key={col.id} className="p-3 text-center">
                                                            {status === 'hadir' || status === 'terlambat' ? (
                                                                <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-lg">Hadir</span>
                                                            ) : status === 'sakit' ? (
                                                                <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-lg">Sakit</span>
                                                            ) : status === 'izin' ? (
                                                                <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 rounded-lg">Izin</span>
                                                            ) : status === 'alpha' ? (
                                                                <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-rose-700 bg-rose-100 rounded-lg">Alpha</span>
                                                            ) : (
                                                                <span className="inline-flex px-2.5 py-1 text-[10px] font-bold text-slate-400 bg-slate-50 rounded-lg">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-700">Belum Ada Agenda</h4>
                                    <p className="text-slate-500 text-sm mt-1">Belum ada absensi mata pelajaran yang diisi hari ini.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

// ── Sub-components ─────────────────────────────────

function RankingRow({ item, rank, unit, isGrade = false }: { item: any; rank: number; unit: string, isGrade?: boolean }) {
    const medals = ['🥇', '🥈', '🥉'];
    
    // Top 3 gets special styling, others regular
    const isTop3 = rank <= 3;
    
    let avatarBgClass = "bg-slate-100 text-slate-600";
    if (rank === 1) avatarBgClass = "bg-salira-100 text-salira-700";
    if (rank === 2) avatarBgClass = "bg-slate-200 text-slate-700";
    if (rank === 3) avatarBgClass = "bg-amber-100 text-amber-800";
    
    const wrapperClass = isTop3 
        ? "p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between"
        : "p-2.5 rounded-xl bg-white border border-slate-100 flex items-center justify-between";

    return (
        <div className={wrapperClass}>
            <div className="flex items-center gap-3 min-w-0">
                {isTop3 ? (
                    <span className="text-base">{medals[rank-1]}</span>
                ) : (
                    <span className="text-xs font-bold text-slate-400 w-4 text-center">{rank}</span>
                )}
                
                <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${avatarBgClass}`}>
                    {item.name.charAt(0)}
                </div>
                
                <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate" title={item.name}>{item.name}</h4>
                    {item.class_name && (
                        <span className="text-[10px] font-semibold text-salira-600 bg-salira-50 px-1.5 py-[1px] rounded border border-salira-100">{item.class_name}</span>
                    )}
                </div>
            </div>
            
            <div className="text-right shrink-0">
                <span className={`text-xs font-black ${isGrade ? 'text-salira-600' : 'text-slate-900'}`}>{item.value}</span>
                <span className="text-[10px] text-slate-400 block font-bold">{unit}</span>
            </div>
        </div>
    );
}

function EmptyRanking() {
    return (
        <div className="py-10 flex flex-col items-center justify-center gap-2 opacity-40">
            <TrophyIcon className="w-8 h-8 text-slate-400" />
            <p className="text-xs text-slate-500 font-semibold text-center">Belum ada data ranking<br/>untuk kelas ini</p>
        </div>
    );
}

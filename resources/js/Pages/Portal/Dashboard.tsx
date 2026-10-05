import { Head, Link, usePage } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
import { useState, useEffect } from 'react';
import usePWA from '@/hooks/usePWA';

export default function Dashboard({ student, unpaidBillsCount, attendanceStats, academics = [], consultations = [], todayStatus, todayAlphaDetails = [], announcements = [] }: any) {
    const totalAttendance = attendanceStats.present + attendanceStats.sick + attendanceStats.permission + attendanceStats.absent;
    const presentPercentage = totalAttendance > 0 
        ? Math.round((attendanceStats.present / totalAttendance) * 100) 
        : 100;

    const { props } = usePage();
    const { vapid_public_key } = props as any;
    const { isInstallable, installApp } = usePWA(vapid_public_key);

    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [currentTime, setCurrentTime] = useState('');

    const months = [
        { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
        { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
    ];

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
            setCurrentTime(`${hours}.${minutes}.${seconds} WIB | ${dateStr}`);
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleDownloadReport = () => {
        let url = route('portal.report');
        const params = new URLSearchParams();
        if (selectedMonth) params.append('month', selectedMonth);
        if (selectedYear) params.append('year', selectedYear);
        
        const queryString = params.toString();
        if (queryString) url += '?' + queryString;
        
        window.open(url, '_blank');
        setShowReportModal(false);
    };

    const getTodayStatusInfo = () => {
        if (!todayStatus) return { label: 'Belum Ada', indicator: 'bg-slate-300 dark:bg-slate-600', text: 'Presensi Belum Masuk' };
        const s = todayStatus.toLowerCase();
        if (s === 'hadir' || s === 'present') return { label: 'Hadir', indicator: 'bg-emerald-500', text: 'Sudah Presensi' };
        if (s === 'sakit' || s === 'sick') return { label: 'Sakit', indicator: 'bg-amber-500', text: 'Dalam Masa Perawatan' };
        if (s === 'izin' || s === 'permission') return { label: 'Izin', indicator: 'bg-sky-500', text: 'Telah Izin' };
        if (s === 'alpha' || s === 'absent') return { label: 'Alpha', indicator: 'bg-rose-500', text: 'Tanpa Keterangan' };
        return { label: todayStatus.toUpperCase(), indicator: 'bg-slate-500', text: 'Status Tercatat' };
    };
    const todayInfo = getTodayStatusInfo();
    const isAlpha = todayStatus && (todayStatus.toLowerCase() === 'alpha' || todayStatus.toLowerCase() === 'absent');

    const renderTunggakanAlert = () => {
        if (unpaidBillsCount === 0) {
            return (
                <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                            <span className="material-symbols-outlined text-[24px]">verified</span>
                        </div>
                        <div className="flex flex-col pt-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Administrasi Lancar</h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tidak ada tunggakan</span>
                        </div>
                    </div>
                    <Link 
                        href={route('portal.bills')} 
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98]"
                    >
                        <span>Lihat Histori Transaksi</span>
                    </Link>
                </div>
            );
        }

        return (
            <div className="flex flex-col rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-6 shadow-sm border border-rose-100 dark:border-rose-900/50">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
                        <span className="material-symbols-outlined text-[24px]">notification_important</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">Pemberitahuan Tagihan</span>
                        <h3 className="text-xl font-bold text-rose-900 dark:text-rose-300 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tunggakan!</h3>
                    </div>
                </div>
                <p className="mt-4 text-sm text-rose-800/80 dark:text-rose-200/80 leading-relaxed">
                    Ada <span className="font-semibold text-rose-700 dark:text-rose-300">{unpaidBillsCount} tagihan</span> yang belum diselesaikan. Harap segera periksa rincian dan selesaikan.
                </p>
                <Link 
                    href={route('portal.bills')} 
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3.5 px-4 text-sm font-bold text-white transition-all hover:bg-rose-700 active:scale-[0.98] shadow-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                    <span>Bayar Sekarang</span>
                </Link>
            </div>
        );
    };

    return (
        <PortalLayout
            header={
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Portal Siswa</span>
                    <span className="text-slate-400 dark:text-slate-500">/</span>
                    <span className="text-slate-900 dark:text-white font-semibold">Beranda</span>
                </div>
            }
        >
            <Head title="Dashboard Siswa" />
            
            {/* INJECT GOOGLE FONTS IF NOT PRESENT TO MATCH THE DESIGN EXACTLY */}
            <Head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </Head>

            {/* We apply a wrapper class to enforce the custom fonts requested in the design */}
            <div className="w-full max-w-7xl mx-auto space-y-6 lg:space-y-8 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
                
                {/* ANNOUNCEMENTS SECTION */}
                {announcements.length > 0 && (
                    <div className="space-y-4">
                        {announcements.map((ann: any) => (
                            <div 
                                key={ann.id} 
                                className={`p-4 rounded-xl flex items-start gap-3 border ${
                                    ann.type === 'important' ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-200' :
                                    ann.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-200' :
                                    ann.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-200' :
                                    'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-200'
                                }`}
                            >
                                <span className="material-symbols-outlined mt-0.5">info</span>
                                <div>
                                    <h4 className="font-semibold text-sm">{ann.title}</h4>
                                    <p className="text-sm opacity-90 mt-1 whitespace-pre-wrap">{ann.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* HERO WELCOME BANNER */}
                <div className="relative overflow-hidden rounded-2xl bg-blue-700 dark:bg-blue-900 p-6 lg:p-8 text-white shadow-sm transition-colors">
                    {/* Layered Translucent Geometric Curves */}
                    <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="pointer-events-none absolute -right-8 -bottom-16 h-64 w-64 rounded-full bg-blue-400/20 blur-xl"></div>
                    <div className="pointer-events-none absolute right-1/4 -top-12 h-44 w-44 rounded-full border-[28px] border-white/5"></div>
                    
                    <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                        {/* Left Info Block */}
                        <div className="flex flex-col gap-3 max-w-2xl">
                            {/* Top Status Row */}
                            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 uppercase tracking-wider backdrop-blur-md">
                                    <span className="material-symbols-outlined text-[14px]">school</span>
                                    Tahun Ajaran 2026/2027
                                </span>
                                <div className="h-1 w-1 rounded-full bg-white/50"></div>
                                <span className="flex items-center gap-1.5 text-blue-100 dark:text-blue-200 tracking-wide">
                                    <span className="material-symbols-outlined text-[15px] opacity-80">schedule</span>
                                    <span>{currentTime}</span>
                                </span>
                            </div>
                            
                            {/* Greeting & Subtitle */}
                            <div className="mt-1 flex flex-col gap-2">
                                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    Halo, {student.name.split(' ')[0]}!
                                </h1>
                                <p className="text-sm text-blue-100 dark:text-blue-200 max-w-xl font-normal leading-relaxed">
                                    Selamat datang di portal akademik Anda. Pantau kehadiran, lihat nilai terbaru, dan periksa tagihan Anda dalam satu tempat.
                                </p>
                            </div>
                            
                            {/* Primary CTA */}
                            <div className="mt-2 flex items-center gap-4 pt-1">
                                <button 
                                    onClick={() => setShowReportModal(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 px-5 py-3 text-sm font-semibold text-blue-700 dark:text-blue-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">print</span>
                                    <span>Cetak Rapor Digital</span>
                                </button>
                                <span className="text-xs text-blue-100/80 dark:text-blue-200/80 flex items-center gap-1 font-medium">
                                    <span className="material-symbols-outlined text-[16px]">verified</span> Semester Ganjil Aktif
                                </span>
                            </div>
                        </div>

                        {/* Right Snapshot Stats in Banner */}
                        <div className="grid grid-cols-2 gap-3 lg:w-80 shrink-0 mt-4 lg:mt-0">
                            <Link href={route('portal.attendance')} className="flex flex-col justify-between rounded-xl bg-white/10 p-4 backdrop-blur-md transition-colors hover:bg-white/15 active:scale-[0.98]">
                                <span className="text-[11px] font-semibold tracking-wider text-blue-100 dark:text-blue-200 uppercase">Status Hari Ini</span>
                                <div className="mt-3 flex flex-col">
                                    <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{todayInfo.label}</span>
                                    <span className="text-xs text-blue-100 dark:text-blue-200 mt-1 flex items-center gap-1.5">
                                        <span className={`inline-block h-2 w-2 rounded-full ${todayInfo.indicator}`}></span> {todayInfo.text}
                                    </span>
                                </div>
                            </Link>
                            <Link href={route('portal.attendance')} className="flex flex-col justify-between rounded-xl bg-white/10 p-4 backdrop-blur-md transition-colors hover:bg-white/15 active:scale-[0.98]">
                                <span className="text-[11px] font-semibold tracking-wider text-blue-100 dark:text-blue-200 uppercase">Total Hari Efektif</span>
                                <div className="mt-3 flex flex-col">
                                    <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{totalAttendance}</span>
                                    <span className="text-xs text-blue-100 dark:text-blue-200 mt-1">Hari Pembelajaran</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {isAlpha && todayAlphaDetails.length > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400">
                            <span className="material-symbols-outlined text-[20px]">warning</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">Tercatat Alpha Pada Jam Pelajaran:</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {todayAlphaDetails.map((d: any, i: number) => (
                                    <span key={i} className="text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-md font-medium border border-rose-200 dark:border-rose-800">
                                        Jam {d.lesson_period}: {d.subject}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* MOBILE ONLY: Tunggakan Alert inserted right after hero */}
                <div className="block lg:hidden">
                    {renderTunggakanAlert()}
                </div>

                {/* TWO-COLUMN LAYOUT GRID */}
                <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-12">
                    
                    {/* LEFT MAIN COLUMN (~65% -> 8 of 12 cols) */}
                    <div className="flex flex-col gap-6 lg:gap-8 lg:col-span-8">
                        
                        {/* CARD: REKAP KEHADIRAN */}
                        <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Rekap Kehadiran</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Satu semester terakhir berjalan</p>
                                </div>
                                <Link 
                                    href={route('portal.attendance')} 
                                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    <span>Rincian</span>
                                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                </Link>
                            </div>
                            
                            {/* Body */}
                            <div className="p-6 flex flex-col gap-8 sm:flex-row sm:items-center">
                                {/* Donut Graphic Chart */}
                                <div className="relative flex flex-col items-center justify-center shrink-0 mx-auto sm:mx-0">
                                    <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 160 160">
                                        <circle className="text-slate-100 dark:text-slate-700" cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" strokeWidth="14"></circle>
                                        <circle 
                                            className="text-blue-600 dark:text-blue-500 transition-all duration-1000 ease-out" 
                                            cx="80" cy="80" fill="transparent" r="64" stroke="currentColor" 
                                            strokeDasharray={402} 
                                            strokeDashoffset={402 - (402 * presentPercentage) / 100} 
                                            strokeLinecap="round" strokeWidth="14"
                                        ></circle>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                        <span className="text-3xl font-bold leading-none text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{presentPercentage}%</span>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold mt-1">Hadir</span>
                                    </div>
                                </div>
                                
                                {/* 4 Stats Breakdown Grid */}
                                <div className="grid flex-1 grid-cols-2 gap-3 w-full">
                                    {/* Hadir Metric */}
                                    <Link href={route('portal.attendance')} className="flex flex-col justify-between rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 active:scale-[0.98]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Hadir</span>
                                            <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">check_circle</span>
                                        </div>
                                        <div className="mt-3 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{attendanceStats.present}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Hari</span>
                                        </div>
                                    </Link>
                                    
                                    {/* Sakit Metric */}
                                    <Link href={route('portal.attendance')} className="flex flex-col justify-between rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 active:scale-[0.98]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] uppercase font-semibold text-amber-600 dark:text-amber-400">Sakit</span>
                                            <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">sick</span>
                                        </div>
                                        <div className="mt-3 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{attendanceStats.sick}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Hari</span>
                                        </div>
                                    </Link>
                                    
                                    {/* Izin Metric */}
                                    <Link href={route('portal.attendance')} className="flex flex-col justify-between rounded-xl bg-slate-50 dark:bg-slate-700/30 p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 active:scale-[0.98]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] uppercase font-semibold text-sky-600 dark:text-sky-400">Izin</span>
                                            <span className="material-symbols-outlined text-[18px] text-sky-600 dark:text-sky-400">assignment_late</span>
                                        </div>
                                        <div className="mt-3 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold text-sky-700 dark:text-sky-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{attendanceStats.permission}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">Hari</span>
                                        </div>
                                    </Link>
                                    
                                    {/* Alpha Metric */}
                                    <Link href={route('portal.attendance')} className="flex flex-col justify-between rounded-xl bg-rose-50 dark:bg-rose-950/30 p-4 transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-100 dark:border-rose-900/50 active:scale-[0.98]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] uppercase font-semibold text-rose-600 dark:text-rose-400">Alpha</span>
                                            <span className="material-symbols-outlined text-[18px] text-rose-600 dark:text-rose-400">warning</span>
                                        </div>
                                        <div className="mt-3 flex items-baseline gap-1.5">
                                            <span className="text-2xl font-bold text-rose-700 dark:text-rose-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{attendanceStats.absent}</span>
                                            <span className="text-xs text-rose-600/80 dark:text-rose-400/80">Hari</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                            
                            {/* Footer Banner */}
                            <div className="px-6 pb-6 pt-0">
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 px-4 py-3 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50">
                                    <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">info</span>
                                    <span className="text-xs">
                                        Persentase kehadiran minimum semester ini adalah <strong className="text-slate-900 dark:text-white font-semibold">85%</strong> untuk kualifikasi ujian akhir.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* CARD: CAPAIAN AKADEMIK */}
                        <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Capaian Akademik</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rata-rata Penilaian Harian</p>
                                </div>
                                <Link 
                                    href={route('portal.scores')} 
                                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300"
                                >
                                    <span>Semua Nilai</span>
                                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                </Link>
                            </div>
                            
                            <div className="p-6 flex flex-col gap-3">
                                {academics.length > 0 ? (
                                    academics.map((item: any, idx: number) => {
                                        // M3 style List Items
                                        return (
                                            <Link key={idx} href={route('portal.scores')} className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50 group border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">
                                                        <span className="material-symbols-outlined text-[20px]">assignment</span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.subject}</span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{item.count} Penilaian Terjadwal</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 shrink-0 pl-4">
                                                    <span className={`rounded-lg px-3 py-1 text-sm font-bold ${
                                                        item.average >= 80 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                                        item.average >= 60 ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300' :
                                                        'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400'
                                                    }`}>
                                                        {item.average}
                                                    </span>
                                                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-1">chevron_right</span>
                                                </div>
                                            </Link>
                                        )
                                    })
                                ) : (
                                    <div className="py-12 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
                                            <span className="material-symbols-outlined text-[32px]">menu_book</span>
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Belum Ada Nilai Masuk</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Data akademik semester ini akan muncul setelah guru mempublikasikan nilai harian.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT SIDEBAR COLUMN (~35% -> 4 of 12 cols) */}
                    <div className="flex flex-col gap-6 lg:gap-8 lg:col-span-4">
                        
                        {/* ALERT CARD: TUNGGAKAN! (Desktop Only, hidden on mobile since it's already shown above) */}
                        <div className="hidden lg:block">
                            {renderTunggakanAlert()}
                        </div>

                        {/* CARD: RIWAYAT KONSELING */}
                        <div className="flex flex-col rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/50">
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Riwayat Konseling</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Catatan Bimbingan & Pelanggaran</p>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px]">support_agent</span>
                            </div>
                            
                            {consultations.length > 0 ? (
                                <div className="p-6">
                                    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                                        {consultations.map((cons: any, idx: number) => (
                                            <div key={idx} className="relative pl-6">
                                                <div className="absolute -left-[9px] top-1 w-4 h-4 bg-slate-300 dark:bg-slate-600 rounded-full border-4 border-white dark:border-slate-800 shadow-sm"></div>
                                                
                                                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                    {new Date(cons.consultation_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                                                </div>
                                                <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-2 leading-tight">{cons.issue}</h5>
                                                
                                                {cons.solution && (
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl rounded-tl-none border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                                                        {cons.solution}
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                                        {cons.homeroom_teacher?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{cons.homeroom_teacher?.name || '[Tidak Diketahui]'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 flex flex-col items-center justify-center py-10 text-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900/50 text-emerald-500">
                                        <span className="material-symbols-outlined text-[34px]">verified_user</span>
                                    </div>
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tidak Ada Catatan</h4>
                                    <p className="mt-2 max-w-xs text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Siswa tidak memiliki riwayat pelanggaran atau bimbingan khusus selama masa ajaran aktif ini. Pertahankan prestasi!
                                    </p>
                                    <div className="mt-6 flex w-full items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 px-4 py-3">
                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Poin Pelanggaran</span>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">0 / 100 Poin</span>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* REPORT SELECTION MODAL */}
            {showReportModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setShowReportModal(false)}></div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden transform transition-all">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Cetak Rapor Digital</h3>
                                <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                                Pilih bulan laporan. Kosongkan untuk mencetak ringkasan satu semester berjalan secara utuh.
                            </p>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Bulan</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none outline-none"
                                        >
                                            <option value="">Semester Ini (6 Bulan)</option>
                                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Tahun</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none outline-none"
                                        >
                                            {[new Date().getFullYear(), new Date().getFullYear()-1].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleDownloadReport}
                                className="mt-8 w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">download</span>
                                Unduh Dokumen PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PortalLayout>
    );
}

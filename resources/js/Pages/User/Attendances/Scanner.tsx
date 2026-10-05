import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import AttendanceScanner from '@/Components/AttendanceScanner';
import { MapPinIcon, DocumentTextIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Interfaces for Permissions
interface PermissionType {
    value: string;
    label: string;
}

interface PermissionRequest {
    id: number;
    type: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
    attachment_path: string | null;
    task_description: string | null;
    task_file_path: string | null;
    rejection_reason: string | null;
    addressed_to?: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

interface Approver {
    id: number;
    name: string;
}

export default function Scanner({ auth, sessions, activeSession, todayLogs, geofences, permissions, types, approvers, dashboardStats }: PageProps<{ 
    sessions: any[];
    activeSession: any;
    todayLogs: any[];
    geofences: any[];
    permissions?: PermissionRequest[];
    types?: PermissionType[];
    approvers?: Approver[];
    dashboardStats?: any;
}>) {
    const [activeTab, setActiveTab] = useState<'presensi' | 'izin' | 'dashboard'>('dashboard');
    
    // Modal state for showing user details
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailModalTitle, setDetailModalTitle] = useState('');
    const [detailModalUsers, setDetailModalUsers] = useState<any[]>([]);
    const [detailModalSearch, setDetailModalSearch] = useState('');

    const openDetailModal = (title: string, users: any[]) => {
        setDetailModalTitle(title);
        setDetailModalUsers(users || []);
        setDetailModalSearch('');
        setDetailModalOpen(true);
    };

    const filteredModalUsers = detailModalUsers.filter(u => u.name.toLowerCase().includes(detailModalSearch.toLowerCase()));

    // PERMISSION FORM LOGIC
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data, setData, post, delete: destroy, reset, processing, errors } = useForm({
        type: types?.[0]?.value || 'izin',
        start_date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
        end_date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
        reason: '',
        attachment: null as File | null,
        task_description: '',
        task_file: null as File | null,
        addressed_to: '',
    });

    const openDialog = () => { reset(); setIsDialogOpen(true); };
    const closeDialog = () => { setIsDialogOpen(false); reset(); };
    const submitPermission = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('user.permissions.store'), {
            onSuccess: () => closeDialog(),
            forceFormData: true,
        });
    };
    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin membatalkan pengajuan ini?')) {
            destroy(route('user.permissions.destroy', id));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircleIcon className="w-4 h-4 text-salira-500" />;
            case 'rejected': return <XCircleIcon className="w-4 h-4 text-red-500" />;
            default: return <ClockIcon className="w-4 h-4 text-amber-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-salira-100 text-salira-800 dark:bg-salira-900/30 dark:text-salira-400';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
        }
    };

    const userRoles = auth.user.roles || [];
    const isTeacher = userRoles.includes('Guru') || userRoles.includes('Guru/Dosen') || userRoles.includes('Wali Kelas') || userRoles.includes('Super Admin');

    return (
        <AuthenticatedLayout>
            <Head title="Presensi Pegawai" />

            <div className="flex flex-col w-full min-h-screen font-body-md text-body-md text-on-surface antialiased bg-surface">
                <div className="flex flex-col w-full space-y-space-lg px-0 sm:px-gutter-sm sm:pt-space-md">
                    <div className="relative overflow-hidden sm:rounded-xl bg-primary-container text-on-primary p-space-lg lg:p-space-xl shadow-md">
{/*  Abstract Geometric Layer  */}
<div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-primary/30 pointer-events-none blur-xl"></div>
<div className="absolute right-48 -bottom-16 w-80 h-80 rounded-full bg-surface-container-lowest/10 pointer-events-none blur-2xl"></div>
<div className="relative z-10 flex flex-col gap-space-lg">
{/*  Upper Banner Metadata & Actions  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
<div className="flex flex-wrap items-center gap-space-sm">
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/20 backdrop-blur-md text-on-primary font-label-sm text-label-sm tracking-wider uppercase font-semibold">
<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SISTEM AKTIF • LIVE REAL-TIME
          </span>
<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest/15 backdrop-blur-md text-on-primary-container font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[16px]">location_on</span>
            Geofence: Kampus Utama (Radius 100m) Aktif
          </span>
</div>
{/*  Clock & Fast Action Trigger  */}
<div className="flex items-center gap-space-sm self-start lg:self-auto">
<div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest/15 backdrop-blur-md text-on-primary font-body-sm text-body-sm">
<span className="material-symbols-outlined text-[18px]">schedule</span>
<span className="font-medium tracking-tight" id="live-clock">{new Date().toLocaleString('id-ID', {weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'})} WIB</span>
</div>
<button onClick={() => setActiveTab('presensi')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-title text-label-md transition-colors hover:bg-surface-container-low shadow-sm" type="button">
<span className="material-symbols-outlined text-[18px]">photo_camera</span>
            Buka Scanner Kamera
          </button>
</div>
</div>
{/*  Main Banner Titles  */}
<div className="max-w-3xl">
<h1 className="font-headline-lg text-headline-lg text-on-primary tracking-tight font-bold">
          Kehadiran &amp; Presensi Pegawai
        </h1>
<p className="mt-1 font-body-md text-body-md text-on-primary-container">
          Monitoring real-time kedatangan pegawai, rekapitulasi partisipasi harian civitas GTK, serta penanganan verifikasi dispensasi sekolah.
        </p>
</div>
{/*  Pill Segmented Tabs inside Banner  */}
<div className="pt-2 flex flex-wrap gap-2">
<button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg font-title text-body-md flex items-center gap-2 transition-colors ${activeTab === 'dashboard' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary'}`} type="button">
<span className="material-symbols-outlined text-[18px]">dashboard</span>
          Dashboard Ringkasan
        </button>
<button onClick={() => setActiveTab('presensi')} className={`px-4 py-2 rounded-lg font-title text-body-md flex items-center gap-2 transition-colors ${activeTab === 'presensi' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary'}`} type="button">
<span className="material-symbols-outlined text-[18px]">share_location</span>
          GPS Kamera &amp; Peta
        </button>
<button onClick={() => setActiveTab('izin')} className={`px-4 py-2 rounded-lg font-title text-body-md flex items-center gap-2 transition-colors ${activeTab === 'izin' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary'}`} type="button">
<span className="material-symbols-outlined text-[18px]">assignment_add</span>
          Pengajuan Izin GTK
        </button>
</div>
</div>
</div>
{/*  SECTION 2: PARTICIPATION KPI & RADIAL SUMMARY  */}
</div>
<div className="relative pt-space-md sm:pt-space-lg pb-space-xl flex flex-col gap-space-lg min-h-[500px] w-full max-w-[1400px] mx-auto px-gutter-sm lg:px-0">
                    <div className="w-full">
                        {activeTab === 'presensi' ? (
                            <div className="max-w-xl mx-auto w-full">
                                <AttendanceScanner 
                                    sessions={sessions} 
                                    activeSession={activeSession} 
                                    todayLogs={todayLogs} 
                                    geofences={geofences} 
                                />
                            </div>
                        ) : activeTab === 'izin' ? (
                            <div className="max-w-xl mx-auto w-full">
                                <div className="flex flex-col space-y-6">
                                <div className="flex justify-between items-center bg-salira-50 dark:bg-slate-900/50 p-4 rounded-xl border border-salira-100 dark:border-slate-700 shadow-sm">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200">Riwayat Pengajuan</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Kelola data izin / cuti Anda.</p>
                                    </div>
                                    <button onClick={openDialog} className="bg-salira-600 hover:bg-salira-700 text-white px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 text-sm font-bold">
                                        <PlusIcon className="w-4 h-4" /> Baru
                                    </button>
                                </div>
                                
                                {/* Permissions List */}
                                <div className="flex flex-col space-y-3">
                                    {(!permissions || permissions.length === 0) ? (
                                        <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                            <DocumentTextIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm font-medium">Belum ada riwayat permohonan</p>
                                        </div>
                                    ) : (
                                        permissions.map(req => (
                                            <div key={req.id} className="border border-slate-100 dark:border-slate-700 p-4 rounded-xl shadow-sm bg-white dark:bg-slate-800 flex flex-col gap-2 relative overflow-hidden group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-xs font-bold uppercase tracking-wider text-salira-600 dark:text-salira-400 bg-salira-50 dark:bg-salira-900/30 px-2 py-0.5 rounded-md inline-block mb-1">{req.type}</span>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{req.start_date.split('T')[0]} <span className="text-slate-400 text-xs mx-1">s/d</span> {req.end_date.split('T')[0]}</p>
                                                    </div>
                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold capitalize ${getStatusBadge(req.status)}`}>
                                                        {getStatusIcon(req.status)}
                                                        {req.status === 'approved' ? 'Diterima' : (req.status === 'rejected' ? 'Ditolak' : 'Pending')}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug mt-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg italic">"{req.reason}"</p>
                                                
                                                {/* Attachments / Extras */}
                                                {(req.attachment_path || req.task_description) && (
                                                    <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-100 dark:border-slate-700 pt-2">
                                                        {req.attachment_path && (
                                                            <a href={`/storage/${req.attachment_path}`} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                                                <DocumentTextIcon className="w-3 h-3" /> Lihat Bukti Lampiran
                                                            </a>
                                                        )}
                                                        {req.task_description && (
                                                            <div className="text-[11px] text-slate-500 flex gap-1">
                                                                <span className="font-bold">Tugas:</span> {req.task_description}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Rejection Reason */}
                                                {req.status === 'rejected' && req.rejection_reason && (
                                                    <div className="mt-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800/50">
                                                        <span className="font-bold">Alasan Ditolak:</span> {req.rejection_reason}
                                                    </div>
                                                )}

                                                {/* Action */}
                                                {req.status === 'pending' && (
                                                    <div className="flex justify-end mt-1">
                                                        <button onClick={() => handleDelete(req.id)} className="text-red-500 text-xs font-bold hover:underline hover:text-red-600 transition-colors flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                                                            <TrashIcon className="w-3 h-3" /> Batalkan Pengajuan
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-space-lg">
                                {/* ═══ SECTION 2: PARTISIPASI HARI INI ═══ */}
                                <div className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-lg shadow-sm flex flex-col gap-space-lg">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm gap-2">
                                        <div className="flex items-center gap-space-sm">
                                            <div className="w-8 h-8 rounded-lg bg-secondary-container flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-[20px]">donut_large</span>
                                            </div>
                                            <div>
                                                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight">PARTISIPASI HARI INI</h2>
                                                <span className="font-body-sm text-body-sm text-on-surface-variant">Update sinkronisasi otomatis tiap 30 detik</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-label-sm text-label-sm font-semibold">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Kondisi Presensi: {((dashboardStats?.hadir?.length || 0) / (dashboardStats?.total_staff || 1)) >= 0.5 ? 'Optimal' : 'Rendah'}
                                            </span>
                                            <button className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors" title="Perbarui Data" type="button">
                                                <span className="material-symbols-outlined text-[20px]">refresh</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Analytic Body: Donut + Metric Grid */}
                                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-center">
                                        {/* Donut Chart (Left 4 cols) */}
                                        <div className="xl:col-span-4 flex flex-col items-center justify-center p-space-md rounded-xl bg-surface-container-low">
                                            {(() => {
                                                const total = dashboardStats?.total_staff || 1;
                                                const hadir = dashboardStats?.hadir?.length || 0;
                                                const alfa = dashboardStats?.alfa?.length || 0;
                                                const izin = dashboardStats?.izin?.length || 0;
                                                const sakit = dashboardStats?.sakit?.length || 0;
                                                const cuti = dashboardStats?.cuti?.length || 0;
                                                const pulang = dashboardStats?.pulang?.length || 0;
                                                const pHadir = (hadir / total) * 100;
                                                const pAlfa = (alfa / total) * 100;
                                                const pIzin = (izin / total) * 100;
                                                const pSakit = (sakit / total) * 100;
                                                const pCuti = (cuti / total) * 100;
                                                const pPulang = (pulang / total) * 100;
                                                const C = 2 * Math.PI * 64; // ~402
                                                let offset = 0;
                                                const segments = [
                                                    { pct: pHadir, color: 'text-emerald-500', label: 'Hadir' },
                                                    { pct: pAlfa, color: 'text-error', label: 'Alfa' },
                                                    { pct: pPulang, color: 'text-cyan-700', label: 'Pulang' },
                                                    { pct: pIzin, color: 'text-amber-500', label: 'Izin' },
                                                    { pct: pSakit, color: 'text-orange-500', label: 'Sakit' },
                                                    { pct: pCuti, color: 'text-purple-500', label: 'Cuti' },
                                                ];
                                                return (
                                                    <>
                                                    <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center">
                                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                                                            <circle className="text-surface-container-high stroke-current" cx="80" cy="80" fill="transparent" r="64" strokeWidth="14"></circle>
                                                            {segments.map((seg, idx) => {
                                                                const dashLen = (seg.pct / 100) * C;
                                                                const dashOff = -offset;
                                                                offset += dashLen;
                                                                return dashLen > 0 ? (
                                                                    <circle key={idx} className={`${seg.color} stroke-current transition-all duration-1000 ease-out`} cx="80" cy="80" fill="transparent" r="64" strokeDasharray={`${dashLen} ${C}`} strokeDashoffset={dashOff} strokeWidth="14" strokeLinecap="round"></circle>
                                                                ) : null;
                                                            })}
                                                        </svg>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                            <span className="font-display text-display font-bold text-on-surface leading-none tracking-tight">{Math.round(pHadir)}%</span>
                                                            <span className="font-label-sm text-label-sm text-emerald-700 uppercase font-bold mt-1 tracking-wider">Hadir Valid</span>
                                                            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{hadir} dari {total} GTK</span>
                                                        </div>
                                                    </div>
                                                    {/* Legend */}
                                                    <div className="w-full grid grid-cols-2 gap-x-3 gap-y-1.5 pt-3 mt-2 border-t border-surface-container-high/60">
                                                        <div className="flex items-center justify-between text-body-sm"><span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Hadir</span><span className="font-semibold text-emerald-700">{Math.round(pHadir)}%</span></div>
                                                        <div className="flex items-center justify-between text-body-sm"><span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-error"></span>Alfa/Belum</span><span className="font-semibold text-error">{Math.round(pAlfa)}%</span></div>
                                                        <div className="flex items-center justify-between text-body-sm"><span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Izin Pribadi</span><span className="font-semibold text-amber-700">{Math.round(pIzin)}%</span></div>
                                                        <div className="flex items-center justify-between text-body-sm"><span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-cyan-700"></span>Pulang</span><span className="font-semibold text-cyan-800">{Math.round(pPulang)}%</span></div>
                                                        <div className="flex items-center justify-between text-body-sm"><span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-orange-500"></span>Sakit</span><span className="font-semibold text-orange-800">{Math.round(pSakit)}%</span></div>
                                                        <div className="flex items-center justify-between text-body-sm"><span className="flex items-center gap-1.5 text-on-surface-variant"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Cuti</span><span className="font-semibold text-purple-800">{Math.round(pCuti)}%</span></div>
                                                    </div>
                                                    {/* Target & Batas */}
                                                    <div className="mt-3 flex items-center justify-center gap-4 text-center w-full pt-2 border-t border-surface-container-high/60">
                                                        <div><div className="font-label-sm text-label-sm text-outline">Target Sekolah</div><div className="font-title text-title text-on-surface">95.0%</div></div>
                                                        <div className="h-6 w-px bg-surface-container-high"></div>
                                                        <div><div className="font-label-sm text-label-sm text-outline">Batas Jam Masuk</div><div className="font-title text-title text-on-surface">07:15 WIB</div></div>
                                                    </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* 2x4 Metric Cards (Right 8 cols) */}
                                        <div className="xl:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-space-sm">
                                            {/* Total Personel */}
                                            <div onClick={() => openDetailModal('Total Personel', [...(dashboardStats?.hadir || []), ...(dashboardStats?.alfa || [])])} className="cursor-pointer p-space-md rounded-xl bg-surface-container flex flex-col justify-between hover:bg-surface-container-high transition-colors">
                                                <div className="flex items-center justify-between text-outline">
                                                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Total Personel</span>
                                                    <span className="material-symbols-outlined text-[18px]">groups</span>
                                                </div>
                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <span className="font-display text-headline-lg font-bold text-on-surface">{dashboardStats?.total_staff || 0}</span>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-highest text-on-surface-variant">Civitas</span>
                                                </div>
                                            </div>
                                            {/* Hadir */}
                                            <div onClick={() => openDetailModal('Hadir', dashboardStats?.hadir)} className="cursor-pointer p-space-md rounded-xl bg-emerald-50/70 flex flex-col justify-between hover:bg-emerald-50 transition-colors">
                                                <div className="flex items-center justify-between text-emerald-700">
                                                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Hadir</span>
                                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                </div>
                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <span className="font-display text-headline-lg font-bold text-emerald-800">{dashboardStats?.hadir?.length || 0}</span>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">{Math.round(((dashboardStats?.hadir?.length || 0) / (dashboardStats?.total_staff || 1)) * 100)}%</span>
                                                </div>
                                            </div>
                                            {/* Izin Pribadi */}
                                            <div onClick={() => openDetailModal('Izin Pribadi', dashboardStats?.izin)} className="cursor-pointer p-space-md rounded-xl bg-amber-50/70 flex flex-col justify-between hover:bg-amber-50 transition-colors">
                                                <div className="flex items-center justify-between text-amber-700">
                                                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Izin Pribadi</span>
                                                    <span className="material-symbols-outlined text-[18px]">person</span>
                                                </div>
                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <span className="font-display text-headline-lg font-bold text-amber-900">{dashboardStats?.izin?.length || 0}</span>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">Dispensasi</span>
                                                </div>
                                            </div>
                                            {/* Izin Dinas / Pulang */}
                                            <div onClick={() => openDetailModal('Pulang', dashboardStats?.pulang)} className="cursor-pointer p-space-md rounded-xl bg-cyan-50/70 flex flex-col justify-between hover:bg-cyan-50 transition-colors">
                                                <div className="flex items-center justify-between text-cyan-700">
                                                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Izin Dinas</span>
                                                    <span className="material-symbols-outlined text-[18px]">business_center</span>
                                                </div>
                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <span className="font-display text-headline-lg font-bold text-cyan-900">{dashboardStats?.pulang?.length || 0}</span>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-100 text-cyan-800">Surat Tugas</span>
                                                </div>
                                            </div>
                                            {/* Sakit */}
                                            <div onClick={() => openDetailModal('Sakit', dashboardStats?.sakit)} className="cursor-pointer p-space-md rounded-xl bg-orange-50/70 flex flex-col justify-between hover:bg-orange-50 transition-colors">
                                                <div className="flex items-center justify-between text-orange-700">
                                                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Sakit</span>
                                                    <span className="material-symbols-outlined text-[18px]">medical_services</span>
                                                </div>
                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <span className="font-display text-headline-lg font-bold text-orange-900">{dashboardStats?.sakit?.length || 0}</span>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-orange-100 text-orange-800">Surat Dokter</span>
                                                </div>
                                            </div>
                                            {/* Cuti */}
                                            <div onClick={() => openDetailModal('Cuti', dashboardStats?.cuti)} className="cursor-pointer p-space-md rounded-xl bg-purple-50/70 flex flex-col justify-between hover:bg-purple-50 transition-colors">
                                                <div className="flex items-center justify-between text-purple-700">
                                                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Cuti</span>
                                                    <span className="material-symbols-outlined text-[18px]">event_available</span>
                                                </div>
                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <span className="font-display text-headline-lg font-bold text-purple-900">{dashboardStats?.cuti?.length || 0}</span>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800">Tahunan</span>
                                                </div>
                                            </div>
                                            {/* Libur / Selesai */}
                                            <div onClick={() => openDetailModal('Libur', dashboardStats?.libur)} className="cursor-pointer p-space-md rounded-xl bg-surface-container flex flex-col justify-between hover:bg-surface-container-high transition-colors">
                                                <div className="flex items-center justify-between text-outline">
                                                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Libur / Selesai</span>
                                                    <span className="material-symbols-outlined text-[18px]">logout</span>
                                                </div>
                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <span className="font-display text-headline-lg font-bold text-on-surface">{dashboardStats?.libur?.length || 0}</span>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-container-highest text-outline">Shift Selesai</span>
                                                </div>
                                            </div>
                                            {/* Alfa / Belum */}
                                            <div onClick={() => openDetailModal('Alfa', dashboardStats?.alfa)} className="cursor-pointer p-space-md rounded-xl bg-error-container/60 flex flex-col justify-between hover:bg-error-container/80 transition-colors">
                                                <div className="flex items-center justify-between text-error">
                                                    <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Alfa / Belum</span>
                                                    <span className="material-symbols-outlined text-[18px]">warning</span>
                                                </div>
                                                <div className="mt-3 flex items-baseline justify-between">
                                                    <span className="font-display text-headline-lg font-bold text-error">{dashboardStats?.alfa?.length || 0}</span>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-error text-on-error">Tindak Lanjut</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ═══ SECTION 3: OPERATIONAL SPLIT LAYOUT ═══ */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
                                    {/* LEFT 8 COLS: FEED AKTIVITAS */}
                                    <div className="lg:col-span-8 flex flex-col space-y-space-md">
                                        <div className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-lg shadow-sm flex flex-col h-auto lg:h-[520px]">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-3 shrink-0">
                                                <div className="flex items-center gap-space-sm">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                                                    <h3 className="font-headline-sm text-title text-on-surface font-bold tracking-tight">Feed Aktivitas Presensi Hari Ini</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative w-48 sm:w-60">
                                                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline">search</span>
                                                        <input className="w-full bg-surface-container rounded-lg pl-8 pr-3 py-1 font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-low transition-colors" placeholder="Cari nama / NIP / divisi..." type="text" />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Desktop Table */}
                                            <div className="overflow-y-auto flex-1 rounded-lg border border-surface-container hidden sm:block">
                                                <table className="w-full text-left font-body-sm text-body-sm">
                                                    <thead className="sticky top-0 z-10 bg-surface-container-low text-outline uppercase font-label-sm text-label-sm shadow-sm">
                                                        <tr>
                                                            <th className="py-2.5 px-3" scope="col">Waktu</th>
                                                            <th className="py-2.5 px-3" scope="col">Identitas GTK</th>
                                                            <th className="py-2.5 px-3" scope="col">Divisi / Jabatan</th>
                                                            <th className="py-2.5 px-3" scope="col">Metode &amp; Lokasi</th>
                                                            <th className="py-2.5 px-3 text-right" scope="col">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-surface-container">
                                                        {dashboardStats?.all_logs?.length > 0 ? (
                                                            [...dashboardStats.all_logs].sort((a: any, b: any) => b.time.localeCompare(a.time)).map((log: any) => (
                                                                <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
                                                                    <td className="py-3 px-3 font-semibold text-primary whitespace-nowrap">{log.time?.substring(0, 8)} WIB</td>
                                                                    <td className="py-3 px-3">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="w-8 h-8 rounded-full bg-secondary-container text-primary font-bold text-xs flex items-center justify-center uppercase shrink-0">{log.user?.name?.substring(0, 2)}</div>
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="font-title text-body-md text-on-surface font-semibold leading-snug truncate">{log.user?.name}</span>
                                                                                <span className="font-label-sm text-label-sm text-outline truncate">{log.session?.name || 'Kegiatan'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-3">
                                                                        <span className="text-on-surface">Civitas Sekolah</span>
                                                                    </td>
                                                                    <td className="py-3 px-3">
                                                                        <div className="flex items-center gap-1 text-on-surface-variant">
                                                                            <span className="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
                                                                            <span>GPS Sistem</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-3 text-right">
                                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-label-sm text-label-sm font-semibold ${log.status === 'tawasul' ? 'bg-primary-container/20 text-primary' : 'bg-emerald-50 text-emerald-700'}`}>
                                                                            {log.status === 'tawasul' ? 'Hadir Tawasul' : 'Masuk Tepat Waktu'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr><td colSpan={5} className="py-6 text-center text-outline">Belum ada aktivitas hari ini.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {/* Mobile Card List */}
                                            <div className="flex flex-col gap-2.5 pt-1 sm:hidden overflow-y-auto flex-1">
                                                {dashboardStats?.all_logs?.length > 0 ? (
                                                    [...dashboardStats.all_logs].sort((a: any, b: any) => b.time.localeCompare(a.time)).map((log: any) => (
                                                        <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low transition-colors">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="relative w-10 h-10 rounded-full bg-secondary-container text-primary flex items-center justify-center font-bold text-label-md shrink-0 uppercase">
                                                                    {log.user?.name?.substring(0, 2)}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-label-md text-label-md font-semibold text-on-surface truncate">{log.user?.name}</p>
                                                                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{log.session?.name || 'Kegiatan'} • {log.time?.substring(0, 5)} WIB</p>
                                                                </div>
                                                            </div>
                                                            <div className="shrink-0 text-right">
                                                                <span className={`inline-block px-2 py-0.5 rounded-md font-label-sm text-label-sm font-semibold ${log.status === 'tawasul' ? 'bg-primary-container/20 text-primary' : 'bg-emerald-100 text-emerald-800'}`}>
                                                                    {log.status === 'tawasul' ? 'Tawasul' : 'Tepat Waktu'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-6 text-center text-outline text-sm">Belum ada aktivitas hari ini.</div>
                                                )}
                                            </div>
                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 shrink-0">
                                                <span className="font-body-sm text-body-sm text-outline">Menampilkan {dashboardStats?.all_logs?.length || 0} aktivitas log hari ini</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT 4 COLS: TOP TIER LEADERBOARD */}
                                    <div className="lg:col-span-4 flex flex-col space-y-space-md">
                                        <div className="bg-surface-container-lowest rounded-xl p-space-md sm:p-space-lg shadow-sm flex flex-col h-auto lg:h-[520px]">
                                            <div className="flex items-center justify-between pb-3 shrink-0 border-b border-surface-container">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-[20px]">military_tech</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-headline-sm text-title text-on-surface font-bold tracking-tight">Top Tier Kedatangan</h3>
                                                        <p className="font-body-sm text-body-sm text-outline">Kedatangan terawal hari ini</p>
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-fixed text-primary">Presisi</span>
                                            </div>
                                            <div className="overflow-y-auto flex-1 pr-1 space-y-2.5 pt-3">
                                                {dashboardStats?.ranking?.length > 0 ? (
                                                    dashboardStats.ranking.map((log: any, i: number) => {
                                                        const rank = i + 1;
                                                        return (
                                                            <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div className={`w-6 h-6 rounded-full font-bold font-label-sm text-label-sm flex items-center justify-center shrink-0 ${rank === 1 ? 'bg-amber-400 text-amber-950' : rank === 2 ? 'bg-slate-200 text-slate-700' : rank === 3 ? 'bg-amber-700/20 text-amber-800' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                                                        {rank}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-title text-body-sm text-on-surface font-semibold truncate leading-tight">{log.user?.name}</p>
                                                                        <p className="font-body-sm text-[11px] text-outline truncate">Hadir Valid</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className={`font-label-sm text-label-md font-bold ${rank <= 3 ? 'text-emerald-600' : rank <= 6 ? 'text-emerald-600' : 'text-amber-700'}`}>{log.time?.substring(0, 5)}</span>
                                                                    <span className="block text-[10px] text-outline">WIB</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="py-6 text-center text-outline text-sm">Belum ada data kedatangan terawal.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DIALOG FOR PERMISSION */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-safe text-center sm:p-0">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeDialog}></div>
                        <div className="inline-block bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all align-middle max-w-md w-full relative z-[101] m-4">
                            <form onSubmit={submitPermission} className="flex flex-col max-h-[85vh]">
                                <div className="px-5 py-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center rounded-t-2xl z-10">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Form Pengajuan Izin</h3>
                                    <button type="button" onClick={closeDialog} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-700 rounded-full p-1">
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Jenis Izin</label>
                                        <select value={data.type} onChange={e => setData('type', e.target.value)} className="mt-1.5 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-salira-500 focus:border-salira-500 text-sm shadow-sm">
                                            {types?.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Ditujukan Kepada (Approval)</label>
                                        <select value={data.addressed_to} onChange={e => setData('addressed_to', e.target.value)} required className="mt-1.5 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-salira-500 focus:border-salira-500 text-sm shadow-sm">
                                            <option value="">-- Pilih Kepala Sekolah --</option>
                                            {approvers?.map(app => (
                                                <option key={app.id} value={app.id}>{app.name}</option>
                                            ))}
                                        </select>
                                        {errors.addressed_to && <p className="text-red-500 text-xs mt-1">{errors.addressed_to}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tgl Mulai</label>
                                            <input type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} required className="mt-1.5 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-salira-500 focus:border-salira-500 text-sm shadow-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tgl Selesai</label>
                                            <input type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)} required min={data.start_date} className="mt-1.5 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-salira-500 focus:border-salira-500 text-sm shadow-sm" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Alasan Lengkap</label>
                                        <textarea rows={3} value={data.reason} onChange={e => setData('reason', e.target.value)} required placeholder="Sebutkan alasan..." className="mt-1.5 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-salira-500 focus:border-salira-500 text-sm shadow-sm"></textarea>
                                        {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Bukti / Surat (Opsional)</label>
                                        <input type="file" onChange={e => setData('attachment', e.target.files ? e.target.files[0] : null)} className="mt-1.5 block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-salira-50 file:text-salira-700 hover:file:bg-salira-100" accept=".jpg,.jpeg,.png,.pdf" />
                                        <p className="text-[10px] text-slate-400 mt-1">*Maks 2MB (jpg/png/pdf)</p>
                                    </div>

                                    {isTeacher && (
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <label className="block text-xs font-bold text-salira-700 dark:text-salira-500 uppercase tracking-wider mb-2 bg-salira-50 dark:bg-salira-900/30 p-2 rounded-lg border border-salira-100 dark:border-salira-800/50">
                                                Tugas Pengganti (Khusus Guru)
                                            </label>
                                            <div className="space-y-3 px-1">
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Deskripsi Tugas</label>
                                                    <input type="text" value={data.task_description} onChange={e => setData('task_description', e.target.value)} placeholder="Contoh: Kerjakan LKS Hal 10..." className="mt-1 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:ring-salira-500 focus:border-salira-500 text-sm shadow-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">File Tugas (Opsional)</label>
                                                    <input type="file" onChange={e => setData('task_file', e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-[11px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-salira-50 file:text-salira-700 hover:file:bg-salira-100" accept=".pdf,.doc,.docx,.jpg,.png" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-2xl">
                                    <button type="submit" disabled={processing} className="w-full bg-salira-600 hover:bg-salira-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-salira-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center">
                                        {processing ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : "Kirim Pengajuan Izin"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Users Modal */}
            {detailModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">
                                Data {detailModalTitle}
                            </h3>
                            <button 
                                onClick={() => setDetailModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none material-symbols-outlined text-slate-400 text-sm">search</span>
                                <input 
                                    type="text"
                                    placeholder="Cari nama personel..."
                                    value={detailModalSearch}
                                    onChange={e => setDetailModalSearch(e.target.value)}
                                    className="block w-full pl-9 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm shadow-sm focus:border-salira-500 focus:ring-salira-500"
                                />
                            </div>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            {filteredModalUsers.length > 0 ? (
                                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {filteredModalUsers.map((u, i) => (
                                        <li key={u.id} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-salira-100 text-salira-600 flex justify-center items-center font-bold text-xs shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{u.name}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">group_off</span>
                                    <p className="text-sm">Tidak ada data nama yang cocok.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-semibold text-slate-500">
                            <span>Total Kategori: {detailModalUsers.length}</span>
                            <span>Menampilkan: {filteredModalUsers.length}</span>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

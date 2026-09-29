import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import AttendanceScanner from '@/Components/AttendanceScanner';
import { MapPinIcon, DocumentTextIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

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

export default function Scanner({ auth, todayAttendance, geofences, permissions, types, approvers }: PageProps<{ 
    todayAttendance: any; 
    geofences: any[];
    permissions?: PermissionRequest[];
    types?: PermissionType[];
    approvers?: Approver[];
}>) {
    const [activeTab, setActiveTab] = useState<'presensi' | 'izin'>('presensi');
    
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
            case 'approved': return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
            case 'rejected': return <XCircleIcon className="w-4 h-4 text-red-500" />;
            default: return <ClockIcon className="w-4 h-4 text-amber-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
        }
    };

    const userRoles = auth.user.roles || [];
    const isTeacher = userRoles.includes('Guru') || userRoles.includes('Guru/Dosen') || userRoles.includes('Wali Kelas') || userRoles.includes('Super Admin');

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 leading-tight">Presensi & Izin</h2>}>
            <Head title="Presensi Pegawai" />

            <div className="flex flex-col w-full pb-24 font-body-md text-body-md text-slate-900 dark:text-slate-100 antialiased bg-slate-50 dark:bg-slate-900">
                {/* ── HERO SECTION ── */}
                <div className="relative bg-salira-700 dark:bg-slate-800 text-white px-gutter-sm pt-space-md pb-10 overflow-hidden">
                    <div className="relative z-10 flex flex-col gap-space-sm">
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 dark:bg-slate-700/50 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="font-label-sm text-label-sm font-semibold tracking-wider text-white uppercase">Sistem Aktif</span>
                            </div>
                        </div>
                        <div className="mt-1">
                            <h3 className="text-2xl font-bold mb-2 flex items-center tracking-tight">
                                <MapPinIcon className="w-6 h-6 mr-2" />
                                Kehadiran & Izin
                            </h3>
                            <p className="font-body-sm text-body-sm mt-1 text-white opacity-90">
                                {activeTab === 'presensi' 
                                    ? 'Harap pastikan lokasi (GPS) pada perangkat Anda telah menyala dan berada di dalam radius zona kampus untuk check-in.'
                                    : 'Ajukan permohonan izin, sakit, cuti, atau dinas luar Anda di sini.'}
                            </p>
                        </div>
                        
                        {/* ── TABS ── */}
                        <div className="flex space-x-2 mt-4 bg-black/10 p-1 rounded-xl">
                            <button 
                                onClick={() => setActiveTab('presensi')}
                                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all ${activeTab === 'presensi' ? 'bg-white text-salira-700 shadow' : 'text-white/80 hover:bg-white/10'}`}
                            >
                                GPS (Harian)
                            </button>
                            <button 
                                onClick={() => setActiveTab('izin')}
                                className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all ${activeTab === 'izin' ? 'bg-white text-salira-700 shadow' : 'text-white/80 hover:bg-white/10'}`}
                            >
                                Pengajuan Izin
                            </button>
                        </div>
                    </div>
                    {/* decorative blur */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                </div>

                {/* ── CONTENT SHEET ── */}
                <div className="relative -mt-6 bg-white dark:bg-slate-800 border-t dark:border-slate-700 rounded-t-3xl px-gutter-sm pt-space-lg pb-space-xl flex flex-col gap-space-lg min-h-[500px]">
                    {/* Fixed max-width to make desktop view not stretched (lonjong) */}
                    <div className="max-w-md mx-auto w-full">
                        {activeTab === 'presensi' ? (
                            <AttendanceScanner existingRecord={todayAttendance} geofences={geofences} />
                        ) : (
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
        </AuthenticatedLayout>
    );
}

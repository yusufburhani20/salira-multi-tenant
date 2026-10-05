import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { ClockIcon, PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AttendanceSession {
    id: number;
    name: string;
    type: string;
    start_time: string;
    end_time: string;
    days_of_week: number[] | null;
    is_active: boolean;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const typeNames: Record<string, string> = {
    'gtk': 'Presensi Utama (GTK)',
    'shalat': 'Shalat Berjamaah',
    'pulang': 'Presensi Pulang',
    'kajian': 'Kajian/Tawasul',
};

export default function Index({ auth, sessions }: PageProps<{ sessions: AttendanceSession[] }>) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        type: 'gtk',
        start_time: '',
        end_time: '',
        days_of_week: [] as number[],
        is_active: true,
    });

    const openCreateModal = () => {
        reset();
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (session: AttendanceSession) => {
        setData({
            name: session.name,
            type: session.type,
            start_time: session.start_time.substring(0, 5),
            end_time: session.end_time.substring(0, 5),
            days_of_week: session.days_of_week || [],
            is_active: session.is_active,
        });
        setEditingId(session.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            put(route('admin.attendance-sessions.update', editingId), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('admin.attendance-sessions.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
            destroy(route('admin.attendance-sessions.destroy', id));
        }
    };

    const toggleDay = (dayIndex: number) => {
        const currentDays = [...data.days_of_week];
        if (currentDays.includes(dayIndex)) {
            setData('days_of_week', currentDays.filter(d => d !== dayIndex));
        } else {
            setData('days_of_week', [...currentDays, dayIndex].sort());
        }
    };

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 leading-tight">Pengaturan Jadwal Presensi</h2>}>
            <Head title="Jadwal Presensi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    {/* Header Action */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Daftar Sesi Presensi Aktif</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Atur jam buka/tutup presensi, pembatasan hari, dan tipe kegiatan.</p>
                        </div>
                        <button onClick={openCreateModal} className="bg-salira-600 hover:bg-salira-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm transition-all">
                            <PlusIcon className="w-5 h-5" /> Buat Jadwal Baru
                        </button>
                    </div>

                    {/* Table / Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map(session => (
                            <div key={session.id} className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 shadow-sm transition-all ${session.is_active ? 'border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-300 dark:border-slate-600 opacity-60'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md mb-2 inline-block ${
                                            session.type === 'gtk' ? 'bg-emerald-100 text-emerald-700' :
                                            session.type === 'shalat' ? 'bg-amber-100 text-amber-700' :
                                            session.type === 'pulang' ? 'bg-blue-100 text-blue-700' :
                                            'bg-purple-100 text-purple-700'
                                        }`}>{typeNames[session.type]}</span>
                                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{session.name}</h4>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEditModal(session)} className="p-1.5 text-slate-400 hover:text-salira-600 hover:bg-salira-50 rounded-lg transition-colors">
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(session.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                            <ClockIcon className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Waktu Pemindaian</p>
                                            <p className="font-semibold text-sm">{session.start_time.substring(0,5)} WIB - {session.end_time.substring(0,5)} WIB</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[16px] text-slate-500">calendar_month</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Berlaku Pada</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {(!session.days_of_week || session.days_of_week.length === 0) ? (
                                                    <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Setiap Hari</span>
                                                ) : (
                                                    session.days_of_week.map(d => (
                                                        <span key={d} className="text-[10px] font-bold bg-salira-50 dark:bg-salira-900/30 text-salira-700 dark:text-salira-400 px-1.5 py-0.5 rounded border border-salira-100 dark:border-salira-800">
                                                            {dayNames[d]}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sessions.length === 0 && (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                                <p className="text-slate-500">Belum ada jadwal sesi presensi. Silakan buat baru.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                        <div className="inline-block bg-white dark:bg-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-[101]">
                            <form onSubmit={submit}>
                                <div className="px-6 py-5 border-b dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {editingId ? 'Edit Jadwal Presensi' : 'Buat Jadwal Presensi Baru'}
                                    </h3>
                                    <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>
                                
                                <div className="px-6 py-5 space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Nama Kegiatan</label>
                                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required className="mt-1 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-sm focus:ring-salira-500 focus:border-salira-500" placeholder="Misal: Kajian Ilmiah" />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Tipe Kategori</label>
                                        <select value={data.type} onChange={e => setData('type', e.target.value)} className="mt-1 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-sm focus:ring-salira-500 focus:border-salira-500">
                                            {Object.entries(typeNames).map(([key, val]) => (
                                                <option key={key} value={key}>{val}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Jam Mulai</label>
                                            <input type="time" value={data.start_time} onChange={e => setData('start_time', e.target.value)} required className="mt-1 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-sm" />
                                            {errors.start_time && <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Jam Selesai</label>
                                            <input type="time" value={data.end_time} onChange={e => setData('end_time', e.target.value)} required className="mt-1 block w-full rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-sm" />
                                            {errors.end_time && <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pilih Hari (Kosongkan = Setiap Hari)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {dayNames.map((day, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => toggleDay(idx)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                                        data.days_of_week.includes(idx) 
                                                        ? 'bg-salira-100 border-salira-200 text-salira-700 dark:bg-salira-900/50 dark:border-salira-700 dark:text-salira-400' 
                                                        : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t dark:border-slate-700">
                                        <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded border-slate-300 text-salira-600 shadow-sm focus:ring-salira-500" />
                                        <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Jadwal Aktif</label>
                                    </div>
                                </div>
                                
                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 rounded-b-2xl flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={processing} className="px-6 py-2 bg-salira-600 hover:bg-salira-700 text-white rounded-xl font-bold shadow-sm transition-colors flex items-center gap-2">
                                        {processing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                        Simpan Jadwal
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

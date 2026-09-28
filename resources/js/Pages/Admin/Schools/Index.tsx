import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

type School = {
    id: number;
    name: string;
    type: string;
    type_label: string;
    npsn: string | null;
    slug: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    principal_name: string | null;
    principal_nip: string | null;
    is_active: boolean;
    users_count: number;
    students_count: number;
};

const typeColors: Record<string, string> = {
    SMK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    MTs: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    MA:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    SMA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    SD:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
};

const emptyForm = {
    name: '', type: 'SMK', npsn: '', slug: '', address: '',
    phone: '', email: '', website: '', principal_name: '', principal_nip: '', is_active: true,
};

export default function SchoolsIndex({ schools }: { schools: School[] }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<School | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<School | null>(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({ ...emptyForm });

    const openCreate = () => {
        setEditing(null);
        reset();
        clearErrors();
        setModalOpen(true);
    };

    const openEdit = (school: School) => {
        setEditing(school);
        setData({
            name: school.name, type: school.type, npsn: school.npsn ?? '',
            slug: school.slug, address: school.address ?? '', phone: school.phone ?? '',
            email: school.email ?? '', website: '', principal_name: school.principal_name ?? '',
            principal_nip: school.principal_nip ?? '', is_active: school.is_active,
        });
        clearErrors();
        setModalOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(route('admin.schools.update', editing.id), {
                onSuccess: () => { setModalOpen(false); reset(); }
            });
        } else {
            post(route('admin.schools.store'), {
                onSuccess: () => { setModalOpen(false); reset(); }
            });
        }
    };

    const toggleActive = (school: School) => {
        router.post(route('admin.schools.toggle', school.id), {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('admin.schools.destroy', deleteTarget.id), {
            onFinish: () => setDeleteTarget(null),
        });
    };

    const inputCls = "block w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
    const labelCls = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1";

    return (
        <AuthenticatedLayout header={
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Manajemen Sekolah</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Kelola data sekolah dalam Yayasan Idrisiyyah</p>
                </div>
            </div>
        }>
            <Head title="Manajemen Sekolah - SALIRA" />

            <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

                {/* Header Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Sekolah', value: schools.length, icon: '🏫', color: 'bg-blue-50 dark:bg-blue-900/20' },
                        { label: 'Aktif', value: schools.filter(s => s.is_active).length, icon: '✅', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Total Guru/Staff', value: schools.reduce((a, s) => a + s.users_count, 0), icon: '👨‍🏫', color: 'bg-purple-50 dark:bg-purple-900/20' },
                        { label: 'Total Siswa', value: schools.reduce((a, s) => a + s.students_count, 0), icon: '🎓', color: 'bg-orange-50 dark:bg-orange-900/20' },
                    ].map((stat) => (
                        <div key={stat.label} className={`${stat.color} rounded-2xl p-4 border border-white/50 dark:border-slate-700`}>
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Daftar Sekolah ({schools.length})
                    </h3>
                    <button onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                        </svg>
                        Tambah Sekolah
                    </button>
                </div>

                {/* School Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schools.map(school => (
                        <div key={school.id} className={`bg-white dark:bg-slate-800 rounded-2xl border ${school.is_active ? 'border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-300 dark:border-slate-600 opacity-70'} p-5 shadow-sm hover:shadow-md transition-all`}>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-lg mb-1.5 ${typeColors[school.type] ?? 'bg-slate-100 text-slate-700'}`}>
                                        {school.type}
                                    </span>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{school.name}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">/{school.slug}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(school)} title="Edit"
                                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                    </button>
                                    <button onClick={() => setDeleteTarget(school)} title="Hapus"
                                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-1.5 mb-4">
                                {school.principal_name && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                        <span>{school.principal_name}</span>
                                    </div>
                                )}
                                {school.phone && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                        <span>{school.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 text-center">
                                    <div className="text-lg font-black text-slate-900 dark:text-white">{school.users_count}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Guru/Staff</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 text-center">
                                    <div className="text-lg font-black text-slate-900 dark:text-white">{school.students_count}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Siswa</div>
                                </div>
                            </div>

                            {/* Toggle */}
                            <button onClick={() => toggleActive(school)}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${school.is_active
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700'}`}>
                                {school.is_active ? '✓ Aktif — Klik untuk Nonaktifkan' : '✗ Nonaktif — Klik untuk Aktifkan'}
                            </button>
                        </div>
                    ))}

                    {schools.length === 0 && (
                        <div className="col-span-3 text-center py-16 text-slate-400">
                            <div className="text-5xl mb-3">🏫</div>
                            <p className="font-semibold">Belum ada sekolah terdaftar</p>
                            <p className="text-sm mt-1">Klik "Tambah Sekolah" untuk menambahkan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {editing ? `Edit: ${editing.name}` : 'Tambah Sekolah Baru'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>

                        <form onSubmit={submit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelCls}>Nama Sekolah *</label>
                                    <input className={inputCls} value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Contoh: SMK Idrisiyyah" required />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Jenis Sekolah *</label>
                                    <select className={inputCls} value={data.type} onChange={e => setData('type', e.target.value)} required>
                                        {['SMK','MTs','MA','SMA','SD'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Slug / URL Identifier *</label>
                                    <input className={inputCls} value={data.slug} onChange={e => setData('slug', e.target.value.toLowerCase().replace(/\s+/g,'-'))} placeholder="smk / mts / ma" required />
                                    {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>NPSN</label>
                                    <input className={inputCls} value={data.npsn} onChange={e => setData('npsn', e.target.value)} placeholder="8 digit" />
                                    {errors.npsn && <p className="text-red-500 text-xs mt-1">{errors.npsn}</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>No. Telepon</label>
                                    <input className={inputCls} value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="022xxxxxx" />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelCls}>Email Sekolah</label>
                                    <input type="email" className={inputCls} value={data.email} onChange={e => setData('email', e.target.value)} placeholder="info@sekolah.sch.id" />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelCls}>Alamat</label>
                                    <textarea className={inputCls} rows={2} value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Alamat lengkap sekolah" />
                                </div>
                                <div>
                                    <label className={labelCls}>Nama Kepala Sekolah</label>
                                    <input className={inputCls} value={data.principal_name} onChange={e => setData('principal_name', e.target.value)} placeholder="Nama lengkap" />
                                </div>
                                <div>
                                    <label className={labelCls}>NIP Kepala Sekolah</label>
                                    <input className={inputCls} value={data.principal_nip} onChange={e => setData('principal_nip', e.target.value)} placeholder="NIP" />
                                </div>
                                <div className="col-span-2 flex items-center gap-3">
                                    <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded accent-blue-600" />
                                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">Sekolah Aktif</label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                                    Batal
                                </button>
                                <button type="submit" disabled={processing}
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-60 shadow-lg shadow-blue-600/25">
                                    {processing ? 'Menyimpan...' : (editing ? 'Simpan Perubahan' : 'Tambah Sekolah')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="text-center mb-5">
                            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Hapus Sekolah?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                <strong>{deleteTarget.name}</strong> akan dihapus permanen. Sekolah yang masih memiliki data pengguna atau siswa tidak dapat dihapus.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                Batal
                            </button>
                            <button onClick={confirmDelete}
                                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all">
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

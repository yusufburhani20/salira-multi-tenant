import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BuildingOfficeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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

const emptyForm = {
    name: '', type: 'SMK', npsn: '', slug: '', address: '',
    phone: '', email: '', website: '', principal_name: '', principal_nip: '', is_active: true,
};

export default function SchoolsIndex({ auth, schools }: { auth: any, schools: School[] }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<School | null>(null);
    const [search, setSearch] = useState('');

    const filteredSchools = schools.filter(school =>
        school.name.toLowerCase().includes(search.toLowerCase()) ||
        school.slug.toLowerCase().includes(search.toLowerCase()) ||
        (school.npsn && school.npsn.toLowerCase().includes(search.toLowerCase()))
    );

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({ ...emptyForm });

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

    const handleDelete = (school: School) => {
        if (confirm(`Apakah Anda yakin ingin menghapus sekolah ${school.name}?`)) {
            destroy(route('admin.schools.destroy', school.id));
        }
    };

    const inputCls = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:border-primary focus:ring-primary text-sm transition-all";
    const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manajemen Sekolah</h2>}>
            <Head title="Manajemen Sekolah" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600 dark:text-gray-400">Kelola data sekolah dalam Yayasan Idrisiyyah</p>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={openCreate}
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>Tambah Sekolah</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex justify-start">
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Cari nama, NPSN, atau slug..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:border-primary focus:ring-primary shadow-sm text-sm"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white">Nama Sekolah</th>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white">Info & Kontak</th>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white text-center">Statistik</th>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white">Status</th>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredSchools.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">Data sekolah tidak ditemukan.</td>
                                        </tr>
                                    ) : (
                                        filteredSchools.map((school) => (
                                            <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{school.name}</p>
                                                            <p className="text-xs font-mono text-gray-500 dark:text-gray-400">/{school.slug}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <p className="text-gray-900 dark:text-white font-medium">NPSN: {school.npsn || '-'}</p>
                                                        <p className="text-gray-500 dark:text-gray-400">{school.phone || '-'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                            <span className="font-bold text-gray-700 dark:text-gray-300">{school.users_count}</span>
                                                            <span className="text-[10px] text-gray-500 ml-1">Guru</span>
                                                        </div>
                                                        <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                            <span className="font-bold text-gray-700 dark:text-gray-300">{school.students_count}</span>
                                                            <span className="text-[10px] text-gray-500 ml-1">Siswa</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => toggleActive(school)}
                                                        className={`inline-flex text-xs font-semibold rounded-full px-2.5 py-0.5 capitalize cursor-pointer transition-colors ${school.is_active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
                                                        {school.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => openEdit(school)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(school)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
                            <form onSubmit={submit}>
                                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b dark:border-gray-700">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                        {editing ? 'Edit Sekolah' : 'Tambah Sekolah'}
                                    </h3>
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
                                            <textarea className={inputCls} rows={2} value={data.address} onChange={e => setData('address', e.target.value)}></textarea>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Nama Kepala Sekolah</label>
                                            <input className={inputCls} value={data.principal_name} onChange={e => setData('principal_name', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>NIP Kepala Sekolah</label>
                                            <input className={inputCls} value={data.principal_nip} onChange={e => setData('principal_nip', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl">
                                    <button type="submit" disabled={processing} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                    <button type="button" onClick={() => setModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Batal
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

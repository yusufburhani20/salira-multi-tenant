import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, UserCircleIcon, KeyIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Role {
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    nip: string | null;
    phone: string | null;
    telegram_id: string | null;
    status: string;
    roles: Role[];
    school_id?: number | null;
    school_assignments?: { id: number; school_id: number; is_active: boolean }[];
}

export default function UserIndex({ auth, users, roles, statuses, schools, isSuperAdmin }: PageProps<{ users: User[], roles: string[], statuses: {value: string, label: string}[], schools?: {id: number, name: string}[], isSuperAdmin?: boolean }>) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [search, setSearch] = useState('');

    const filteredUsers = users.filter(userRecord => 
        userRecord.name.toLowerCase().includes(search.toLowerCase()) ||
        userRecord.email.toLowerCase().includes(search.toLowerCase()) ||
        (userRecord.nip && userRecord.nip.toLowerCase().includes(search.toLowerCase())) ||
        (userRecord.phone && userRecord.phone.toLowerCase().includes(search.toLowerCase()))
    );

    const { data, setData, post, put, delete: destroy, reset, processing, errors } = useForm({
        name: '',
        email: '',
        nip: '',
        phone: '',
        telegram_id: '',
        status: statuses[0]?.value || 'active',
        school_id: '' as number | string,
        additional_school_ids: [] as number[],
        roles: [] as string[],
        reset_password_default: false,
        reset_password_email: false,
    });

    const [isImportOpen, setIsImportOpen] = useState(false);
    const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm({
        file: null as File | null,
    });

    const openDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setData({
                name: user.name,
                email: user.email,
                nip: user.nip || '',
                phone: user.phone || '',
                telegram_id: user.telegram_id || '',
                status: user.status,
                school_id: user.school_id || '',
                additional_school_ids: user.school_assignments ? user.school_assignments.map(sa => sa.school_id) : [],
                roles: user.roles.map(r => r.name),
                reset_password_default: false,
                reset_password_email: false,
            });
        } else {
            setEditingUser(null);
            setData({
                name: '',
                email: '',
                nip: '',
                phone: '',
                telegram_id: '',
                status: 'active',
                school_id: '',
                additional_school_ids: [],
                roles: [],
                reset_password_default: false,
                reset_password_email: false,
            });
        }
        setIsDialogOpen(true);
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        reset();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            put(route('admin.users.update', editingUser.id), {
                onSuccess: () => closeDialog(),
            });
        } else {
            post(route('admin.users.store'), {
                onSuccess: () => closeDialog(),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to permanently delete this user? All their associated records might be affected. Strongly consider just changing their status to Inactive instead.')) {
            destroy(route('admin.users.destroy', id));
        }
    };

    const handleRoleChange = (role: string, checked: boolean) => {
        if (checked) {
            setData('roles', [...data.roles, role]);
        } else {
            setData('roles', data.roles.filter(r => r !== role));
        }
    };

    const handleAdditionalSchoolChange = (schoolId: number, checked: boolean) => {
        if (checked) {
            setData('additional_school_ids', [...data.additional_school_ids, schoolId]);
        } else {
            setData('additional_school_ids', data.additional_school_ids.filter(id => id !== schoolId));
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">User Management</h2>}
        >
            <Head title="Users" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600 dark:text-gray-400">Manage all staff, teachers, and admins</p>
                        <div className="flex items-center space-x-2">
                            <a
                                href={route('admin.users.export')}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                <span>Export</span>
                            </a>
                            <button
                                onClick={() => setIsImportOpen(true)}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                <ArrowUpTrayIcon className="w-5 h-5" />
                                <span>Import</span>
                            </button>
                            <button
                                onClick={() => openDialog()}
                                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>Add User</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex justify-start">
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Cari nama, email, NIP, atau HP..."
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
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white">Name / Email</th>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white">Contact Info</th>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white">Roles</th>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white">Status</th>
                                        <th className="px-6 py-4 font-medium text-gray-900 dark:text-white text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">Data pengguna tidak ditemukan.</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((userRecord) => (
                                            <tr key={userRecord.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <UserCircleIcon className="w-8 h-8 text-gray-400" />
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">{userRecord.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{userRecord.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm">
                                                        <p className="text-gray-900 dark:text-white font-medium">{userRecord.nip || '-'}</p>
                                                        <p className="text-gray-500 dark:text-gray-400">{userRecord.phone || '-'}</p>
                                                        <p className="text-xs text-blue-500">{userRecord.telegram_id || '-'}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {userRecord.roles.map(r => (
                                                            <span key={r.name} className="inline-flex text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 px-2.5 py-0.5">
                                                                {r.name}
                                                            </span>
                                                        ))}
                                                        {userRecord.roles.length === 0 && <span className="text-xs text-gray-400">No Role</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex text-xs font-semibold rounded-full px-2.5 py-0.5 capitalize 
                                                        ${userRecord.status === 'active' ? 'bg-green-100 text-green-800' : 
                                                        userRecord.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                                                        'bg-red-100 text-red-800'}`}>
                                                        {userRecord.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => openDialog(userRecord)} className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    {auth.user.id !== userRecord.id && (
                                                        <button onClick={() => handleDelete(userRecord.id)} className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
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

            {/* Dialog */}
            {isDialogOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDialog}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full">
                            <form onSubmit={submit}>
                                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b dark:border-gray-700">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                        {editingUser ? 'Edit User' : 'New User'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
                                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NIP</label>
                                                <input type="text" value={data.nip} onChange={e => setData('nip', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white" placeholder="Optional" />
                                                {errors.nip && <p className="text-red-500 text-xs mt-1">{errors.nip}</p>}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email (Login)</label>
                                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white" />
                                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp / Phone</label>
                                                <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white" placeholder="e.g. 0812..." />
                                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telegram ID</label>
                                                <input type="text" value={data.telegram_id} onChange={e => setData('telegram_id', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white" placeholder="@username or ID" />
                                                {errors.telegram_id && <p className="text-red-500 text-xs mt-1">{errors.telegram_id}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</label>
                                            <select value={data.status} onChange={e => setData('status', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                                {statuses.map(s => (
                                                    <option key={s.value} value={s.value}>{s.label}</option>
                                                ))}
                                            </select>
                                            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                                        </div>

                                        {isSuperAdmin && schools && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">School (Sekolah Utama)</label>
                                                    <select value={data.school_id} onChange={e => {
                                                        const newSchoolId = e.target.value;
                                                        setData('school_id', newSchoolId);
                                                        // Hapus dari additional schools jika sama
                                                        if (newSchoolId && data.additional_school_ids.includes(Number(newSchoolId))) {
                                                            setData('additional_school_ids', data.additional_school_ids.filter(id => id !== Number(newSchoolId)));
                                                        }
                                                    }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                                                        <option value="">-- Pilih Sekolah -- (Kosongkan jika Super Admin)</option>
                                                        {schools.map(school => (
                                                            <option key={school.id} value={school.id}>{school.name}</option>
                                                        ))}
                                                    </select>
                                                    {errors.school_id && <p className="text-red-500 text-xs mt-1">{errors.school_id}</p>}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sekolah Tambahan (Multi-School)</label>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto">
                                                        {schools.map(school => (
                                                            <label key={`add_${school.id}`} className={`flex items-center space-x-2 text-sm cursor-pointer p-1 ${Number(data.school_id) === school.id ? 'opacity-50' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={data.additional_school_ids.includes(school.id)} 
                                                                    onChange={e => handleAdditionalSchoolChange(school.id, e.target.checked)}
                                                                    disabled={Number(data.school_id) === school.id}
                                                                    className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary dark:bg-gray-800 dark:border-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-700"
                                                                />
                                                                <span className="truncate" title={school.name}>{school.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                    {errors.additional_school_ids && <p className="text-red-500 text-xs mt-1">{errors.additional_school_ids}</p>}
                                                    <p className="text-xs text-gray-500 mt-1">Centang sekolah lain tempat guru/staff ini juga bertugas.</p>
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roles & Permissions</label>
                                            <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                                {roles.map(role => (
                                                    <label key={role} className="flex items-center space-x-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer p-1">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={data.roles.includes(role)} 
                                                            onChange={e => handleRoleChange(role, e.target.checked)}
                                                            className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary dark:bg-gray-800 dark:border-gray-600"
                                                        />
                                                        <span>{role}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {editingUser && (
                                            <div className="space-y-3">
                                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800/50 flex items-center space-x-3">
                                                    <KeyIcon className="w-6 h-6 text-orange-500" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-orange-800 dark:text-orange-400">Kembalikan ke Password Default</p>
                                                        <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">Reset password pengguna menjadi "password".</p>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={data.reset_password_default}
                                                        onChange={e => setData(prev => ({ ...prev, reset_password_default: e.target.checked, reset_password_email: e.target.checked ? false : prev.reset_password_email }))}
                                                        className="w-5 h-5 text-orange-600 rounded border-orange-300 focus:ring-orange-500"
                                                    />
                                                </div>

                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50 flex items-center space-x-3">
                                                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-blue-800 dark:text-blue-400">Kirim Link Reset Via Email</p>
                                                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">Kirim instruksi reset password ke email pengguna.</p>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={data.reset_password_email}
                                                        onChange={e => setData(prev => ({ ...prev, reset_password_email: e.target.checked, reset_password_default: e.target.checked ? false : prev.reset_password_default }))}
                                                        className="w-5 h-5 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {!editingUser && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-3 rounded text-center border border-dashed border-gray-200 dark:border-gray-700">
                                                Default password for new users will be set to <strong>"password"</strong>.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-600">
                                    <button type="submit" disabled={processing} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                                        {processing ? 'Saving...' : 'Save User Info'}
                                    </button>
                                    <button type="button" onClick={closeDialog} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Import Dialog */}
            {isImportOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsImportOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md w-full">
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                postImport(route('admin.users.import'), {
                                    onSuccess: () => {
                                        setIsImportOpen(false);
                                        resetImport();
                                    }
                                });
                            }}>
                                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b dark:border-gray-700">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Import Users</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        Upload Excel or CSV file to bulk add/update users. 
                                        <a href={route('admin.users.template')} className="text-primary hover:underline ml-1">Download Template</a>
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">File (xlsx, xls, csv)</label>
                                            <input 
                                                type="file" 
                                                onChange={e => setImportData('file', e.target.files ? e.target.files[0] : null)} 
                                                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                                accept=".xlsx,.xls,.csv"
                                                required
                                            />
                                            {importErrors.file && <p className="text-red-500 text-xs mt-1">{importErrors.file}</p>}
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                            <ul className="text-xs text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                                                <li>Email digunakan sebagai identitas unik.</li>
                                                <li>Jika email sudah ada, data user akan diperbarui.</li>
                                                <li>User baru akan mendapatkan password default: <strong>password</strong></li>
                                                <li>Pisahkan multiple roles dengan koma (contoh: Guru, Wali Kelas).</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200 dark:border-gray-600">
                                    <button type="submit" disabled={importProcessing} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                                        {importProcessing ? 'Importing...' : 'Start Import'}
                                    </button>
                                    <button type="button" onClick={() => setIsImportOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                                        Cancel
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

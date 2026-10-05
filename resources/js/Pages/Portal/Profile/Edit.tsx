import { Head, useForm, usePage } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';
import { FormEventHandler } from 'react';

export default function EditProfile() {
    const { student } = usePage<any>().props;

    const { data, setData, put, errors, processing, recentlySuccessful } = useForm({
        address: student.address || '',
        phone: student.phone || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        parent_email: student.parent_email || '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('portal.profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <PortalLayout
            header={
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Portal Siswa</span>
                    <span className="text-slate-400 dark:text-slate-500">/</span>
                    <span className="text-slate-900 dark:text-white font-semibold">Pengaturan Profil</span>
                </div>
            }
        >
            <Head title="Profil Siswa" />

            <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
                
                <div className="bg-white dark:bg-slate-800 p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
                    <div className="mb-6 lg:mb-8 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Informasi Pribadi & Wali</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Perbarui nomor kontak aktif, alamat terbaru, serta kontak wali siswa Anda.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                            
                            {/* Kontak Siswa Session */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">person</span>
                                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Kontak Siswa</h4>
                                </div>
                                
                                <div>
                                    <label className="block font-medium text-xs text-slate-700 dark:text-slate-300 mb-1.5">Nomor Telepon/WA Aktif</label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Misal: 08123456789"
                                    />
                                    {errors.phone && <p className="text-xs text-rose-500 mt-1.5">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-xs text-slate-700 dark:text-slate-300 mb-1.5">Alamat Domisili Siswa</label>
                                    <textarea
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                                        rows={3}
                                        placeholder="Alamat lengkap tinggal saat ini"
                                    />
                                    {errors.address && <p className="text-xs text-rose-500 mt-1.5">{errors.address}</p>}
                                </div>
                            </div>

                            {/* Kontak Wali Session */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">family_restroom</span>
                                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Kontak Wali / Orang Tua</h4>
                                </div>

                                <div>
                                    <label className="block font-medium text-xs text-slate-700 dark:text-slate-300 mb-1.5">Nama Walimurid</label>
                                    <input
                                        type="text"
                                        value={data.parent_name}
                                        onChange={(e) => setData('parent_name', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Nama yang dapat dihubungi"
                                    />
                                    {errors.parent_name && <p className="text-xs text-rose-500 mt-1.5">{errors.parent_name}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-xs text-slate-700 dark:text-slate-300 mb-1.5">Nomor Telepon Walimurid</label>
                                    <input
                                        type="text"
                                        value={data.parent_phone}
                                        onChange={(e) => setData('parent_phone', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Nomor Telepon/WA Orang Tua"
                                    />
                                    {errors.parent_phone && <p className="text-xs text-rose-500 mt-1.5">{errors.parent_phone}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-xs text-slate-700 dark:text-slate-300 mb-1.5">Email Walimurid (Opsional)</label>
                                    <input
                                        type="email"
                                        value={data.parent_email}
                                        onChange={(e) => setData('parent_email', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Untuk notifikasi administratif"
                                    />
                                    {errors.parent_email && <p className="text-xs text-rose-500 mt-1.5">{errors.parent_email}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 dark:border-slate-700/50">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Keamanan Akun</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kosongkan kolom sandi jika tidak ingin mengubah kata sandi Anda saat ini.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block font-medium text-xs text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi Baru</label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Minimal 8 karakter"
                                    />
                                    {errors.password && <p className="text-xs text-rose-500 mt-1.5">{errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-xs text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Kata Sandi Baru</label>
                                    <input
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                        placeholder="Ulangi kata sandi"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                            <button
                                disabled={processing}
                                type="submit"
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                Simpan Perubahan
                            </button>

                            {recentlySuccessful && (
                                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1 animate-pulse">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    Tersimpan!
                                </span>
                            )}
                        </div>

                    </form>
                </div>
            </div>
        </PortalLayout>
    );
}

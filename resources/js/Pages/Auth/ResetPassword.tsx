import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function ResetPassword({ token, email }: { token: string; email: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const EyeIcon = ({ show }: { show: boolean }) => show
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;

    const FormContent = (isMobile: boolean) => (
        <form onSubmit={submit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Alamat Email</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </span>
                    <input
                        type="email" name="email" value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        className={`block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 ${isMobile ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900'} text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                        placeholder="contoh@domain.com"
                    />
                </div>
                <InputError message={errors.email} className="mt-1" />
            </div>

            {/* Password Baru */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password Baru</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                    </span>
                    <input
                        type={showPassword ? 'text' : 'password'} name="password" value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        className={`block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 ${isMobile ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900'} text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                        placeholder="Minimal 8 karakter"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                        <EyeIcon show={showPassword} />
                    </button>
                </div>
                <InputError message={errors.password} className="mt-1" />
            </div>

            {/* Konfirmasi Password */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </span>
                    <input
                        type={showConfirm ? 'text' : 'password'} name="password_confirmation" value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        className={`block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 ${isMobile ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-900'} text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                        placeholder="Ulangi password baru"
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                        <EyeIcon show={showConfirm} />
                    </button>
                </div>
                <InputError message={errors.password_confirmation} className="mt-1" />
            </div>

            <button type="submit" disabled={processing}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                {processing ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
        </form>
    );

    return (
        <div className="min-h-screen font-sans bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <Head title="Reset Password - SALIRA" />

            {/* -- MOBILE LAYOUT (< md) -- */}
            <div className="flex flex-col w-full max-w-sm md:hidden">
                <div className="bg-gradient-to-br from-[#1a40b0] to-[#2563EB] px-6 pt-10 pb-16 flex flex-col gap-3 relative overflow-hidden rounded-t-3xl">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-400/10 rounded-full" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <img src="/images/logo-salira.png" alt="SALIRA Logo" className="h-6 w-auto brightness-0 invert" />
                            <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest">SALIRA</p>
                        </div>
                        <h1 className="text-white text-2xl font-black tracking-tight leading-tight">Buat Password Baru</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Masukkan password baru untuk akun Anda.</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-b-3xl px-6 pt-8 pb-8 flex flex-col gap-5 shadow-2xl border border-slate-100 dark:border-slate-700">
                    {FormContent(true)}
                </div>
            </div>

            {/* -- DESKTOP LAYOUT (>= md) -- */}
            <div className="hidden md:flex w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20">
                {/* Left - Brand Panel */}
                <div className="w-5/12 bg-gradient-to-br from-[#1a40b0] to-[#2563EB] p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-300/10 rounded-full" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <img src="/images/logo-salira.png" alt="SALIRA Logo" className="h-8 w-auto brightness-0 invert" />
                            <div>
                                <p className="text-white font-black text-2xl tracking-tight leading-none">SALIRA</p>
                                <p className="text-blue-200 text-[10px] font-medium tracking-widest uppercase mt-0.5">Sistem Manajemen Sekolah</p>
                            </div>
                        </div>
                        <h1 className="text-white text-3xl font-black leading-tight mb-3">Buat Password<br/>Baru</h1>
                        <p className="text-blue-100/80 text-sm leading-relaxed">Pilih password yang kuat dan belum pernah digunakan sebelumnya.</p>
                    </div>

                    <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                        <p className="text-xs text-blue-100 leading-relaxed">
                            Gunakan minimal <strong className="text-white">8 karakter</strong>, kombinasikan huruf besar, huruf kecil, angka, dan simbol untuk keamanan terbaik.
                        </p>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="w-7/12 bg-white dark:bg-slate-800 p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-8">
                        <img src="/images/logo-salira.png" alt="SALIRA Logo" className="h-8 w-auto" />
                        <span className="text-blue-900 dark:text-white font-black text-2xl tracking-tight">SALIRA</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Reset Password</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Masukkan dan konfirmasi password baru Anda.</p>
                    {FormContent(false)}
                    <Link href={route('login')} className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

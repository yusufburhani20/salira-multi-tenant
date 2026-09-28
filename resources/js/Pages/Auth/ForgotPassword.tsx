import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen font-sans bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
            <Head title="Lupa Kata Sandi - SALIRA" />

            {/* -- MOBILE LAYOUT (< md) -- */}
            <div className="flex flex-col w-full max-w-sm md:hidden">
                {/* Hero Header */}
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
                        <h1 className="text-white text-2xl font-black tracking-tight leading-tight">Lupa Kata Sandi?</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Kami akan kirimkan tautan reset ke email Anda.</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-slate-800 rounded-b-3xl -mt-0 flex-1 px-6 pt-8 pb-8 flex flex-col gap-5 shadow-2xl border border-slate-100 dark:border-slate-700">
                    {status && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{status}</p>
                        </div>
                    )}

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Alamat Email</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                </span>
                                <input
                                    id="email" type="email" name="email" value={data.email} required autoFocus
                                    onChange={e => setData('email', e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="contoh@domain.com"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <button type="submit" disabled={processing}
                            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                            {processing ? 'Mengirim...' : 'Kirim Link Reset'}
                        </button>
                    </form>

                    <Link href={route('login')} className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        Kembali ke Login
                    </Link>
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

                        <h1 className="text-white text-3xl font-black leading-tight mb-3">Lupa<br/>Kata Sandi?</h1>
                        <p className="text-blue-100/80 text-sm leading-relaxed">
                            Masukkan email akun Anda. Kami akan segera mengirimkan tautan untuk mengatur ulang kata sandi.
                        </p>
                    </div>

                    <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                        <p className="text-xs text-blue-100 leading-relaxed">
                            Pastikan alamat email yang Anda masukkan sama dengan yang terdaftar di sistem SALIRA.
                        </p>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="w-7/12 bg-white dark:bg-slate-800 p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-8">
                        <img src="/images/logo-salira.png" alt="SALIRA Logo" className="h-8 w-auto" />
                        <span className="text-blue-900 dark:text-white font-black text-2xl tracking-tight">SALIRA</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Pemulihan Akun</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Masukkan email Anda untuk menerima link reset password.</p>

                    {status && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 mb-5">
                            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{status}</p>
                        </div>
                    )}

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Alamat Email</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                </span>
                                <input
                                    id="email-desktop" type="email" name="email" value={data.email} required autoFocus
                                    onChange={e => setData('email', e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="contoh@domain.com"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <button type="submit" disabled={processing}
                            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                            {processing ? 'Mengirim...' : 'Kirim Link Reset'}
                        </button>
                    </form>

                    <Link href={route('login')} className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-6">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

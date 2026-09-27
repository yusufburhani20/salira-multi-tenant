import { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function PortalLogin() {
    const { data, setData, post, processing, errors, reset } = useForm({
        nisn: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = (e: any) => {
        e.preventDefault();
        post(route('portal.login'));
    };

    return (
        <div className="min-h-screen font-sans bg-slate-100 dark:bg-slate-900 transition-colors">
            <Head title="Masuk Portal Siswa — SALIRA" />

            {/* ── MOBILE LAYOUT (< md) ── */}
            <div className="flex flex-col min-h-screen md:hidden">
                {/* Hero Header */}
                <div className="bg-gradient-to-br from-[#1a40b0] to-[#2563EB] px-6 pt-12 pb-20 flex flex-col gap-3 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-400/10 rounded-full" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-white font-black text-sm">S</span>
                            </div>
                            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">PORTAL SALIRA</p>
                        </div>
                        <h1 className="text-white text-3xl font-black tracking-tight leading-tight">Selamat Datang 👋</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Masuk untuk Siswa & Wali Murid.</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-slate-800 rounded-t-3xl -mt-8 flex-1 px-6 pt-8 pb-10 flex flex-col gap-5 relative z-10 shadow-2xl">
                    <form onSubmit={submit} className="flex flex-col gap-4">
                        {/* NISN */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">NISN Siswa</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                </span>
                                <input id="nisn" type="text" name="nisn" value={data.nisn} required
                                    onChange={e => setData('nisn', e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Masukkan NISN"
                                />
                            </div>
                            <InputError message={errors.nisn} className="mt-1" />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                </span>
                                <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={data.password} required
                                    onChange={e => setData('password', e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Format DDMMYYYY atau 123456"
                                />
                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                                    {showPassword
                                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                    }
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={processing}
                            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                            {processing ? 'Memproses...' : 'Masuk ke Portal Siswa'}
                        </button>
                    </form>

                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">Bagi login pertama, gunakan <strong>NISN</strong> sebagai Username dan <strong>Format DDMMYYYY tanggal lahir</strong> (atau <strong>123456</strong> jika kosong) sebagai Sandi.</p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-xs text-slate-400">atau</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>

                    <Link
                        href={route('portal.attendance.scanner')}
                        className="flex items-center justify-center gap-3 w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        Absensi Scanner (Tapping)
                    </Link>

                    <a
                        href="/login"
                        className="text-center text-blue-600 dark:text-blue-400 hover:underline text-xs font-semibold tracking-wider py-2 mt-2"
                    >
                        ← KEMBALI KE PORTAL GURU
                    </a>
                </div>
            </div>

            {/* ── DESKTOP LAYOUT (≥ md) ── */}
            <div className="hidden md:flex min-h-screen items-center justify-center p-8">
                <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20">

                    {/* Left — Brand Panel */}
                    <div className="w-5/12 bg-gradient-to-br from-[#1a40b0] to-[#2563EB] p-10 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-300/10 rounded-full" />
                        </div>

                        {/* Wordmark */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
                                    <span className="text-white font-black text-2xl">S</span>
                                </div>
                                <div>
                                    <p className="text-white font-black text-2xl tracking-tight leading-none">PORTAL</p>
                                    <p className="text-blue-200 text-[11px] font-medium tracking-widest uppercase mt-1">Siswa & Wali Murid</p>
                                </div>
                            </div>
                        </div>

                        {/* Hero text */}
                        <div className="relative z-10">
                            <h1 className="text-white text-3xl font-black leading-tight mb-3">Selamat Datang<br/>di SALIRA</h1>
                            <p className="text-blue-100/80 text-sm leading-relaxed mb-8">Masuk untuk memantau absensi, tagihan, dan perkembangan Peserta Didik.</p>

                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 mb-8">
                                <p className="text-xs text-blue-50 font-medium leading-relaxed">Bagi login pertama, gunakan <strong className="text-white">NISN</strong> sebagai Username dan <strong className="text-white">Format DDMMYYYY tanggal lahir</strong> (atau <strong className="text-white">123456</strong> jika kosong) sebagai Sandi.</p>
                            </div>

                            <Link
                                href={route('portal.attendance.scanner')}
                                className="flex items-center justify-center gap-3 w-full bg-white text-blue-700 hover:bg-blue-50 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 active:scale-95 mb-4"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                                Absensi Scanner (Tapping)
                            </Link>
                            <a
                                href="/login"
                                className="inline-block text-blue-100 hover:text-white underline text-xs font-semibold tracking-wider relative z-10"
                            >
                                ← KEMBALI KE PORTAL GURU
                            </a>
                        </div>
                    </div>

                    {/* Right — Login Form */}
                    <div className="w-7/12 bg-white dark:bg-slate-800 p-10 flex flex-col justify-center">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Masuk</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Gunakan NISN dan Password.</p>

                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">NISN Siswa</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                    </span>
                                    <input type="text" value={data.nisn} required
                                        onChange={e => setData('nisn', e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="NISN"
                                    />
                                </div>
                                <InputError message={errors.nisn} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                    </span>
                                    <input type={showPassword ? 'text' : 'password'} value={data.password} required
                                        onChange={e => setData('password', e.target.value)}
                                        className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Format DDMMYYYY atau 123456"
                                    />
                                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                                        {showPassword
                                            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                        }
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-1" />
                            </div>

                            <button type="submit" disabled={processing}
                                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                                {processing ? 'Memproses...' : 'Masuk ke Portal Siswa'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

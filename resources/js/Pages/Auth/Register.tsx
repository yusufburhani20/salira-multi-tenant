import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

type School = { id: number; name: string; type: string; };

export default function Register({ schools = [] }: { schools: School[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        nip: '',
        phone: '',
        telegram_id: '',
        role: 'Guru',
        school_id: schools.length === 1 ? String(schools[0].id) : '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const EyeOpen = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
    );
    const EyeClosed = () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        </svg>
    );

    const inputBase = "block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder-slate-400";
    const selectBase = "block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all";
    const labelBase = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5";

    return (
        <div className="min-h-screen font-sans bg-slate-100 dark:bg-slate-900 transition-colors">
            <Head title="Daftar Akun — SALIRA" />

            {/* ── MOBILE LAYOUT (< md) ── */}
            <div className="flex flex-col min-h-screen md:hidden">
                {/* Hero Header */}
                <div className="bg-gradient-to-br from-[#1a40b0] to-[#2563EB] px-6 pt-10 pb-16 relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-400/10 rounded-full" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <img src="/images/logo-salira.png" alt="SALIRA Logo" className="h-6 w-auto brightness-0 invert" />
                            <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest">SALIRA</p>
                        </div>
                        <h1 className="text-white text-2xl font-black tracking-tight leading-tight">Buat Akun Baru</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Registrasi Guru & Staff</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-slate-800 rounded-t-3xl -mt-6 flex-1 px-5 pt-7 pb-10 relative z-10 shadow-2xl">
                    <form onSubmit={submit} className="flex flex-col gap-4">

                        {/* Nama Lengkap */}
                        <div>
                            <label className={labelBase}>Nama Lengkap</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                </span>
                                <input type="text" value={data.name} autoComplete="name" required autoFocus
                                    onChange={e => setData('name', e.target.value)}
                                    className={inputBase} placeholder="Nama sesuai data resmi" />
                            </div>
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        {/* NIP */}
                        <div>
                            <label className={labelBase}>NIP / NUPTK</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2"/></svg>
                                </span>
                                <input type="text" value={data.nip} required
                                    onChange={e => setData('nip', e.target.value)}
                                    className={inputBase} placeholder="Nomor Induk Pegawai" />
                            </div>
                            <InputError message={errors.nip} className="mt-1" />
                        </div>

                        {/* Sekolah */}
                        <div>
                            <label className={labelBase}>Sekolah</label>
                            <select value={data.school_id} onChange={e => setData('school_id', e.target.value)} className={selectBase} required>
                                <option value="">-- Pilih Sekolah --</option>
                                {schools.map(s => (
                                    <option key={s.id} value={String(s.id)}>{s.type} — {s.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.school_id} className="mt-1" />
                        </div>

                        {/* Role */}
                        <div>
                            <label className={labelBase}>Daftar Sebagai</label>
                            <select value={data.role} onChange={e => setData('role', e.target.value)} className={selectBase} required>
                                <option value="Guru">Guru</option>
                                <option value="Staff/TU">Staff / Tata Usaha</option>
                            </select>
                            <InputError message={errors.role} className="mt-1" />
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelBase}>Email Aktif</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                </span>
                                <input type="email" value={data.email} autoComplete="username" required
                                    onChange={e => setData('email', e.target.value)}
                                    className={inputBase} placeholder="nama@email.com" />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        {/* No HP */}
                        <div>
                            <label className={labelBase}>No. HP (Aktif)</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                </span>
                                <input type="text" value={data.phone} required
                                    onChange={e => setData('phone', e.target.value)}
                                    className={inputBase} placeholder="08xxxxxxxxxx" />
                            </div>
                            <InputError message={errors.phone} className="mt-1" />
                        </div>

                        {/* Telegram */}
                        <div>
                            <label className={labelBase}>ID Telegram <span className="text-slate-400 font-normal">(opsional)</span></label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                </span>
                                <input type="text" value={data.telegram_id}
                                    onChange={e => setData('telegram_id', e.target.value)}
                                    className={inputBase} placeholder="@username atau ChatID" />
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">Digunakan untuk notifikasi bot Telegram.</p>
                            <InputError message={errors.telegram_id} className="mt-1" />
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelBase}>Kata Sandi</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                </span>
                                <input type={showPassword ? 'text' : 'password'} value={data.password} autoComplete="new-password" required
                                    onChange={e => setData('password', e.target.value)}
                                    className={inputBase + ' pr-10'} placeholder="Minimal 8 karakter" />
                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                                    {showPassword ? <EyeClosed /> : <EyeOpen />}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        {/* Konfirmasi Password */}
                        <div>
                            <label className={labelBase}>Konfirmasi Kata Sandi</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                                </span>
                                <input type={showPassword ? 'text' : 'password'} value={data.password_confirmation} autoComplete="new-password" required
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    className={inputBase + ' pr-10'} placeholder="Ulangi kata sandi" />
                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                                    {showPassword ? <EyeClosed /> : <EyeOpen />}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-1" />
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={processing}
                            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed mt-2">
                            {processing ? 'Mendaftarkan...' : 'Buat Akun'}
                        </button>

                        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                            Sudah punya akun?{' '}
                            <Link href={route('login')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Masuk di sini</Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* ── DESKTOP LAYOUT (≥ md) ── */}
            <div className="hidden md:flex min-h-screen items-center justify-center p-8">
                <div className="flex w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20">

                    {/* Left — Brand Panel */}
                    <div className="w-5/12 bg-gradient-to-br from-[#1a40b0] to-[#2563EB] p-10 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-300/10 rounded-full" />
                        </div>

                        <div className="relative z-10 mb-8">
                            <div className="flex items-center gap-4">
                                <h1 className="text-white font-black text-4xl tracking-tight">SALIRA</h1>
                                <div className="w-px h-10 bg-white/30"></div>
                                <p className="text-blue-100 text-[11px] leading-relaxed font-medium">
                                    Sistem Absensi, Logistik, Inventaris<br />
                                    & Rekapitulasi Akademik
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h1 className="text-white text-3xl font-black leading-tight mb-3">Buat Akun<br/>SALIRA</h1>
                            <p className="text-blue-100/80 text-sm leading-relaxed mb-8">Daftarkan akun Guru atau Staff untuk mengakses sistem manajemen sekolah.</p>

                            <div className="space-y-3 mb-8">
                                {['Absensi digital real-time', 'Laporan akademik otomatis', 'Notifikasi via Telegram', 'Manajemen inventaris & logistik'].map(f => (
                                    <div key={f} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                        </div>
                                        <span className="text-sm text-white/90">{f}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href={route('login')}
                                className="inline-block border border-white/40 text-white hover:bg-white hover:text-blue-700 transition-colors rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider">
                                Sudah Punya Akun? Masuk
                            </Link>
                        </div>
                    </div>

                    {/* Right — Register Form */}
                    <div className="w-7/12 bg-white dark:bg-slate-800 p-10 overflow-y-auto max-h-screen">
                        <div className="flex items-center gap-2 mb-10 mx-auto">
                            <img src="/images/logo-salira.png" alt="SALIRA Logo" className="h-8 w-auto" />
                            <span className="text-blue-900 dark:text-white font-black text-2xl tracking-tight">SALIRA</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Buat Akun Baru</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Isi semua data di bawah untuk mendaftar.</p>

                        <form onSubmit={submit} className="flex flex-col gap-0">
                            {/* Section: Data Diri */}
                            <div className="mb-5">
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-4 h-px bg-blue-600 dark:bg-blue-400 inline-block" />Data Diri
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className={labelBase}>Nama Lengkap</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                            </span>
                                            <input type="text" value={data.name} autoComplete="name" required autoFocus
                                                onChange={e => setData('name', e.target.value)}
                                                className={inputBase} placeholder="Nama sesuai data resmi" />
                                        </div>
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className={labelBase}>NIP / NUPTK</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"/></svg>
                                            </span>
                                            <input type="text" value={data.nip} required
                                                onChange={e => setData('nip', e.target.value)}
                                                className={inputBase} placeholder="No. Induk Pegawai" />
                                        </div>
                                        <InputError message={errors.nip} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className={labelBase}>Sekolah</label>
                                        <select value={data.school_id} onChange={e => setData('school_id', e.target.value)} className={selectBase} required>
                                            <option value="">-- Pilih Sekolah --</option>
                                            {schools.map(s => (
                                                <option key={s.id} value={String(s.id)}>{s.type} — {s.name}</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.school_id} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className={labelBase}>Daftar Sebagai</label>
                                        <select value={data.role} onChange={e => setData('role', e.target.value)} className={selectBase} required>
                                            <option value="Guru">Guru</option>
                                            <option value="Staff/TU">Staff / Tata Usaha</option>
                                        </select>
                                        <InputError message={errors.role} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className={labelBase}>No. HP Aktif</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                            </span>
                                            <input type="text" value={data.phone} required
                                                onChange={e => setData('phone', e.target.value)}
                                                className={inputBase} placeholder="08xxxxxxxxxx" />
                                        </div>
                                        <InputError message={errors.phone} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className={labelBase}>Email Aktif</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                            </span>
                                            <input type="email" value={data.email} autoComplete="username" required
                                                onChange={e => setData('email', e.target.value)}
                                                className={inputBase} placeholder="nama@email.com" />
                                        </div>
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Keamanan */}
                            <div className="mb-5">
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-4 h-px bg-blue-600 dark:bg-blue-400 inline-block" />Keamanan
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelBase}>Kata Sandi</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                            </span>
                                            <input type={showPassword ? 'text' : 'password'} value={data.password} autoComplete="new-password" required
                                                onChange={e => setData('password', e.target.value)}
                                                className={inputBase + ' pr-10'} placeholder="Min. 8 karakter" />
                                            <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                                                {showPassword ? <EyeClosed /> : <EyeOpen />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} className="mt-1" />
                                    </div>
                                    <div>
                                        <label className={labelBase}>Konfirmasi Sandi</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                                            </span>
                                            <input type={showPassword ? 'text' : 'password'} value={data.password_confirmation} autoComplete="new-password" required
                                                onChange={e => setData('password_confirmation', e.target.value)}
                                                className={inputBase + ' pr-10'} placeholder="Ulangi kata sandi" />
                                            <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors">
                                                {showPassword ? <EyeClosed /> : <EyeOpen />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password_confirmation} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Section: Opsional */}
                            <div className="mb-6">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-4 h-px bg-slate-300 dark:bg-slate-600 inline-block" />Opsional
                                </p>
                                <div>
                                    <label className={labelBase}>ID Telegram</label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                        </span>
                                        <input type="text" value={data.telegram_id}
                                            onChange={e => setData('telegram_id', e.target.value)}
                                            className={inputBase} placeholder="@username atau ChatID Telegram" />
                                    </div>
                                    <p className="mt-1 text-[10px] text-slate-400">Digunakan untuk notifikasi bot Telegram.</p>
                                    <InputError message={errors.telegram_id} className="mt-1" />
                                </div>
                            </div>

                            <button type="submit" disabled={processing}
                                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed">
                                {processing ? 'Mendaftarkan...' : 'Buat Akun Sekarang'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

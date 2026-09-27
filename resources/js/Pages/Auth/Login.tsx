import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Login({
    status,
    canResetPassword,
    activeEvents = [],
    users = [],
}: {
    status?: string;
    canResetPassword: boolean;
    activeEvents?: Array<{ id: number; name: string; date: string; start_time: string; end_time: string }>;
    users?: Array<{ id: number; name: string; nip: string }>;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // â”€â”€ Event Attendance Logic â”€â”€
    const { flash } = usePage().props as any;
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [selectedUserName, setSelectedUserName] = useState('');
    const [isManualGuest, setIsManualGuest] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [attendanceSuccess, setAttendanceSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [modalError, setModalError] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: eventData, setData: setEventData, post: postEvent, processing: processingEvent, errors: eventErrors, reset: resetEvent } = useForm({
        event_id: '',
        user_id: '',
        guest_name: '',
        proof: null as File | null,
    });

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowUserDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const [isCompressing, setIsCompressing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                resolve(file);
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height = Math.round((height * MAX_WIDTH) / width);
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width = Math.round((width * MAX_HEIGHT) / height);
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(file);
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg", {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        },
                        'image/jpeg',
                        0.75
                    );
                };
                img.onerror = () => resolve(file);
            };
            reader.onerror = () => resolve(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const file = target.files ? target.files[0] : null;
        if (!file) return;

        setIsCompressing(true);
        try {
            const compressed = await compressImage(file);
            setEventData('proof', compressed);
            
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(compressed);
        } catch (error) {
            console.error('Compression error:', error);
            setEventData('proof', file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrl(reader.result as string);
            reader.readAsDataURL(file);
        } finally {
            setIsCompressing(false);
            // Reset input value so same file can be selected again
            target.value = '';
        }
    };

    useEffect(() => {
        if (flash?.success) {
            setToast({ message: flash.success, type: 'success' });
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
        if (flash?.error) {
            setToast({ message: flash.error, type: 'error' });
            const timer = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

    // Bersihkan seluruh state form dan error saat modal ditutup
    useEffect(() => {
        if (!showEventModal) {
            setAttendanceSuccess(false);
            setSuccessMessage('');
            setModalError(null);
            resetEvent();
            setPreviewUrl(null);
            setSearchUser('');
            setSelectedUserName('');
            setIsManualGuest(false);
            setGuestName('');
        }
    }, [showEventModal]);

    // Kelola pesan error modal secara reaktif
    useEffect(() => {
        const errorKeys = Object.keys(eventErrors);
        if (errorKeys.length > 0) {
            setModalError('Gagal mengirim absensi. Silakan periksa kembali data Anda.');
        } else if (flash?.error) {
            setModalError(flash.error);
        } else {
            setModalError(null);
        }
    }, [eventErrors, flash?.error]);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.nip ?? '').toLowerCase().includes(searchUser.toLowerCase())
    );

    const handleSelectUser = (user: { id: number; name: string; nip: string }) => {
        setEventData('user_id', String(user.id));
        setEventData('guest_name', '');
        setIsManualGuest(false);
        setSelectedUserName(user.name);
        setSearchUser(user.name);
        setShowUserDropdown(false);
    };

    const handleSelectManualGuest = (name: string) => {
        setIsManualGuest(true);
        setGuestName(name);
        setEventData('user_id', '');
        setEventData('guest_name', name);
        setSelectedUserName(name);
        setSearchUser(name);
        setShowUserDropdown(false);
    };

    const handleEventSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('event_id', eventData.event_id);
            if (isManualGuest || !eventData.user_id) {
                formData.append('guest_name', guestName || searchUser);
            } else {
                formData.append('user_id', eventData.user_id);
            }
            if (eventData.proof) {
                formData.append('proof', eventData.proof);
            }

            const response = await axios.post('/event-attendance', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (response.data.success) {
                setAttendanceSuccess(true);
                setSuccessMessage(response.data.success);
            } else if (response.data.error) {
                setModalError(response.data.error);
            } else {
                setAttendanceSuccess(true);
                setSuccessMessage('Absensi Anda telah berhasil dicatat oleh sistem.');
            }
        } catch (error: any) {
            console.error('Submission error:', error);
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                const firstError = Object.values(validationErrors)[0] as string[];
                setModalError(firstError?.[0] || 'Data yang Anda masukkan tidak valid.');
            } else {
                const errMsg = error.response?.data?.error || error.response?.data?.message || 'Gagal mengirim absensi. Silakan periksa kembali data Anda.';
                setModalError(errMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen font-sans bg-slate-100 dark:bg-slate-900 transition-colors">
            <Head title="Masuk â€” SALIRA" />

            {/* â”€â”€ MOBILE LAYOUT (< md) â”€â”€ */}
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
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">SALIRA</p>
                        </div>
                        <h1 className="text-white text-3xl font-black tracking-tight leading-tight">Selamat Datang</h1>
                        <p className="text-blue-100/80 text-sm mt-1">Masuk untuk melanjutkan.</p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-slate-800 rounded-t-3xl -mt-8 flex-1 px-6 pt-8 pb-10 flex flex-col gap-5 relative z-10 shadow-2xl">
                    {status && <div className="text-sm text-blue-600 font-medium">{status}</div>}

                    <form onSubmit={submit} className="flex flex-col gap-4">
                        {/* Email / NIP */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Email atau NIP</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                </span>
                                <input id="login" type="text" name="login" value={data.login} autoComplete="username" required
                                    onChange={e => setData('login', e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Masukkan email atau NIP"
                                />
                            </div>
                            <InputError message={errors.login} className="mt-1" />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                </span>
                                <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={data.password} autoComplete="current-password" required
                                    onChange={e => setData('password', e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Masukkan password"
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

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox name="remember" checked={data.remember}
                                    className="rounded text-blue-600 border-slate-300 dark:border-slate-600"
                                    onChange={e => setData('remember', (e.target.checked || false) as false)}
                                />
                                <span className="text-xs text-slate-500 dark:text-slate-400">Ingat Saya</span>
                            </label>
                            {canResetPassword && (
                                <Link href={route('password.request')} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                                    Lupa sandi?
                                </Link>
                            )}
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={processing}
                            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                            {processing ? 'Memproses...' : 'Masuk sebagai Guru / Staff'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-xs text-slate-400">atau</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    </div>

                    {/* Portal Siswa */}
                    <Link href={route('portal.login')}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                        <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                            Portal Siswa & Wali Murid
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </Link>

                    {/* Absen Event */}
                    <button type="button"
                        onClick={() => { resetEvent(); setPreviewUrl(null); setSearchUser(''); setSelectedUserName(''); setShowEventModal(true); }}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-100 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-bold text-sm hover:bg-blue-200 dark:hover:bg-blue-950/50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        Absen Event / Rapat
                    </button>

                    {/* Register link */}
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                        Belum punya akun?{' '}
                        <Link href={route('register')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Daftar di sini</Link>
                    </p>
                </div>
            </div>

            {/* â”€â”€ DESKTOP LAYOUT (â‰¥ md) â”€â”€ */}
            <div className="hidden md:flex min-h-screen items-center justify-center p-8">
                <div className="flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl shadow-blue-900/20">

                    {/* Left â€” Brand Panel */}
                    <div className="w-5/12 bg-gradient-to-br from-[#1a40b0] to-[#2563EB] p-10 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-300/10 rounded-full" />
                        </div>

                        {/* Wordmark */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </div>
                                <div>
                                    <p className="text-white font-black text-2xl tracking-tight leading-none">SALIRA</p>
                                    <p className="text-blue-200 text-[11px] font-medium tracking-widest uppercase mt-1">Sistem Absensi & Akademik</p>
                                </div>
                            </div>
                        </div>

                        {/* Hero text */}
                        <div className="relative z-10">
                            <h1 className="text-white text-3xl font-black leading-tight mb-3">Selamat Datang<br/>di SALIRA</h1>
                            <p className="text-blue-100/80 text-sm leading-relaxed mb-8">Platform manajemen sekolah modern dan terpadu.</p>

                            {/* Feature mini-cards */}
                            <div className="grid grid-cols-3 gap-2 mb-8">
                                {[
                                    {icon:<svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, title:'Absensi', sub:'Digital'},
                                    {icon:<svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>, title:'Laporan', sub:'Akademik'},
                                    {icon:<svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>, title:'Event', sub:'Kegiatan'}
                                ].map(f => (
                                    <div key={f.title} className="bg-white/10 border border-white/20 rounded-xl p-3 text-center">
                                        <div className="text-white mb-1">{f.icon}</div>
                                        <p className="text-[11px] font-bold text-white">{f.title}</p>
                                        <p className="text-[10px] text-blue-200">{f.sub}</p>
                                    </div>
                                ))}
                            </div>

                            <Link href={route('register')}
                                className="inline-block border border-white/40 text-white hover:bg-white hover:text-blue-700 transition-colors rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-wider">
                                Daftar Akun
                            </Link>
                        </div>
                    </div>

                    {/* Right â€” Login Form */}
                    <div className="w-7/12 bg-white dark:bg-slate-800 p-10 flex flex-col justify-center">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Masuk</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">Gunakan akun yang telah didaftarkan.</p>

                        {status && <div className="mb-4 text-sm text-blue-600 font-medium">{status}</div>}

                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Email atau NIP</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                    </span>
                                    <input type="text" value={data.login} autoComplete="username" required
                                        onChange={e => setData('login', e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Email atau NIP"
                                    />
                                </div>
                                <InputError message={errors.login} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Password</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                    </span>
                                    <input type={showPassword ? 'text' : 'password'} value={data.password} autoComplete="current-password" required
                                        onChange={e => setData('password', e.target.value)}
                                        className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        placeholder="Password"
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

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox name="remember" checked={data.remember}
                                        className="rounded text-blue-600 border-slate-300 dark:border-slate-600"
                                        onChange={e => setData('remember', (e.target.checked || false) as false)}
                                    />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Ingat Saya</span>
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">Lupa sandi?</Link>
                                )}
                            </div>

                            <button type="submit" disabled={processing}
                                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed mt-1">
                                {processing ? 'Memproses...' : 'Masuk sebagai Guru / Staff'}
                            </button>
                        </form>

                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            <span className="text-xs text-slate-400">atau</span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Link href={route('portal.login')}
                                className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-bold text-sm hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                                    Portal Siswa & Wali Murid
                                </span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                            </Link>

                            <button type="button"
                                onClick={() => { resetEvent(); setPreviewUrl(null); setSearchUser(''); setSelectedUserName(''); setShowEventModal(true); }}
                                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-100 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-bold text-sm hover:bg-blue-200 dark:hover:bg-blue-950/50 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                Absen Event / Rapat
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* â”€â”€ EVENT ATTENDANCE MODAL â”€â”€ */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center"
                    onClick={() => setShowUserDropdown(false)}>
                    {/* Mobile: bottom sheet | Desktop: centered dialog */}
                    <div className="w-full md:max-w-lg bg-white dark:bg-slate-800 md:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}>

                        {/* Handle bar (mobile only) */}
                        <div className="flex justify-center pt-3 pb-1 md:hidden">
                            <div className="w-9 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                        </div>

                        <div className="px-6 pb-6 pt-3 md:pt-6 max-h-[90vh] overflow-y-auto">
                            {attendanceSuccess ? (
                                <div className="text-center py-8 space-y-4">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Absensi Berhasil!</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{successMessage || 'Kehadiran Anda telah berhasil dicatat.'}</p>
                                    <button type="button" onClick={() => setShowEventModal(false)}
                                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors">
                                        Selesai
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Modal Header */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Absen Event / Rapat</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Isi data kehadiran Anda di bawah.</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setShowEventModal(false)}
                                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                                        </button>
                                    </div>

                                    {modalError && (
                                        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                            <span>{modalError}</span>
                                        </div>
                                    )}

                                    <form onSubmit={handleEventSubmit} className="space-y-4">
                                        {/* Pilih Event */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pilih Event *</label>
                                            {activeEvents.length === 0 ? (
                                                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-800">
                                                    Tidak ada event aktif saat ini.
                                                </div>
                                            ) : (
                                                <select value={eventData.event_id} onChange={e => setEventData('event_id', e.target.value)} required
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                                                    <option value="">-- Pilih Event --</option>
                                                    {activeEvents.map(ev => (
                                                        <option key={ev.id} value={ev.id}>
                                                            {ev.name} ({new Date(ev.date).toLocaleDateString('id-ID', {day:'2-digit', month:'2-digit'})})
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            <InputError message={eventErrors.event_id} className="mt-1" />
                                        </div>

                                        {/* Nama Peserta */}
                                        <div className="relative" ref={dropdownRef}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                    {isManualGuest ? 'Nama Tamu *' : 'Nama Peserta *'}
                                                </label>
                                                <button type="button" onClick={() => {
                                                    setIsManualGuest(!isManualGuest);
                                                    setShowUserDropdown(false);
                                                    if (!isManualGuest) { setEventData('user_id', ''); setGuestName(searchUser); }
                                                    else { setEventData('guest_name', ''); setGuestName(''); }
                                                }} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                                    {isManualGuest ? 'â† Pilih dari Terdaftar' : '+ Tamu / Belum Terdaftar?'}
                                                </button>
                                            </div>

                                            {isManualGuest ? (
                                                <input type="text" value={guestName} required
                                                    onChange={e => { setGuestName(e.target.value); setEventData('guest_name', e.target.value); setEventData('user_id', ''); setSearchUser(e.target.value); }}
                                                    className="w-full rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-slate-900 text-slate-900 dark:text-white text-sm p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                    placeholder="Ketikkan nama lengkap (Tamu / Peserta Luar)..."
                                                />
                                            ) : (
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                                    </span>
                                                    <input type="text" value={searchUser}
                                                        onChange={e => { setSearchUser(e.target.value); setShowUserDropdown(true); if (e.target.value !== selectedUserName) setEventData('user_id', ''); }}
                                                        onFocus={() => setShowUserDropdown(true)}
                                                        onClick={e => { e.stopPropagation(); setShowUserDropdown(true); }}
                                                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                        placeholder="Ketik nama atau NIP Anda..."
                                                        required={!isManualGuest}
                                                    />
                                                </div>
                                            )}
                                            <InputError message={eventErrors.user_id || eventErrors.guest_name} className="mt-1" />

                                            {!isManualGuest && showUserDropdown && (
                                                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 divide-y divide-slate-100 dark:divide-slate-800">
                                                    {filteredUsers.length === 0 ? (
                                                        <div className="p-3 text-center">
                                                            <p className="text-slate-400 text-xs italic mb-2">Nama tidak ditemukan di sistem.</p>
                                                            {searchUser.trim() !== '' && (
                                                                <button type="button" onClick={() => handleSelectManualGuest(searchUser)}
                                                                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all">
                                                                    + Gunakan "{searchUser}" sebagai Tamu
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {filteredUsers.map(u => (
                                                                <button key={u.id} type="button"
                                                                    onClick={e => { e.stopPropagation(); handleSelectUser(u); }}
                                                                    className="w-full text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                                        {u.name.split(' ').map((n:string) => n[0]).slice(0,2).join('').toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{u.name}</p>
                                                                        <p className="text-xs text-slate-400 font-mono">NIP: {u.nip}</p>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">Pilih</span>
                                                                </button>
                                                            ))}
                                                            {searchUser.trim() !== '' && (
                                                                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 text-center">
                                                                    <button type="button" onClick={() => handleSelectManualGuest(searchUser)}
                                                                        className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline">
                                                                        + Gunakan "{searchUser}" sebagai Peserta Tamu
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Bukti Foto */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Bukti Hadir (Foto) *</label>
                                            {isCompressing ? (
                                                <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-6 bg-blue-50/40 dark:bg-blue-950/5 flex flex-col items-center gap-3 h-36">
                                                    <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18"/></svg>
                                                    <span className="text-xs font-bold text-blue-600 animate-pulse">Mengompres foto...</span>
                                                </div>
                                            ) : previewUrl ? (
                                                <div className="border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-3 bg-blue-50/40 dark:bg-blue-950/10 flex flex-col items-center gap-2">
                                                    <img src={previewUrl} alt="Preview" className="max-h-36 rounded-xl object-contain shadow-md border border-slate-200 dark:border-slate-700" />
                                                    <button type="button" onClick={() => { setPreviewUrl(null); setEventData('proof', null); }}
                                                        className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                                                        Hapus & Ganti Foto
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2.5">
                                                    <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-all group">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">Ambil Foto<br/><span className="text-[9px] font-normal text-slate-400">Gunakan Kamera</span></span>
                                                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                                                    </label>
                                                    <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 transition-all group">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                                            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">Pilih Foto<br/><span className="text-[9px] font-normal text-slate-400">Dari Galeri / File</span></span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                                    </label>
                                                </div>
                                            )}
                                            <InputError message={eventErrors.proof} className="mt-1" />
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <button type="button" onClick={() => setShowEventModal(false)}
                                                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                Batal
                                            </button>
                                            <button type="submit" disabled={isSubmitting || activeEvents.length === 0 || !eventData.proof || isCompressing}
                                                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                                {isSubmitting ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18"/></svg>Mengirim...</>) : (<><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>Kirim Absen</>)}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[100]">
                    <div className={`px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border-2 ${
                        toast.type === 'success' ? 'bg-blue-600 text-white border-blue-400' : 'bg-rose-600 text-white border-rose-400'
                    }`}>
                        <span className="font-bold text-sm">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

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

    // ── Event Attendance Logic ──
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 font-sans relative overflow-hidden transition-colors">
            <Head title="Log in" />

            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="flex flex-col md:flex-row w-full max-w-4xl bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl shadow-blue-500/10 dark:shadow-none border border-white/20 dark:border-slate-700/50 h-auto md:h-[500px] relative z-10 transition-colors">
                {/* Left Side - Welcome Panel (hidden on mobile) */}
                <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-[#1a40b0] to-[#2563EB] p-10 md:p-14 flex-col justify-center items-start text-white rounded-t-[2rem] md:rounded-tr-none md:rounded-l-[2rem] relative isolate overflow-hidden">
                    {/* Decorative blobs inside left panel */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

                    {/* Wordmark */}
                    <div className="mb-10 relative z-10">
                        <span className="text-2xl font-black tracking-tight">SALIRA</span>
                        <p className="text-[11px] font-medium text-blue-200 mt-0.5 tracking-widest uppercase">Sistem Absensi & Akademik</p>
                    </div>

                    <div className="relative z-10 mb-8">
                        <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight leading-tight">Selamat Datang<br/>di SALIRA</h1>
                        <p className="text-sm text-blue-100 opacity-80 max-w-[260px] leading-relaxed">
                            Platform manajemen sekolah modern dan terpadu.
                        </p>
                    </div>

                    {/* Feature cards */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 w-full mb-10">
                        {[{icon: '✓', title: 'Absensi Digital', sub: 'Guru & Siswa'}, {icon: '📊', title: 'Laporan Akademik', sub: 'Rekapitulasi'}, {icon: '📅', title: 'Manajemen Event', sub: 'Kegiatan'}].map(f => (
                            <div key={f.title} className="bg-white/10 border border-white/20 rounded-xl p-3">
                                <div className="text-lg mb-1">{f.icon}</div>
                                <p className="text-[11px] font-bold leading-tight">{f.title}</p>
                                <p className="text-[10px] text-blue-200 mt-0.5">{f.sub}</p>
                            </div>
                        ))}
                    </div>

                    <Link
                        href={route('register')}
                        className="relative z-10 border border-white/40 text-white hover:bg-white hover:text-blue-700 transition-colors rounded-xl px-10 py-2.5 font-bold text-xs uppercase tracking-wider backdrop-blur-sm"
                    >
                        Daftar Akun
                    </Link>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col justify-center bg-white dark:bg-slate-800 rounded-[2rem] md:rounded-l-none transition-colors">
                    {/* Compact wordmark for mobile view only */}
                    <div className="flex flex-col items-center md:hidden mb-6 text-center">
                        <h1 className="text-3xl font-black text-blue-700 dark:text-blue-400 tracking-tight">SALIRA</h1>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                            Sistem Absensi & Akademik
                        </p>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 transition-colors hidden md:block">Sign In</h2>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 transition-colors md:hidden text-center">Sign In</h2>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="flex flex-col gap-5">
                        <div>
                            <input
                                id="login"
                                type="text"
                                name="login"
                                value={data.login}
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-20 px-4 py-3 placeholder-slate-400 dark:placeholder-slate-500 text-base transition-all shadow-sm"
                                autoComplete="username"
                                placeholder="Email atau NIP"
                                onChange={(e) => setData('login', e.target.value)}
                                required
                            />
                            <InputError message={errors.login} className="mt-2" />
                        </div>

                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white focus:border-blue-600 focus:ring focus:ring-blue-600 focus:ring-opacity-20 px-4 py-3 placeholder-slate-400 dark:placeholder-slate-500 text-base transition-all shadow-sm"
                                autoComplete="current-password"
                                placeholder="Password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-2" />


                        <div className="flex items-center justify-between mt-1">
                            <label className="flex items-center cursor-pointer group">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    className="text-blue-600 focus:ring-blue-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded-md w-4 h-4 transition-colors"
                                    onChange={(e) =>
                                        setData(
                                            'remember',
                                            (e.target.checked || false) as false,
                                        )
                                    }
                                />
                                <span className="ms-3 text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                                    Remember me
                                </span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-1 underline-offset-[3px] transition-colors font-medium"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-12 py-3.5 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/30"
                            >
                                LOGIN SEBAGAI GURU / KARYAWAN
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="text-center mb-4 relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-white dark:bg-slate-800 px-3 text-slate-400">Atau</span>
                            </div>
                        </div>

                        <Link
                            href={route('portal.login')}
                            className="block text-center w-full py-3 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-xl transition-colors uppercase tracking-wider"
                        >
                            Masuk ke Portal Siswa & Wali Murid →
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                resetEvent();
                                setPreviewUrl(null);
                                setSearchUser('');
                                setSelectedUserName('');
                                setShowEventModal(true);
                            }}
                            className="mt-3 block text-center w-full py-3 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50 dark:border-blue-800 rounded-xl transition-colors uppercase tracking-wider"
                        >
                            Absen Event Rapat / Kegiatan 📅
                        </button>

                        {/* Mobile-only Registration Link */}
                        <div className="mt-4 text-center md:hidden">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Belum memiliki akun?{' '}
                                <Link
                                    href={route('register')}
                                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                >
                                    Daftar di sini
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Attendance Modal Overlay */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowUserDropdown(false)}>
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-700 animate-slide-up relative" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none"></div>

                        {attendanceSuccess ? (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce-in">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Absensi Berhasil!</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 px-4">
                                        {successMessage || 'Kehadiran Anda telah berhasil dicatat oleh sistem.'}
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEventModal(false)}
                                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/10 transition-colors"
                                    >
                                        Selesai
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Absen Event / Rapat</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Silakan isi data kehadiran Anda di bawah.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowEventModal(false)}
                                        className="text-slate-400 hover:text-slate-650 dark:hover:text-white p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                {modalError && (
                                    <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/30 flex items-start gap-2 animate-fade-in">
                                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <span>{modalError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleEventSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Pilih Event *</label>
                                        {activeEvents.length === 0 ? (
                                            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-900/30">
                                                Tidak ada event aktif yang sedang berlangsung saat ini.
                                            </div>
                                        ) : (
                                            <select
                                                value={eventData.event_id}
                                                onChange={e => setEventData('event_id', e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 shadow-sm text-sm p-3"
                                                required
                                            >
                                                <option value="">-- Pilih Event --</option>
                                                {activeEvents.map(ev => (
                                                    <option key={ev.id} value={ev.id}>
                                                        {ev.name} ({new Date(ev.date).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit'})})
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        <InputError message={eventErrors.event_id} className="mt-1" />
                                    </div>

                                    {/* Searchable User Dropdown & Manual Guest Input */}
                                    <div className="relative" ref={dropdownRef}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                {isManualGuest ? 'Nama Peserta (Manual / Tamu) *' : 'Pilih Nama Anda *'}
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsManualGuest(!isManualGuest);
                                                    setShowUserDropdown(false);
                                                    if (!isManualGuest) {
                                                        setEventData('user_id', '');
                                                        setGuestName(searchUser);
                                                    } else {
                                                        setEventData('guest_name', '');
                                                        setGuestName('');
                                                    }
                                                }}
                                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline transition-all"
                                            >
                                                {isManualGuest ? '← Pilih dari Terdaftar' : '+ Tamu / Belum Terdaftar?'}
                                            </button>
                                        </div>

                                        {isManualGuest ? (
                                            <div>
                                                <input
                                                    type="text"
                                                    value={guestName}
                                                    onChange={e => {
                                                        setGuestName(e.target.value);
                                                        setEventData('guest_name', e.target.value);
                                                        setEventData('user_id', '');
                                                        setSearchUser(e.target.value);
                                                    }}
                                                    className="w-full rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/20 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 shadow-sm text-sm p-3"
                                                    placeholder="Ketikkan nama lengkap Anda (Tamu / Peserta Luar)..."
                                                    required
                                                />
                                                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                                                    Mode Manual: Anda mendaftar sebagai peserta eksternal / tamu.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={searchUser}
                                                    onChange={e => {
                                                        setSearchUser(e.target.value);
                                                        setShowUserDropdown(true);
                                                        if (e.target.value !== selectedUserName) {
                                                            setEventData('user_id', '');
                                                        }
                                                    }}
                                                    onFocus={() => setShowUserDropdown(true)}
                                                    onClick={e => { e.stopPropagation(); setShowUserDropdown(true); }}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 shadow-sm text-sm p-3 pr-10"
                                                    placeholder="Ketik nama atau NIP Anda..."
                                                    required={!isManualGuest}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                </div>
                                            </div>
                                        )}
                                        <InputError message={eventErrors.user_id || eventErrors.guest_name} className="mt-1" />

                                        {!isManualGuest && showUserDropdown && (
                                            <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 divide-y divide-slate-100 dark:divide-slate-800">
                                                {filteredUsers.length === 0 ? (
                                                    <div className="p-3 text-center">
                                                        <p className="text-slate-400 text-xs italic mb-2">Nama tidak ditemukan di sistem SALIRA.</p>
                                                        {searchUser.trim() !== '' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectManualGuest(searchUser)}
                                                                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                                                            >
                                                                + Gunakan "{searchUser}" sebagai Tamu / Manual
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        {filteredUsers.map(u => (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleSelectUser(u);
                                                                }}
                                                                className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-750 dark:text-slate-200 transition-colors flex justify-between items-center"
                                                            >
                                                                <span>{u.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">NIP: {u.nip}</span>
                                                            </button>
                                                        ))}
                                                        {searchUser.trim() !== '' && (
                                                            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSelectManualGuest(searchUser)}
                                                                    className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline"
                                                                >
                                                                    + Gunakan "{searchUser}" sebagai Peserta Tamu / Manual
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Bukti Hadir (Foto) *</label>

                                        {isCompressing ? (
                                            <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl p-6 bg-emerald-50/40 dark:bg-emerald-950/5 flex flex-col items-center justify-center gap-3 h-[148px]">
                                                <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                                                </svg>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">Mengompres foto Anda...</span>
                                            </div>
                                        ) : previewUrl ? (
                                            <div className="border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl p-3 bg-emerald-50/40 dark:bg-emerald-950/10 flex flex-col items-center gap-2">
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview Bukti Hadir"
                                                    className="max-h-36 rounded-xl object-contain shadow-md border border-slate-200 dark:border-slate-700"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setPreviewUrl(null);
                                                        setEventData('proof', null);
                                                    }}
                                                    className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    Hapus &amp; Ganti Foto
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2.5">
                                                {/* Tombol Kamera */}
                                                <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-all group">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                                                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">Ambil Foto<br/><span className="text-[9px] font-normal text-slate-400">Gunakan Kamera</span></span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>

                                                {/* Tombol Pilih File / Galeri */}
                                                <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 transition-all group">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                                                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">Pilih Foto<br/><span className="text-[9px] font-normal text-slate-400">Dari Galeri / File</span></span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                        <InputError message={eventErrors.proof} className="mt-1" />
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700/80">
                                        <button
                                            type="button"
                                            onClick={() => setShowEventModal(false)}
                                            className="flex-shrink-0 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-900/40 transition-colors"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || activeEvents.length === 0 || !eventData.proof || isCompressing}
                                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold text-sm shadow-md shadow-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" /></svg>
                                                    Mengirim...
                                                </>
                                            ) : isCompressing ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" /></svg>
                                                    Mengompres...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                    Kirim Absen
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Event Success/Error Toast notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-[100] animate-bounce-in">
                    <div className={`px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 border-2 ${
                        toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-rose-600 text-white border-rose-400'
                    }`}>
                        <span className="font-bold text-sm">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-3 p-1 hover:bg-white/20 rounded-full transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

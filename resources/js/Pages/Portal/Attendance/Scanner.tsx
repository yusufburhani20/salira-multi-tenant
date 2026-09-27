import React, { useEffect, useState, useRef, useCallback } from 'react';
import PortalLayout from '@/Layouts/PortalLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import axios from 'axios';
import { 
    CameraIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    InformationCircleIcon,
    AcademicCapIcon,
    ClockIcon,
    UserIcon,
    ArrowLeftOnRectangleIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/outline';

interface ScanResult {
    student_name: string;
    class_name: string;
    subject: string;
    time: string;
    timezone: string;
}

export default function Scanner() {
    const { props } = usePage();
    const auth = props.auth as any;
    const isGuest = !auth?.user;

    const [lastResult, setLastResult] = useState<ScanResult | null>(null);
    const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [manualNis, setManualNis] = useState('');
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const processingRef = useRef(false); // To use inside event listener

    useEffect(() => {
        processingRef.current = isProcessing;
    }, [isProcessing]);

    const processManualNis = useCallback((nis: string) => {
        if (processingRef.current || !nis) return;
        
        setIsProcessing(true);
        setError(null);
        
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate(100);

        axios.post(route('portal.attendance.scan'), { nis: nis })
            .then(res => {
                const data = res.data.data;
                setLastResult(data);
                setRecentScans(prev => [data, ...prev].slice(0, 5));
                setManualNis(''); // clear input
                // Reset processing after 3 seconds to allow next scan
                setTimeout(() => {
                    setIsProcessing(false);
                    setLastResult(null);
                }, 3000);
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Gagal memproses NIS');
                setManualNis(''); // clear input
                setIsProcessing(false);
                setTimeout(() => setError(null), 3000);
            });
    }, []);

    // Global listener for physical barcode scanner
    useEffect(() => {
        let buffer = '';
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if we are typing in an input field (unless we want to let manual mode handle it, but we handle enter manually there)
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            const currentTime = Date.now();
            // Reset buffer if more than 50ms between keystrokes (human typing is slower, scanners are fast)
            if (currentTime - lastKeyTime > 50) {
                buffer = ''; 
            }
            lastKeyTime = currentTime;

            if (e.key === 'Enter' && buffer.length > 0) {
                processManualNis(buffer);
                buffer = '';
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [processManualNis]);

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
            }, 
            /* verbose= */ false
        );

        scannerRef.current.render(onScanSuccess, onScanFailure);

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear scanner", error);
                });
            }
        };
    }, []);

    const onScanSuccess = (decodedText: string) => {
        if (processingRef.current) return;
        
        setIsProcessing(true);
        setError(null);
        
        // Vibrate if supported
        if (navigator.vibrate) navigator.vibrate(100);

        axios.post(route('portal.attendance.scan'), { qr_token: decodedText })
            .then(res => {
                const data = res.data.data;
                setLastResult(data);
                setRecentScans(prev => [data, ...prev].slice(0, 5));
                // Reset processing after 3 seconds to allow next scan
                setTimeout(() => {
                    setIsProcessing(false);
                    setLastResult(null);
                }, 3000);
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Gagal memproses QR');
                setIsProcessing(false);
                setTimeout(() => setError(null), 3000);
            });
    };

    const onScanFailure = (error: string) => {
        // We generally ignore scan failures as they happen every frame
    };

    const ScannerContent = (
        <div className="max-w-5xl mx-auto py-4 px-4 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Scanner */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden relative flex flex-col">
                    {/* Header Info */}
                    <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <CameraIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold leading-tight">Terminal Presensi</h3>
                                <p className="text-xs text-blue-100">Silakan scan kartu Anda</p>
                            </div>
                        </div>
                        {isGuest ? (
                            <Link 
                                href={route('portal.login')} 
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                EXIT
                            </Link>
                        ) : (
                            <Link 
                                href={route('portal.dashboard')} 
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                KEMBALI
                            </Link>
                        )}
                    </div>

                    {/* Scanner Area */}
                    <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden min-h-[400px]">
                        <div id="reader" className="w-full h-full"></div>
                        
                        {/* Status Overlays */}
                        {isProcessing && !lastResult && !error && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-10 transition-all">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent shadow-lg"></div>
                                    <span className="text-white font-bold text-sm tracking-widest uppercase">Memproses...</span>
                                </div>
                            </div>
                        )}

                        {lastResult && (
                            <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-md flex items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
                                <div className="p-8 text-center text-white flex flex-col items-center max-w-sm">
                                    <CheckCircleIcon className="w-20 h-20 mb-4 animate-bounce" />
                                    <h4 className="text-2xl font-black mb-2">Presensi Berhasil!</h4>
                                    
                                    <div className="w-full bg-white/10 rounded-2xl p-4 text-left border border-white/20 space-y-3">
                                        <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                            <div className="p-1.5 bg-white/20 rounded-lg"><UserIcon className="w-4 h-4" /></div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-bold text-emerald-100">Nama Siswa</p>
                                                <p className="font-bold truncate">{lastResult.student_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 border-b border-white/10 pb-2">
                                            <div className="p-1.5 bg-white/20 rounded-lg"><AcademicCapIcon className="w-4 h-4" /></div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] uppercase font-bold text-emerald-100">Kelas</p>
                                                <p className="font-bold truncate">{lastResult.class_name}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4 text-emerald-200" />
                                                <span className="text-sm font-medium">
                                                    {lastResult.time} {lastResult.timezone?.split('/')[1]?.replace('_', ' ') ?? 'WIB'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold px-2 py-1 bg-white text-emerald-700 rounded-full uppercase">HADIR</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <p className="mt-6 text-xs text-emerald-100 italic">Siap untuk scan berikutnya...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 bg-rose-600/90 backdrop-blur-md flex items-center justify-center z-20 animate-in fade-in zoom-in duration-300">
                                <div className="p-8 text-center text-white flex flex-col items-center">
                                    <XCircleIcon className="w-20 h-20 mb-4 animate-pulse" />
                                    <h4 className="text-2xl font-black mb-2">Gagal!</h4>
                                    <p className="bg-white/20 px-4 py-2 rounded-xl text-sm font-medium border border-white/20">
                                        {error}
                                    </p>
                                    <p className="mt-8 text-xs text-rose-100">Silakan coba lagi atau hubungi petugas</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Instructions */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-start gap-4">
                            <InformationCircleIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                            <div className="space-y-2">
                                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">Petunjuk Penggunaan:</h5>
                                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                                    <li>Kamera: Pastikan pencahayaan cukup terang</li>
                                    <li>Mesin Scanner: Tembakkan langsung kapan saja, mesin otomatis terdeteksi</li>
                                    <li>Manual: Ketik NIS pada kolom di sebelah kanan jika kartu rusak</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Manual Input & History */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col min-h-[400px]">
                    {/* Manual Input Section */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
                            <ComputerDesktopIcon className="w-4 h-4 text-blue-500" />
                            Input Manual / Scanner Fisik
                        </h3>
                        <form onSubmit={(e) => { e.preventDefault(); processManualNis(manualNis); }} className="flex gap-2">
                            <input
                                type="text"
                                value={manualNis}
                                onChange={(e) => setManualNis(e.target.value)}
                                placeholder="Masukkan NIS..."
                                className="flex-1 w-full min-w-0 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold tracking-wider"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!manualNis || isProcessing}
                                className="shrink-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold transition-colors text-sm whitespace-nowrap"
                            >
                                Proses
                            </button>
                        </form>
                    </div>

                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-blue-500" />
                            Riwayat Presensi
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">5 presensi berhasil terakhir</p>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900/20">
                        {recentScans.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-50 py-10">
                                <ClockIcon className="w-12 h-12" />
                                <p className="text-sm font-medium">Belum ada data</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentScans.map((scan, idx) => (
                                    <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md">
                                                {scan.time}
                                            </span>
                                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-white truncate">{scan.student_name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{scan.class_name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style>{`
                #reader { border: none !important; }
                #reader img { display: none !important; }
                #reader__scan_region { background: #0f172a !important; }
                #reader__dashboard_section_csr button {
                    background-color: #2563eb !important;
                    color: white !important;
                    border: none !important;
                    padding: 8px 16px !important;
                    border-radius: 12px !important;
                    font-weight: 700 !important;
                    font-size: 12px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                }
                #reader__dashboard_section_csr button:hover {
                    background-color: #1d4ed8 !important;
                    transform: scale(1.05) !important;
                }
                #reader__dashboard_section_csr button:active {
                    transform: scale(0.95) !important;
                }
                #reader__status_span { display: none !important; }
            `}</style>
        </div>
    );

    if (isGuest) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <Head title="Terminal Presensi" />
                <div className="w-full flex justify-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5 shadow-lg">
                            <span className="text-white font-black text-3xl">S</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <p className="text-white font-black text-3xl tracking-tight leading-none">SALIRA</p>
                            <p className="text-slate-400 text-[11px] font-bold tracking-widest uppercase mt-1">Absensi Digital</p>
                        </div>
                    </div>
                </div>
                {ScannerContent}
            </div>
        );
    }

    return (
        <PortalLayout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Terminal Presensi Mandiri</h2>}
        >
            <Head title="Terminal Presensi" />
            {ScannerContent}
        </PortalLayout>
    );
}

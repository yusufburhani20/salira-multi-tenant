import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    ExclamationTriangleIcon,
    CheckCircleIcon,
    CameraIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function Report({ prefilledCode, unit }: any) {
    const { flash } = usePage().props as any;
    const [submitted, setSubmitted] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        pc_code: prefilledCode || '',
        reporter_name: '',
        description: '',
        photo: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Compress image automatically to reduce file size to < 200KB before uploading
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // Fallback to original file if canvas context is not supported
                setData('photo', file);
                setPreviewUrl(URL.createObjectURL(file));
                return;
            }

            // Set maximum dimension (e.g. max 1200px width/height)
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        setData('photo', compressedFile);
                        setPreviewUrl(URL.createObjectURL(compressedFile));
                    } else {
                        // Fallback to original file
                        setData('photo', file);
                        setPreviewUrl(URL.createObjectURL(file));
                    }
                },
                'image/jpeg',
                0.7 // 70% quality compression (keeps it small and sharp)
            );
        };
        img.onerror = () => {
            // Fallback to original file if loading fails
            setData('photo', file);
            setPreviewUrl(URL.createObjectURL(file));
        };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('public.computer-issues.report.store'), {
            onSuccess: () => {
                setSubmitted(true);
                reset();
                setPreviewUrl(null);
            },
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
            <Head title="Laporkan Masalah Komputer" />

            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
                
                {/* Header */}
                <div className="text-center space-y-2">
                    <img src="/images/logo-salira.png" alt="SALIRA Logo" className="h-10 mx-auto" />
                    <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                        Lapor Kerusakan PC
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sistem pelaporan masalah Lab Komputer Pesantren Idrisiyyah (PPI)
                    </p>
                </div>

                {submitted ? (
                    /* Success State */
                    <div className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                            <CheckCircleIcon className="w-10 h-10 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Laporan Terkirim!
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
                                Terima kasih atas laporannya. Tim Laboran/Teknisi akan segera menindaklanjuti perbaikan pada PC ini.
                            </p>
                            {flash?.ticket_code && (
                                <div className="mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">KODE TIKET PELACAKAN</p>
                                    <p className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono mt-1 select-all cursor-pointer hover:text-indigo-600 transition-colors" title="Klik untuk menyeleksi">
                                        {flash.ticket_code}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                                        Simpan kode di atas untuk memantau status perbaikan komputer Anda.
                                    </p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setSubmitted(false)}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                            Buat Laporan Baru
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {Object.keys(errors).length > 0 && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-4 text-xs text-red-600 dark:text-red-400 space-y-1">
                                <p className="font-bold">Gagal mengirim laporan. Sila periksa kembali input Anda:</p>
                                <ul className="list-disc list-inside">
                                    {Object.entries(errors).map(([key, val]) => (
                                        <li key={key}>{val}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* PC Information Panel if prefilled and valid */}
                        {unit ? (
                            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-4 flex gap-3 items-center">
                                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <ExclamationTriangleIcon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                        {unit.code}
                                    </p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">
                                        {unit.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                        {unit.lab?.name || 'Lab Komputer'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                    Kode PC *
                                </label>
                                <input
                                    value={data.pc_code}
                                    onChange={(e) => setData('pc_code', e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono"
                                    placeholder="mis: LAB1-PC05"
                                    required
                                />
                                {errors.pc_code && <p className="text-xs text-red-500 mt-1">{errors.pc_code}</p>}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                Nama Pelapor (Siswa/Guru) *
                            </label>
                            <input
                                value={data.reporter_name}
                                onChange={(e) => setData('reporter_name', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                placeholder="Nama lengkap Anda"
                                required
                            />
                            {errors.reporter_name && <p className="text-xs text-red-500 mt-1">{errors.reporter_name}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                Deskripsi Kerusakan *
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                rows={4}
                                placeholder="mis: Mouse rusak tidak bisa diklik kiri, atau PC tidak mau menyala saat ditekan tombol power..."
                                required
                            />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                                Ambil Foto Kerusakan
                            </label>
                            <div className="mt-1 flex items-center gap-4">
                                <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer">
                                    <CameraIcon className="w-4 h-4" />
                                    <span>Ambil Foto</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment" // Forces back camera on mobile
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                {previewUrl && (
                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>
                            {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    <span>Mengirim...</span>
                                </>
                            ) : (
                                <span>Kirim Laporan Kerusakan</span>
                            )}
                        </button>
                    </form>
                )}
            </div>
            
            {/* Footer school name */}
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-6 uppercase tracking-wider">
                Powered by SALIRA School Portal
            </p>
        </div>
    );
}

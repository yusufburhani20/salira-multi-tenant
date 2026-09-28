import PortalLayout from '@/Layouts/PortalLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function IdCard({ student, qrToken, settings, activeClass }: any) {
    const [orientation, setOrientation] = useState<'h' | 'v'>('h');

    return (
        <PortalLayout header="Kartu Pelajar Digital">
            <Head title="Kartu Pelajar" />

            <div className="max-w-4xl mx-auto space-y-8 pb-20">

                {/* SETTINGS CARD — hidden on print */}
                <div className="no-print bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 italic">Personalisasi Kartu</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pilih orientasi kartu yang ingin Anda cetak atau simpan.</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-1">
                        <button
                            onClick={() => setOrientation('h')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${orientation === 'h' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Horizontal
                        </button>
                        <button
                            onClick={() => setOrientation('v')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${orientation === 'v' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Vertikal
                        </button>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Cetak Kartu
                    </button>
                </div>

                {/* CARD PREVIEW AREA */}
                <div className="no-print flex justify-center p-12 bg-slate-100/50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none" />

                    {/* Preview card (screen only, scaled down) */}
                    {orientation === 'h' ? (
                        <div className="w-[500px] h-[300px] bg-emerald-800 rounded-[2rem] shadow-2xl overflow-hidden flex text-white scale-75 sm:scale-100 origin-center">
                            <div className="w-[30%] bg-white/10 border-r border-white/20 flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-xl mb-4 overflow-hidden">
                                    <QRCodeSVG value={qrToken} size={88} style={{ width: '100%', height: '100%' }} />
                                </div>
                                <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70">Secured Token</p>
                            </div>
                            <div className="flex-1 p-8 flex flex-col justify-between relative">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-black tracking-tight">{settings.school_name}</h2>
                                        <p className="text-[9px] opacity-70 font-bold uppercase tracking-widest">Digital Student Identification</p>
                                    </div>
                                    <img src={settings.school_logo || "/images/logo-salira.png"} className="h-14 w-auto drop-shadow-md" alt="Logo" />
                                </div>
                                <div>
                                    <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mb-1">Nama Lengkap</p>
                                    <h3 className="text-2xl font-black tracking-tight">{student.name}</h3>
                                </div>
                                <div className="flex gap-6 flex-wrap">
                                    <div>
                                        <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mb-0.5">NIS</p>
                                        <p className="text-lg font-black font-mono tracking-tighter">{student.nis}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mb-0.5">Kelas</p>
                                        <p className="text-sm font-black">{activeClass?.name ?? '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mb-0.5">T.A.</p>
                                        <p className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg tracking-wide">{activeClass?.academic_year ?? '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-[280px] h-[430px] bg-emerald-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col text-white scale-90 sm:scale-100 origin-center">
                            <div className="p-6 text-center border-b border-white/10">
                                <img src={settings.school_logo || "/images/logo-salira.png"} className="h-16 w-auto mx-auto mb-3 drop-shadow-md" alt="Logo" />
                                <h2 className="text-base font-black tracking-tight leading-tight">{settings.school_name}</h2>
                            </div>
                            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                                <div className="w-28 h-28 rounded-2xl bg-white p-2 shadow-2xl mb-5">
                                    <QRCodeSVG value={qrToken} size={256} style={{ width: '100%', height: '100%' }} />
                                </div>
                                <h3 className="text-lg font-black mb-1">{student.name}</h3>
                                <p className="text-sm font-mono tracking-[0.2em] text-indigo-400 mb-1 font-black uppercase">{student.nis}</p>
                                {activeClass && (
                                    <p className="text-xs font-bold text-white/80 mb-4 bg-white/10 px-3 py-1 rounded-full">
                                        {activeClass.name} · {activeClass.academic_year}
                                    </p>
                                )}
                                <div className="w-full h-px bg-white/20 mb-4" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] leading-relaxed">
                                    Kartu Pelajar Digital<br />SALIRA Academic Portal
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                                <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                    Verified Student
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info box — hidden on print */}
                <div className="no-print bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800 flex items-start gap-4">
                    <div className="bg-indigo-200 dark:bg-indigo-800 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-1 text-left">Tentang QR Code Mandiri</h4>
                        <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 text-left leading-relaxed">
                            QR Code ini berisi token keamanan digital yang terenkripsi. Gunakan kartu ini untuk melakukan absensi mandiri di portal yang disediakan sekolah atau saat meminjam buku di perpustakaan.
                        </p>
                    </div>
                </div>

                {/* ─── PRINT-ONLY CARDS ─────────────────────────────────────────────── */}
                {/* These are the actual print targets — hidden on screen, shown on print */}

                {orientation === 'h' && (
                    <div id="print-card-h" style={{
                        display: 'none',
                        width: '85mm', height: '54mm',
                        background: '#065f46',
                        fontFamily: 'Arial, sans-serif', color: 'white',
                        overflow: 'hidden',
                    }}>
                        {/* inner rendered purely via style props — no Tailwind classes that can clip */}
                        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                            {/* QR side */}
                            <div style={{ width: '32%', background: 'rgba(255,255,255,0.12)', borderRight: '1px solid rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px', textAlign: 'center', boxSizing: 'border-box' }}>
                                <div style={{ background: 'white', padding: '4px', borderRadius: '8px', marginBottom: '6px' }}>
                                    <QRCodeSVG value={qrToken} size={70} />
                                </div>
                                <p style={{ fontSize: '5px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, margin: 0 }}>Secured Token</p>
                            </div>
                            {/* Info side */}
                            <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 900, letterSpacing: '-0.02em' }}>{settings.school_name}</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '5.5px', opacity: 0.7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Digital Student Identification</p>
                                    </div>
                                    <img src={settings.school_logo || '/images/logo-salira.png'} style={{ height: '38px', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} alt="Logo" />
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 2px', fontSize: '5.5px', opacity: 0.6, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Nama Lengkap</p>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, letterSpacing: '-0.02em' }}>{student.name}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ margin: '0 0 2px', fontSize: '5.5px', opacity: 0.6, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>NIS</p>
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{student.nis}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 2px', fontSize: '5.5px', opacity: 0.6, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kelas</p>
                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 900 }}>{activeClass?.name ?? '-'}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 2px', fontSize: '5.5px', opacity: 0.6, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>T.A.</p>
                                        <p style={{ margin: 0, fontSize: '6px', fontWeight: 700, background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>{activeClass?.academic_year ?? '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {orientation === 'v' && (
                    <div id="print-card-v" style={{
                        display: 'none',
                        width: '54mm', height: '85mm',
                        background: '#064e3b',
                        fontFamily: 'Arial, sans-serif', color: 'white',
                        overflow: 'hidden',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', boxSizing: 'border-box' }}>
                            {/* Header */}
                            <div style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                                <img src={settings.school_logo || '/images/logo-salira.png'} style={{ height: '48px', width: 'auto', display: 'block', margin: '0 auto 8px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} alt="Logo" />
                                <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, lineHeight: 1.3 }}>{settings.school_name}</p>
                            </div>
                            {/* Body */}
                            <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
                                <div style={{ background: 'white', padding: '5px', borderRadius: '10px', marginBottom: '8px', flexShrink: 0 }}>
                                    <QRCodeSVG value={qrToken} size={70} />
                                </div>
                                <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 900 }}>{student.name}</p>
                                <p style={{ margin: '0 0 4px', fontSize: '8px', fontFamily: 'monospace', letterSpacing: '0.15em', color: '#818cf8', fontWeight: 900, textTransform: 'uppercase' }}>{student.nis}</p>
                                {activeClass && (
                                    <p style={{ margin: '0 0 6px', fontSize: '6px', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '999px', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em' }}>
                                        {activeClass.name} · {activeClass.academic_year}
                                    </p>
                                )}
                                <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.2)', marginBottom: '6px', flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: '5.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.12em', lineHeight: 1.8 }}>
                                    Kartu Pelajar Digital<br />SALIRA Academic Portal
                                </p>
                            </div>
                            {/* Footer */}
                            <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', flexShrink: 0 }}>
                                <span style={{ padding: '3px 10px', background: 'rgba(16,185,129,0.1)', color: '#34d399', borderRadius: '9999px', fontSize: '5.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid rgba(16,185,129,0.2)', display: 'inline-block' }}>
                                    Verified Student
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── GLOBAL PRINT STYLES ─────────────────────────────────────────────── */}
            <style>{`
                @media print {
                    @page {
                        margin: 0;
                        ${orientation === 'h' ? 'size: 85mm 54mm landscape;' : 'size: 54mm 85mm portrait;'}
                    }

                    /* Hide absolutely everything */
                    body * { visibility: hidden !important; }

                    /* Show only the correct print card */
                    #print-card-h, #print-card-v,
                    #print-card-h *, #print-card-v * {
                        visibility: visible !important;
                    }

                    /* Position the card at top-left, no transform */
                    #print-card-h, #print-card-v {
                        display: block !important;
                        position: fixed !important;
                        top: 0 !important; left: 0 !important;
                        margin: 0 !important;
                        transform: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #print-card-h { width: 85mm !important; height: 54mm !important; }
                    #print-card-v { width: 54mm !important; height: 85mm !important; }
                }

                .no-print { }
            `}</style>
        </PortalLayout>
    );
}

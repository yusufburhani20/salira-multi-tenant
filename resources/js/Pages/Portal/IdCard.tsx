import PortalLayout from '@/Layouts/PortalLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function IdCard({ student, qrToken, settings, activeClass }: any) {
    const [orientation, setOrientation] = useState<'h' | 'v'>('h');

    return (
        <PortalLayout 
            header={
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Portal Siswa</span>
                    <span className="text-slate-400 dark:text-slate-500">/</span>
                    <span className="text-slate-900 dark:text-white font-semibold">Kartu Pelajar</span>
                </div>
            }
        >
            <Head title="Kartu Pelajar" />

            <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>

                {/* SETTINGS CARD */}
                <div className="no-print bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Personalisasi Kartu</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pilih orientasi cetak untuk identitas Anda.</p>
                    </div>
                    <div className="flex w-full md:w-auto bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
                        <button
                            onClick={() => setOrientation('h')}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${orientation === 'h' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Horizontal
                        </button>
                        <button
                            onClick={() => setOrientation('v')}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${orientation === 'v' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Vertikal
                        </button>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">print</span>
                        Cetak Kartu
                    </button>
                </div>

                {/* CARD PREVIEW AREA */}
                <div className="no-print flex justify-center py-12 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    {orientation === 'h' ? (
                        <div className="flex justify-center overflow-x-auto w-full pb-4 scrollbar-hide">
                            <div className="card-container-h shadow-2xl shrink-0" style={{ transform: 'scale(1)', transformOrigin: 'top center' }}>
                                <div className="card-h-inner bg-emerald-800 text-white">
                                    <div className="card-h-qr-section">
                                        <div className="card-qr-box">
                                            <QRCodeSVG value={qrToken} size={70} style={{ width: '100%', height: '100%' }} />
                                        </div>
                                        <p className="card-qr-text">Secured Token</p>
                                    </div>
                                    <div className="card-h-info-section">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="card-h-school">{settings.school_name}</h3>
                                                <p className="card-h-subtitle">Digital Student Identification</p>
                                            </div>
                                            {settings.school_logo && <img src={settings.school_logo} className="card-h-logo" alt="Logo" />}
                                        </div>
                                        
                                        <div className="flex justify-between items-end mt-auto gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div>
                                                    <p className="card-h-label">Nama Lengkap</p>
                                                    <h4 className="card-h-name">{student.name}</h4>
                                                </div>
                                                <div className="flex gap-4 mt-2">
                                                    <div>
                                                        <p className="card-h-label">NIS</p>
                                                        <p className="card-h-nis">{student.nis}</p>
                                                    </div>
                                                    <div>
                                                        <p className="card-h-label">Status</p>
                                                        <span className="card-h-status">Active</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {student.photo_url && (
                                                <img 
                                                    src={student.photo_url} 
                                                    className="w-[42px] h-[42px] rounded-lg object-cover border border-white/20 shadow-md mr-1 flex-shrink-0" 
                                                    alt="Foto" 
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center overflow-x-auto w-full pb-4 scrollbar-hide">
                            <div className="card-container-v shadow-2xl shrink-0" style={{ transform: 'scale(1)', transformOrigin: 'top center' }}>
                                <div className="card-v-inner bg-emerald-900 text-white">
                                    <div className="card-v-header">
                                        {settings.school_logo && <img src={settings.school_logo} className="card-v-logo" alt="Logo" />}
                                        <h3 className="card-v-school">{settings.school_name}</h3>
                                    </div>
                                    <div className="card-v-body">
                                        {student.photo_url ? (
                                            <img 
                                                src={student.photo_url} 
                                                className="w-[50px] h-[50px] rounded-full object-cover border-2 border-white/20 shadow-md mb-2 flex-shrink-0" 
                                                alt="Foto" 
                                            />
                                        ) : (
                                            <div className="w-[50px] h-[50px] rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center text-white text-xs font-bold mb-2 flex-shrink-0">
                                                {student.name.charAt(0)}
                                            </div>
                                        )}
                                        <h4 className="card-v-name">{student.name}</h4>
                                        <p className="card-v-nis">{student.nis}</p>
                                        <div className="card-qr-box my-1.5">
                                            <QRCodeSVG value={qrToken} size={42} style={{ width: '100%', height: '100%' }} />
                                        </div>
                                        <div className="card-v-divider" />
                                        <p className="card-v-footer-text">Valid ID Card<br />SALIRA Academic Portal</p>
                                    </div>
                                    <div className="card-v-footer">
                                        <span className="card-v-status">Verified Student</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info box */}
                <div className="no-print bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                    <div className="text-blue-600 dark:text-blue-400 mt-0.5">
                        <span className="material-symbols-outlined text-[20px]">info</span>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Tentang QR Code Mandiri</h4>
                        <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                            QR Code ini berisi token keamanan digital yang terenkripsi. Gunakan kartu ini untuk melakukan absensi mandiri di portal yang disediakan sekolah atau saat meminjam buku di perpustakaan.
                        </p>
                    </div>
                </div>

                {/* ─── PRINT-ONLY CARDS ─────────────────────────────────────────────── */}
                {/* These are the actual print targets — hidden on screen, shown on print */}

                {orientation === 'h' && (
                    <div id="print-card-h" className="card-container-h" style={{ display: 'none' }}>
                        <div className="card-h-inner bg-emerald-800 text-white">
                            <div className="card-h-qr-section">
                                <div className="card-qr-box">
                                    <QRCodeSVG value={qrToken} size={70} style={{ width: '100%', height: '100%' }} />
                                </div>
                                <p className="card-qr-text">Secured Token</p>
                            </div>
                            <div className="card-h-info-section">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="card-h-school">{settings.school_name}</h3>
                                        <p className="card-h-subtitle">Digital Student Identification</p>
                                    </div>
                                    {settings.school_logo && <img src={settings.school_logo} className="card-h-logo" alt="Logo" />}
                                </div>
                                
                                <div className="flex justify-between items-end mt-auto gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div>
                                            <p className="card-h-label">Nama Lengkap</p>
                                            <h4 className="card-h-name">{student.name}</h4>
                                        </div>
                                        <div className="flex gap-4 mt-2">
                                            <div>
                                                <p className="card-h-label">NIS</p>
                                                <p className="card-h-nis">{student.nis}</p>
                                            </div>
                                            <div>
                                                <p className="card-h-label">Status</p>
                                                <span className="card-h-status">Active</span>
                                            </div>
                                        </div>
                                    </div>
                                    {student.photo_url && (
                                        <img 
                                            src={student.photo_url} 
                                            className="w-[42px] h-[42px] rounded-lg object-cover border border-white/20 shadow-md mr-1 flex-shrink-0" 
                                            alt="Foto" 
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {orientation === 'v' && (
                    <div id="print-card-v" className="card-container-v" style={{ display: 'none' }}>
                        <div className="card-v-inner bg-emerald-900 text-white">
                            <div className="card-v-header">
                                {settings.school_logo && <img src={settings.school_logo} className="card-v-logo" alt="Logo" />}
                                <h3 className="card-v-school">{settings.school_name}</h3>
                            </div>
                            <div className="card-v-body">
                                {student.photo_url ? (
                                    <img 
                                        src={student.photo_url} 
                                        className="w-[50px] h-[50px] rounded-full object-cover border-2 border-white/20 shadow-md mb-2 flex-shrink-0" 
                                        alt="Foto" 
                                    />
                                ) : (
                                    <div className="w-[50px] h-[50px] rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center text-white text-xs font-bold mb-2 flex-shrink-0">
                                        {student.name.charAt(0)}
                                    </div>
                                )}
                                <h4 className="card-v-name">{student.name}</h4>
                                <p className="card-v-nis">{student.nis}</p>
                                <div className="card-qr-box my-1.5">
                                    <QRCodeSVG value={qrToken} size={42} style={{ width: '100%', height: '100%' }} />
                                </div>
                                <div className="card-v-divider" />
                                <p className="card-v-footer-text">Valid ID Card<br />SALIRA Academic Portal</p>
                            </div>
                            <div className="card-v-footer">
                                <span className="card-v-status">Verified Student</span>
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
                    #print-card-h { width: 85mm !important; height: 54mm !important; border: none; }
                    #print-card-v { width: 54mm !important; height: 85mm !important; border: none; }
                }

                .no-print { }

                /* SHARED ADMIN CLASSES */
                /* HORIZONTAL CARD (CR80: 85.6mm x 53.98mm) */
                .card-container-h {
                    width: 86mm;
                    height: 54mm;
                    border: 1px dashed #ccc; /* Cut guide */
                    padding: 0;
                    box-sizing: border-box;
                    background: white;
                }
                .card-h-inner {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                .card-h-qr-section {
                    width: 32%;
                    background: rgba(255,255,255,0.12);
                    border-right: 1px solid rgba(255,255,255,0.2);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    text-align: center;
                }
                .card-qr-box {
                    background: white;
                    padding: 4px;
                    border-radius: 8px;
                    margin-bottom: 6px;
                }
                .card-qr-text {
                    font-size: 6px;
                    font-weight: 900;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    opacity: 0.7;
                    margin: 0;
                }
                .card-h-info-section {
                    flex: 1;
                    padding: 12px 14px;
                    display: flex;
                    flex-direction: column;
                }
                .card-h-school {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 900;
                    letter-spacing: -0.02em;
                }
                .card-h-subtitle {
                    margin: 2px 0 0;
                    font-size: 6px;
                    opacity: 0.7;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .card-h-logo {
                    height: 38px;
                    width: auto;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                }
                .card-h-label {
                    margin: 0 0 2px;
                    font-size: 6px;
                    opacity: 0.6;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                }
                .card-h-name {
                    margin: 0;
                    font-size: 14px; /* Reduced to fit long names */
                    font-weight: 900;
                    letter-spacing: -0.02em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .card-h-nis {
                    margin: 0;
                    font-size: 11px;
                    font-weight: 900;
                    font-family: monospace;
                    letter-spacing: -0.02em;
                }
                .card-h-status {
                    font-size: 7px;
                    font-weight: 700;
                    background: rgba(255,255,255,0.2);
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                /* VERTICAL CARD (CR80: 53.98mm x 85.6mm) */
                .card-container-v {
                    width: 54mm;
                    height: 86mm;
                    border: 1px dashed #ccc;
                    box-sizing: border-box;
                    background: white;
                }
                .card-v-inner {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    box-sizing: border-box;
                }
                .card-v-header {
                    padding: 10px;
                    text-align: center;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .card-v-logo {
                    height: 48px;
                    width: auto;
                    display: block;
                    margin: 0 auto 8px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
                }
                .card-v-school {
                    margin: 0;
                    font-size: 11px;
                    font-weight: 900;
                    line-height: 1.2;
                }
                .card-v-body {
                    flex: 1;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                }
                .card-v-name {
                    margin: 0 0 3px;
                    font-size: 12px;
                    font-weight: 900;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }
                .card-v-nis {
                    margin: 0 0 8px;
                    font-size: 9px;
                    font-family: monospace;
                    letter-spacing: 0.1m;
                    color: #818cf8;
                    font-weight: 900;
                }
                .card-v-divider {
                    width: 80%;
                    height: 1px;
                    background: rgba(255,255,255,0.2);
                    margin-bottom: 6px;
                }
                .card-v-footer-text {
                    margin: 0;
                    font-size: 6px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    line-height: 1.6;
                }
                .card-v-footer {
                    padding: 8px;
                    background: rgba(255,255,255,0.05);
                    border-top: 1px solid rgba(255,255,255,0.05);
                    text-align: center;
                }
                .card-v-status {
                    padding: 3px 10px;
                    background: rgba(16,185,129,0.1);
                    color: #34d399;
                    border-radius: 9999px;
                    font-size: 6px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
                    border: 1px solid rgba(16,185,129,0.2);
                    display: inline-block;
                }
            `}</style>
        </PortalLayout>
    );
}

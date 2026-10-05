import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import { MapPinIcon, CameraIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function AttendanceScanner({ sessions = [], activeSession, todayLogs = [], geofences = [] }: { sessions?: any[], activeSession?: any, todayLogs?: any[], geofences?: any[] }) {
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    
    // Geofence validation state
    const [nearestGeofence, setNearestGeofence] = useState<{ name: string, distance: number, radius: number, valid: boolean } | null>(null);
    
    // Leaflet map states
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const mapRef = useRef<any>(null);

    // Haversine Distance helper
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371000; // meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };
    
    // Webcam states
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    // Unlogged sessions
    const loggedSessionIds = todayLogs.map(log => log.attendance_session_id);
    const availableSessions = sessions.filter(s => !loggedSessionIds.includes(s.id));
    
    // Default selected session to active one, or the first available
    const defaultSessionId = activeSession && !loggedSessionIds.includes(activeSession.id) 
        ? activeSession.id 
        : (availableSessions.length > 0 ? availableSessions[0].id : '');

    const { data, setData, post, processing, errors } = useForm({
        latitude: '',
        longitude: '',
        photo: null as File | null,
        attendance_session_id: defaultSessionId,
        status: 'hadir',
    });

    const [selectedStatus, setSelectedStatus] = useState('hadir');
    
    // Dynamic status options based on selected session
    const selectedSession = availableSessions.find(s => s.id == data.attendance_session_id);
    const isGtk = selectedSession?.type === 'gtk';
    
    const statusOptions = isGtk ? [
        { value: 'hadir', label: 'Hadir' },
        { value: 'tawasul', label: 'Hadir & Tawasul Bersama' },
    ] : [
        { value: 'hadir', label: 'Hadir' },
    ];
    
    // Ensure the selected status is valid for the current options
    useEffect(() => {
        if (!statusOptions.find(opt => opt.value === data.status)) {
            setData('status', 'hadir');
        }
    }, [data.attendance_session_id, isGtk]);

    // Formatted time string
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    // Start Webcam
    const startCamera = async () => {
        setCameraError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });
            streamRef.current = mediaStream;
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            setCameraError("Kamera tidak dapat diakses: " + err.message);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setStream(null);
        }
    };

    useEffect(() => {
        if ((window as any).L) {
            setLeafletLoaded(true);
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => setLeafletLoaded(true);
        document.body.appendChild(script);
    }, []);

    const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);

    const applyPosition = useCallback((position: GeolocationPosition) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        setLocation({ lat, lng });
        setAccuracy(acc);

        if (geofences.length > 0) {
            let closest: number | null = null;
            let minInfo: { name: string; distance: number; radius: number; valid: boolean } | null = null;

            for (const gf of geofences) {
                const d = calculateDistance(lat, lng, parseFloat(gf.latitude), parseFloat(gf.longitude));
                if (closest === null || d < closest) {
                    closest = d;
                    minInfo = { name: gf.name, distance: d, radius: gf.radius, valid: d <= gf.radius };
                }
            }
            setNearestGeofence(minInfo);
        } else {
            setNearestGeofence({ name: 'Tanpa Pembatasan', distance: 0, radius: 999999, valid: true });
        }

        setData(d => ({
            ...d,
            latitude: String(lat),
            longitude: String(lng),
        }));
    }, [geofences]);

    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('Browser ini tidak mendukung Geolocation.');
            return;
        }

        setIsRefreshingLocation(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                applyPosition(position);
                setIsRefreshingLocation(false);
            },
            (error) => {
                let errStr = '';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errStr = 'Izin lokasi ditolak.'; break;
                    case error.POSITION_UNAVAILABLE:
                        errStr = 'Sinyal GPS tidak tersedia.'; break;
                    case error.TIMEOUT:
                        errStr = 'GPS timeout.'; break;
                    default:
                        errStr = 'Gagal mendapatkan lokasi: ' + error.message;
                }
                setLocationError(errStr);
                setIsRefreshingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    }, [geofences, applyPosition]);

    useEffect(() => {
        getCurrentLocation();

        if (availableSessions.length > 0) {
            startCamera();
        }

        return () => {
            stopCamera();
        };
    }, [getCurrentLocation, availableSessions.length]);

    useEffect(() => {
        if (!location || !leafletLoaded) return;
        const L = (window as any).L;
        if (!L) return;

        const containerId = 'attendance-map';
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) return;

        try {
            if (!mapRef.current) {
                mapRef.current = L.map(containerId, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([location.lat, location.lng], 16);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            } else {
                mapRef.current.setView([location.lat, location.lng], 16);
            }

            mapRef.current.eachLayer((layer: any) => {
                if (layer instanceof L.Marker || layer instanceof L.Circle) {
                    mapRef.current.removeLayer(layer);
                }
            });

            geofences.forEach(gf => {
                const lat = parseFloat(gf.latitude);
                const lng = parseFloat(gf.longitude);
                const isInside = nearestGeofence?.valid && nearestGeofence.name === gf.name;

                L.circle([lat, lng], {
                    color: isInside ? '#10b981' : '#4f46e5',
                    fillColor: isInside ? '#a7f3d0' : '#c7d2fe',
                    fillOpacity: 0.25,
                    radius: parseInt(gf.radius)
                }).addTo(mapRef.current);
            });

            const userIcon = L.divIcon({
                className: 'custom-user-icon',
                html: `<div class="w-4 h-4 bg-salira-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center"><div class="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            L.marker([location.lat, location.lng], { icon: userIcon })
                .addTo(mapRef.current);

        } catch (e) {
            console.error("Map rendering error: ", e);
        }

    }, [location, leafletLoaded, nearestGeofence, geofences]);

    const capturePhoto = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setPhotoPreview(dataUrl);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                        setData('photo', file);
                    }
                }, 'image/jpeg', 0.8);
                
                stopCamera();
            }
        }
    }, [stream]);

    const retakePhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        setPhotoPreview(null);
        setData('photo', null);
        startCamera();
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('attendances.log'), {
            preserveScroll: true,
            onSuccess: () => {
                setPhotoPreview(null);
                setData('photo', null);
                startCamera();
            }
        });
    };

    // Helper for history boxes
    const getLogForType = (type: string) => {
        return todayLogs.find(log => log.session.type === type);
    };

    const getStatusColor = (status: string) => {
        if (['hadir', 'tawasul'].includes(status)) return 'bg-salira-100 text-salira-700 dark:bg-salira-900/50 dark:text-salira-400 border-salira-200 dark:border-salira-800';
        if (['izin', 'sakit'].includes(status)) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-amber-200 dark:border-amber-800';
        if (status === 'dinas') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        if (status === 'alpha') return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-red-200 dark:border-red-800';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    };

    const displayBoxes = [
        { label: 'GTK', type: 'gtk' },
        { label: 'Shalat', type: 'shalat' },
        { label: 'Pulang', type: 'pulang' },
        { label: 'Kajian', type: 'kajian' },
    ];

    return (
        <div className="flex flex-col space-y-6">
            {/* Riwayat Hari Ini */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">Riwayat Presensi Hari Ini</h3>
                <div className="grid grid-cols-4 gap-2">
                    {displayBoxes.map(box => {
                        const log = getLogForType(box.type);
                        return (
                            <div key={box.type} className={`flex flex-col items-center justify-center p-2 rounded-xl border ${log ? getStatusColor(log.status) : 'bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 text-slate-400'}`}>
                                <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-80">{box.label}</span>
                                {log ? (
                                    <>
                                        <span className="text-xs font-bold">{log.time.substring(0, 5)}</span>
                                        <span className="text-[9px] font-semibold truncate w-full text-center mt-0.5 capitalize">{log.status}</span>
                                    </>
                                ) : (
                                    <span className="text-xs font-medium">-</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

                            {availableSessions.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-salira-100 dark:border-salira-900/30 p-8 text-center flex flex-col justify-center items-center space-y-4">
                                    <CheckCircleIcon className="w-16 h-16 text-salira-500 animate-bounce" />
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Presensi Selesai</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Anda telah menyelesaikan semua sesi presensi wajib untuk hari ini.</p>
                                    </div>
                                </div>
                            ) : !activeSession ? (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/30 p-8 text-center flex flex-col justify-center items-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-amber-500 text-3xl">schedule</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum Waktunya Presensi</h3>
                                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                                            Saat ini belum memasuki waktu presensi untuk sesi manapun.<br/>
                                            Silakan periksa kembali jadwal kegiatan Anda.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 flex flex-col shadow-md">
                    
                    {/* Active Session Info */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-salira-600 dark:text-salira-400 uppercase tracking-wide">Sesi Aktif</span>
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {activeSession ? `${activeSession.name} (${activeSession.start_time.substring(0,5)}-${activeSession.end_time.substring(0,5)})` : 'Tidak ada sesi khusus saat ini'}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Waktu Saat Ini</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{timeStr}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Form Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Pilih Kegiatan</label>
                                <select 
                                    value={data.attendance_session_id} 
                                    onChange={e => setData('attendance_session_id', e.target.value)}
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold shadow-sm focus:border-salira-500 focus:ring-salira-500"
                                    required
                                >
                                    <option value="" disabled>-- Pilih Sesi --</option>
                                    {availableSessions.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Status Kehadiran</label>
                                <select 
                                    value={data.status} 
                                    onChange={e => setData('status', e.target.value)}
                                    className="rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold shadow-sm focus:border-salira-500 focus:ring-salira-500"
                                    required
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* GPS Map (Mini) */}
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-24">
                            <div id="attendance-map" className="w-full h-full absolute inset-0 z-0"></div>
                            {!leafletLoaded && (
                                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-[10px]">Memuat peta...</div>
                            )}
                            
                            {/* Overlay GPS Status inside Map */}
                            <div className="absolute bottom-2 left-2 right-2 z-10 flex justify-between items-center pointer-events-none">
                                <div className={`px-2 py-1 rounded-full text-[9px] font-bold shadow-md flex items-center gap-1 backdrop-blur-md ${nearestGeofence?.valid ? 'bg-salira-500/90 text-white' : (locationError ? 'bg-red-500/90 text-white' : 'bg-white/90 text-slate-800')}`}>
                                    <MapPinIcon className="w-3 h-3" />
                                    {nearestGeofence?.valid ? 'Di Dalam Area' : (locationError ? 'GPS Gagal' : 'Mencari Lokasi...')}
                                </div>
                                
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.preventDefault(); getCurrentLocation(); }} 
                                    disabled={isRefreshingLocation}
                                    className="pointer-events-auto w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
                                >
                                    <ArrowPathIcon className={`w-3.5 h-3.5 text-salira-600 ${isRefreshingLocation ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>
                        {locationError && <p className="text-[10px] text-red-500 font-semibold">{locationError}</p>}
                        {!nearestGeofence?.valid && !locationError && location && (
                            <p className="text-[10px] text-red-500 font-semibold">Peringatan: Anda berada di luar jangkauan lokasi (Geofence).</p>
                        )}

                        {/* Camera Viewfinder */}
                        <div className="w-full aspect-[4/3] rounded-xl relative overflow-hidden bg-black shadow-inner border border-slate-200 dark:border-slate-700 group">
                            {cameraError && !photoPreview ? (
                                <div className="text-red-500 text-center p-4 h-full flex flex-col justify-center items-center">
                                    <CameraIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-xs font-medium">{cameraError}</p>
                                    <button onClick={(e) => { e.preventDefault(); startCamera(); }} className="mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-[10px] transition-colors border border-white/20">Coba Ulang Kamera</button>
                                </div>
                            ) : (
                                <>
                                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover absolute inset-0 ${photoPreview ? 'hidden' : 'block'}`}></video>
                                    <canvas ref={canvasRef} className="hidden"></canvas>
                                    {photoPreview && <img src={photoPreview} alt="Selfie Preview" className="w-full h-full object-cover absolute inset-0" />}

                                    <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
                                        {!photoPreview ? (
                                            <button 
                                                type="button" 
                                                onClick={capturePhoto} 
                                                disabled={!!cameraError}
                                                className="bg-white/30 hover:bg-white/50 backdrop-blur-md border border-white/50 p-2.5 rounded-full shadow-lg transition-all focus:outline-none disabled:opacity-0"
                                            >
                                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                                    <CameraIcon className="w-5 h-5 text-salira-600" />
                                                </div>
                                            </button>
                                        ) : (
                                            <button 
                                                type="button" 
                                                onClick={retakePhoto}
                                                className="bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-600 px-4 py-2 rounded-full text-white text-xs font-semibold shadow-lg transition-all flex items-center space-x-2"
                                            >
                                                <ArrowPathIcon className="w-3.5 h-3.5" />
                                                <span>Ulangi Foto</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {errors.photo && <p className="text-red-500 text-[10px] text-center font-semibold">Peringatan: {errors.photo}</p>}
                    </div>

                    <button 
                        type="submit" 
                        disabled={processing || !location || !photoPreview || !nearestGeofence?.valid || !data.attendance_session_id}
                        className="mt-5 w-full py-3.5 px-4 bg-salira-600 hover:bg-salira-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-salira-500/20 transition-all flex justify-center items-center space-x-2 text-sm active:scale-[0.98]"
                    >
                        {processing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>Menyimpan Presensi...</span>
                            </>
                        ) : (
                            <span>Simpan Presensi Kehadiran</span>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import { MapPinIcon, CameraIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function AttendanceScanner({ existingRecord, geofences = [] }: { existingRecord?: any, geofences?: any[] }) {
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
    const streamRef = useRef<MediaStream | null>(null); // Use ref so cleanup always gets fresh value
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    
    const { data, setData, post, processing, errors } = useForm({
        latitude: '',
        longitude: '',
        photo: null as File | null,
        notes: '',
    });

    // Start Webcam
    const startCamera = async () => {
        setCameraError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' },
                audio: false 
            });
            streamRef.current = mediaStream; // store in ref for reliable cleanup
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            setCameraError("Kamera tidak dapat diakses: " + err.message);
        }
    };

    // Stop Webcam
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setStream(null);
        }
    };

    // Load Leaflet dynamically
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

        return () => {
            // Keep map scripts in DOM to avoid reloading next time
        };
    }, []);

    const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);

    // Apply geofence validation logic from a position
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

    // Format error message by error code
    const formatLocationError = (error: GeolocationPositionError): string => {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Izin lokasi ditolak. Buka Pengaturan > Aplikasi > Browser > Izin > Lokasi, lalu aktifkan.';
            case error.POSITION_UNAVAILABLE:
                return 'Sinyal GPS tidak tersedia. Coba ke luar ruangan atau aktifkan Wi-Fi untuk membantu GPS.';
            case error.TIMEOUT:
                return 'GPS timeout. Perangkat Anda butuh lebih lama mendapatkan sinyal. Coba lagi atau pindah ke area terbuka.';
            default:
                return 'Gagal mendapatkan lokasi: ' + error.message;
        }
    };

    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationError('Browser ini tidak mendukung Geolocation.');
            return;
        }

        setIsRefreshingLocation(true);
        setLocationError(null);

        // Always request high accuracy (GPS) for attendance tracking
        navigator.geolocation.getCurrentPosition(
            (position) => {
                applyPosition(position);
                setIsRefreshingLocation(false);
            },
            (error) => {
                setLocationError(formatLocationError(error));
                setIsRefreshingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
    }, [geofences, applyPosition]);

    // Initial Geolocation
    useEffect(() => {
        getCurrentLocation();

        const isCheckedOut = existingRecord && existingRecord.check_out;
        if (!isCheckedOut) {
            startCamera();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [getCurrentLocation]);

    // Render/Update Leaflet Map
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
                    zoomControl: true,
                    attributionControl: false
                }).setView([location.lat, location.lng], 16);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
            } else {
                mapRef.current.setView([location.lat, location.lng], 16);
            }

            // Clear existing layers
            mapRef.current.eachLayer((layer: any) => {
                if (layer instanceof L.Marker || layer instanceof L.Circle) {
                    mapRef.current.removeLayer(layer);
                }
            });

            // Draw Geofences
            geofences.forEach(gf => {
                const lat = parseFloat(gf.latitude);
                const lng = parseFloat(gf.longitude);
                const isInside = nearestGeofence?.valid && nearestGeofence.name === gf.name;

                L.circle([lat, lng], {
                    color: isInside ? '#10b981' : '#4f46e5',
                    fillColor: isInside ? '#a7f3d0' : '#c7d2fe',
                    fillOpacity: 0.25,
                    radius: parseInt(gf.radius)
                }).addTo(mapRef.current).bindPopup(`<b>${gf.name}</b><br>Radius: ${gf.radius}m`);
            });

            // Draw User Marker
            const userIcon = L.divIcon({
                className: 'custom-user-icon',
                html: `<div class="w-5 h-5 bg-salira-600 rounded-full border-2 border-white shadow-xl flex items-center justify-center"><div class="w-2 h-2 bg-white rounded-full animate-ping"></div></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            L.marker([location.lat, location.lng], { icon: userIcon })
                .addTo(mapRef.current)
                .bindPopup('Lokasi Anda Sekarang')
                .openPopup();

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

    const submit = (type: 'checkIn' | 'checkOut') => (e: React.FormEvent) => {
        e.preventDefault();
        const routeName = type === 'checkIn' ? 'attendances.check-in' : 'attendances.check-out';
        post(route(routeName), {
            preserveScroll: true,
            onSuccess: () => {
                if (type === 'checkIn') {
                    setPhotoPreview(null);
                    setData('photo', null);
                    setData('notes', '');
                    startCamera();
                }
            }
        });
    };

    const isCheckedIn = existingRecord && existingRecord.check_in;
    const isCheckedOut = existingRecord && existingRecord.check_out;

    if (isCheckedOut) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 text-center h-full flex flex-col justify-center items-center space-y-4 shadow-md transition-shadow">
                <CheckCircleIcon className="w-16 h-16 text-emerald-500 animate-bounce" />
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Presensi Selesai</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Anda telah menyelesaikan Check-In dan Check-Out hari ini.</p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={submit(isCheckedIn ? 'checkOut' : 'checkIn')} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col h-full shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b pb-4 dark:border-slate-700 flex justify-between items-center">
                <span>{isCheckedIn ? 'Check-Out (Pulang)' : 'Check-In (Hadir)'} - Jendela Pemindai</span>
                {isCheckedIn && <span className="text-xs bg-salira-100 text-salira-800 dark:bg-salira-900/50 dark:text-salira-300 px-2 py-1 rounded-full font-bold">Telah Hadir: {existingRecord.check_in}</span>}
            </h3>
            
            <div className="flex-1 flex flex-col space-y-4">
                {/* Geofence Status Badge */}
                {location && nearestGeofence && (
                    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all ${nearestGeofence.valid ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 font-bold' : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/40 dark:border-rose-800 dark:text-rose-400'}`}>
                        <div className="flex items-center">
                            <MapPinIcon className="w-5 h-5 mr-2" />
                            <span className="text-sm">{nearestGeofence.name}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs uppercase opacity-80">{nearestGeofence.valid ? 'Area Terdeteksi' : 'Di Luar Area'}</div>
                            <div className="text-[10px] sm:text-xs">Jarak: {Math.round(nearestGeofence.distance)}m (Maks: {nearestGeofence.radius}m)</div>
                        </div>
                    </div>
                )}

                {/* Location Status Badge */}
                {!location && (
                    <div className={`flex items-center justify-center p-3 rounded-lg border ${locationError ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                        {locationError ? (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center">
                                    <MapPinIcon className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-semibold">GPS Gagal</span>
                                </div>
                                <span className="text-xs mt-1 opacity-80">{locationError}</span>
                            </div>
                        ) : (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                                <span className="text-sm font-medium">Mencari Koordinat Lokasi Presensi...</span>
                            </>
                        )}
                    </div>
                )}

                {/* Leaflet Visual Map */}
                {location && (
                    <div className="space-y-2">
                        <div className="relative">
                            <div 
                                id="attendance-map" 
                                className="w-full h-44 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner z-0"
                            ></div>
                            {!leafletLoaded && (
                                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-xl text-slate-400 text-xs">
                                    Memuat peta...
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={getCurrentLocation}
                            disabled={isRefreshingLocation}
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 border border-emerald-500 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-emerald-500/10"
                        >
                            <ArrowPathIcon className={`w-4 h-4 text-white ${isRefreshingLocation ? 'animate-spin' : ''}`} />
                            <span>
                                {isRefreshingLocation 
                                    ? 'Menyelaraskan Akurasi GPS...' 
                                    : `Akuratkan Lokasi GPS${accuracy !== null ? ` (Akurasi: ±${Math.round(accuracy)}m)` : ''}`}
                            </span>
                        </button>
                    </div>
                )}

                {/* Camera Viewfinder */}
                <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center rounded-xl relative overflow-hidden bg-black shadow-inner border border-slate-200 dark:border-slate-700 group">
                    {cameraError && !photoPreview ? (
                        <div className="text-red-500 text-center p-4">
                            <CameraIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">{cameraError}</p>
                            <p className="text-xs mt-2 text-slate-400">Pastikan Anda memberi izin akses kamera pada browser.</p>
                            <button onClick={(e) => { e.preventDefault(); startCamera(); }} className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors border border-white/20">Coba Ulang Kamera</button>
                        </div>
                    ) : (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className={`w-full h-full object-cover absolute inset-0 ${photoPreview ? 'hidden' : 'block'}`}
                            ></video>
                            
                            <canvas ref={canvasRef} className="hidden"></canvas>
                            
                            {photoPreview && (
                                <img src={photoPreview} alt="Selfie Preview" className="w-full h-full object-cover absolute inset-0" />
                            )}

                            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 space-x-4">
                                {!photoPreview ? (
                                    <button 
                                        type="button" 
                                        onClick={capturePhoto} 
                                        disabled={!!cameraError}
                                        className="bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/50 p-4 rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 disabled:opacity-0"
                                    >
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                            <CameraIcon className="w-6 h-6 text-salira-600" />
                                        </div>
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={retakePhoto}
                                        className="bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-600 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg transition-all flex items-center space-x-2"
                                    >
                                        <ArrowPathIcon className="w-4 h-4" />
                                        <span>Ulangi Foto</span>
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Input Catatan Absensi */}
                {location && photoPreview && (
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            {isCheckedIn ? 'Catatan Pulang (Opsional)' : 'Catatan Masuk (Opsional)'}
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder={isCheckedIn ? 'Tulis aktivitas singkat hari ini...' : 'Tulis keterangan check-in jika diperlukan...'}
                            rows={2}
                            maxLength={500}
                            className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-sm focus:border-salira-500 focus:ring-salira-500"
                        />
                    </div>
                )}
                
                {errors.photo && <p className="text-red-500 text-xs text-center font-semibold">Peringatan: {errors.photo}</p>}
                {errors.latitude && <p className="text-red-500 text-xs text-center font-semibold">Peringatan: Anda belum terdeteksi oleh GPS (Lokasi Wajib).</p>}
            </div>

            <button 
                type="submit" 
                disabled={processing || !location || !photoPreview || !nearestGeofence?.valid}
                className="mt-6 w-full py-4 px-4 bg-salira-600 hover:bg-salira-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg transition-all flex justify-center items-center space-x-2 text-lg lg:text-xl active:scale-[0.98]"
            >
                {processing ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Merekam Kehadiran...</span>
                    </>
                ) : (
                    <span>{isCheckedIn ? 'Kirim Absen Pulang (Check-Out)' : 'Kirim Absen Masuk (Check-In)'}</span>
                )}
            </button>
        </form>
    );
}

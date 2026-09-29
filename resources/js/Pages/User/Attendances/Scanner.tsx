import { PageProps } from '@/types';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import AttendanceScanner from '@/Components/AttendanceScanner';
import { MapPinIcon } from '@heroicons/react/24/outline';

export default function Scanner({ auth, todayAttendance, geofences }: PageProps<{ todayAttendance: any; geofences: any[] }>) {
    return (
        <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 leading-tight">Absensi Geolocation</h2>}>
            <Head title="Absensi Geolocation" />

            <div className="flex flex-col w-full pb-24 font-body-md text-body-md text-slate-900 dark:text-slate-100 antialiased bg-slate-50 dark:bg-slate-900">
                {/* ── HERO SECTION ── */}
                <div className="relative bg-salira-700 dark:bg-slate-800 text-white px-gutter-sm pt-space-md pb-10 overflow-hidden">
                    <div className="relative z-10 flex flex-col gap-space-sm">
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 dark:bg-slate-700/50 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="font-label-sm text-label-sm font-semibold tracking-wider text-white uppercase">Sistem Aktif</span>
                            </div>
                        </div>
                        <div className="mt-1">
                            <h3 className="text-2xl font-bold mb-2 flex items-center tracking-tight">
                                <MapPinIcon className="w-6 h-6 mr-2" />
                                Presensi Pegawai
                            </h3>
                            <p className="font-body-sm text-body-sm mt-1 text-white opacity-90">
                                Harap pastikan lokasi (GPS) pada perangkat Anda telah menyala dan Anda berada di dalam radius zona kampus untuk check-in.
                            </p>
                        </div>
                    </div>
                    {/* decorative blur */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                </div>

                {/* ── CONTENT SHEET ── */}
                <div className="relative -mt-6 bg-white dark:bg-slate-800 border-t dark:border-slate-700 rounded-t-3xl px-gutter-sm pt-space-lg pb-space-xl flex flex-col gap-space-lg">
                    {/* Wrapper for max width on desktop */}
                    <div className="max-w-2xl mx-auto w-full">
                        <AttendanceScanner existingRecord={todayAttendance} geofences={geofences} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

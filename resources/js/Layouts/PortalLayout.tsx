import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import Dropdown from '@/Components/Dropdown';
import LogoutButton from '@/Components/LogoutButton';
import ThemeToggle from '@/Components/ThemeToggle';

export default function PortalLayout({ header, children }: PropsWithChildren<{ header?: ReactNode }>) {
    const { props } = usePage();
    const student = props.auth?.user as any;
    const flash = props.flash as any;
    const notifications = props.notifications as any;

    const handleBellClick = () => {
        if (notifications?.unreadCount > 0) {
            router.patch(route('portal.notifications.markAllAsRead'), {}, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };
    
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Sidebar collapse state (Desktop)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebarCollapsed') === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

    const navGroups = [
        {
            group: 'Portal Siswa',
            show: true,
            items: [
                {
                    label: 'Beranda Dashboard',
                    href: route('portal.dashboard'),
                    active: route().current('portal.dashboard'),
                    icon: (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
                },
                {
                    label: 'Keuangan & Tagihan',
                    href: route('portal.bills'),
                    active: route().current('portal.bills'),
                    icon: (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
                },
                {
                    label: 'Kartu Digital',
                    href: route('portal.id-card'),
                    active: route().current('portal.id-card'),
                    icon: (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>),
                },
                {
                    label: 'Scanner Presensi',
                    href: route('portal.attendance.scanner'),
                    active: route().current('portal.attendance.scanner'),
                    icon: (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>),
                },
                {
                    label: 'Drive Saya',
                    href: route('drive.index'),
                    active: route().current('drive.*'),
                    icon: (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>),
                },
                {
                    label: 'Pengaturan Profil',
                    href: route('portal.profile.edit'),
                    active: route().current('portal.profile.edit'),
                    icon: (<svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
                },
            ],
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {/* OVERLAY for mobile */}
            <div
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
                style={{
                    opacity: sidebarOpen ? 1 : 0,
                    pointerEvents: sidebarOpen ? 'auto' : 'none',
                    visibility: sidebarOpen ? 'visible' : 'hidden',
                }}
            />

            {/* SIDEBAR */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0`}
                style={{
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                }}
            >
                {/* Logo Area */}
                <div className={`flex h-16 items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-5'} border-b border-slate-100 flex-shrink-0 bg-blue-600 overflow-hidden transition-all duration-300`}>
                    <Link href={route('portal.dashboard')} className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                        <img src="/images/logo-salira.png" alt="SALIRA Logo" className="h-7 w-auto flex-shrink-0" />
                        {!sidebarCollapsed && (
                            <span className="text-xl font-bold border-white text-white whitespace-nowrap">
                                PORTAL
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg text-white hover:bg-white/20 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 overflow-y-auto py-4">
                    {navGroups.map((group) => (
                        <div key={group.group} className="mb-2">
                            {!sidebarCollapsed ? (
                                <p className="px-5 pt-4 pb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                                    {group.group}
                                </p>
                            ) : (
                                <div className="h-4" />
                            )}
                            <div className="px-3 space-y-1">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                                            item.active
                                                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className={`${item.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300'} transition-colors flex-shrink-0`}>
                                            {item.icon}
                                        </span>
                                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                                        {!sidebarCollapsed && item.active && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}


                </nav>
            </aside>

            {/* Force transform 0 on Desktop */}
            <style>{`
                @media (min-width: 1024px) {
                    aside { transform: translateX(0) !important; }
                }
            `}</style>

            {/* MAIN CONTENT WRAPPER */}
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                
                <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        
                        {/* Sidebar Toggle — desktop only */}
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-all hover:scale-110 active:scale-95"
                            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {sidebarCollapsed ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                            )}
                        </button>

                        <div className="hidden sm:block">
                            {header && (
                                <div className="text-slate-700 dark:text-slate-200 font-semibold text-lg">{header}</div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button onClick={handleBellClick} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    {notifications?.unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                        </span>
                                    )}
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content align="right" width="80" closeOnClickInside={false} contentClasses="py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-80 sm:w-96 shadow-xl rounded-xl">
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifikasi</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">{notifications?.unreadCount || 0} Baru</span>
                                </div>
                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                    {notifications?.recent && notifications.recent.length > 0 ? (
                                        notifications.recent.map((notif: any) => (
                                            <div
                                                key={notif.id}
                                                className={`w-full text-left p-4 flex gap-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${!notif.read_at ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.read_at ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm leading-tight ${!notif.read_at ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>{notif.data?.message || 'Pemberitahuan baru'}</p>
                                                    <div className="flex items-center justify-between mt-1.5">
                                                        <p className="text-[10px] text-slate-400">{new Date(notif.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}</p>
                                                        {!notif.read_at && (
                                                            <Link
                                                                href={route('portal.notifications.markAsRead', notif.id)}
                                                                method="patch"
                                                                as="button"
                                                                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                Tandai dibaca
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                            </div>
                                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Belum ada notifikasi baru</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl overflow-hidden">
                                    {notifications?.unreadCount > 0 && (
                                        <Link href={route('portal.notifications.markAllAsRead')} method="patch" as="button" className="p-2 border-b border-slate-100 dark:border-slate-700/50 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors py-2">
                                            Tandai Semua Terbaca
                                        </Link>
                                    )}
                                    <Link href={route('portal.notifications.index')} className="p-2 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors py-2">
                                        Lihat Semua Notifikasi
                                    </Link>
                                </div>
                            </Dropdown.Content>
                        </Dropdown>

                        <ThemeToggle />

                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                                        {student?.name?.charAt(0) || 'S'}
                                    </div>
                                    <div className="hidden sm:block text-left leading-tight">
                                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{student?.name}</div>
                                        <div className="text-xs text-slate-400">Portal Siswa</div>
                                    </div>
                                    <svg className="hidden sm:block w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('portal.profile.edit')}>Update Profil</Dropdown.Link>
                                <LogoutButton action={route('portal.logout')} className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-800 dark:focus:bg-gray-800">Keluar Portal</LogoutButton>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                {/* Main page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50/50">
                    {children}
                </main>

                {/* Toasts */}
                {toast && (
                    <div className="fixed bottom-6 right-6 z-[100] animate-bounce-in">
                        <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border-2 ${
                            toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-rose-600 text-white border-rose-400'
                        }`}>
                            <span className="font-bold">{toast.message}</span>
                            <button onClick={() => setToast(null)} className="ml-4 p-1 hover:bg-white/20 rounded-full">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.8); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-bounce-in { animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            `}</style>
        </div>
    );
}

import { Head, Link } from '@inertiajs/react';
import PortalLayout from '@/Layouts/PortalLayout';

export default function PortalBills({ bills, student, finance_contact }: any) {
    const unpaidBills = bills.filter((b: any) => b.status !== 'paid');
    const paidBills = bills.filter((b: any) => b.status === 'paid');

    const totalTunggakan = unpaidBills.reduce((acc: number, bill: any) => acc + parseFloat(bill.amount), 0);

    const waLink = finance_contact 
        ? `https://wa.me/${finance_contact}?text=${encodeURIComponent(`Halo Admin Keuangan Salira, saya ingin bertanya mengenai tagihan siswa atas nama ${student.name}`)}`
        : '#';

    return (
        <PortalLayout
            header={
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Portal Siswa</span>
                    <span className="text-slate-400 dark:text-slate-500">/</span>
                    <span className="text-slate-900 dark:text-white font-semibold">Keuangan & Tagihan</span>
                </div>
            }
        >
            <Head title="Keuangan Siswa" />

            {/* Typography setup */}
            <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8 pb-12" style={{ fontFamily: "'Inter', sans-serif" }}>
                
                {/* FINANCIAL SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <div className="bg-rose-600 dark:bg-rose-900 rounded-2xl p-6 lg:p-8 text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                        <div>
                            <p className="text-rose-100 text-xs font-semibold uppercase tracking-wider mb-2">Total Tunggakan</p>
                            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Rp {new Intl.NumberFormat('id-ID').format(totalTunggakan)}
                            </h3>
                        </div>
                        <p className="text-rose-100/80 text-[10px] mt-4 uppercase tracking-widest">Berdasarkan Tagihan Aktif</p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-center">
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-2">Tagihan Belum Lunas</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {unpaidBills.length} <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Invoice</span>
                        </h3>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col justify-center">
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-2">Riwayat Lunas</p>
                        <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {paidBills.length} <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Invoice</span>
                        </h3>
                    </div>
                </div>

                {/* MAIN BILLS LIST */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Daftar Tagihan</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Riwayat pembayaran dan tagihan aktif.</p>
                        </div>
                    </div>

                    {/* Mobile Card List vs Desktop Table */}
                    <div className="p-4 sm:p-0">
                        <div className="sm:hidden flex flex-col gap-4">
                            {bills.length === 0 ? (
                                <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">Belum ada tagihan.</div>
                            ) : (
                                bills.map((bill: any) => (
                                    <div key={bill.id} className="border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">{bill.bill_number}</div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{bill.title}</div>
                                            </div>
                                            {bill.status === 'paid' ? (
                                                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase">Lunas</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded-lg uppercase">Menunggu</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <div className="text-xs text-slate-500 dark:text-slate-400">Periode: {bill.month} / {bill.year}</div>
                                            <div className="text-base font-bold text-slate-900 dark:text-white">Rp {new Intl.NumberFormat('id-ID').format(bill.amount)}</div>
                                        </div>
                                        <Link 
                                            href={route('invoice.show', bill.bill_number)}
                                            className={`mt-2 w-full text-center py-2.5 rounded-lg text-xs font-bold transition-all ${
                                                bill.status === 'paid' 
                                                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
                                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                        >
                                            {bill.status === 'paid' ? 'Detail Kuitansi' : 'Bayar Sekarang'}
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-700/50">
                                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deskripsi Tagihan</th>
                                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nominal</th>
                                        <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Opsi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {bills.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center text-slate-500 dark:text-slate-400 text-sm">Belum ada data tagihan.</td>
                                        </tr>
                                    ) : (
                                        bills.map((bill: any) => (
                                            <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bill.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'}`}>
                                                            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">{bill.bill_number}</p>
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{bill.title}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Periode: {bill.month} / {bill.year}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Rp {new Intl.NumberFormat('id-ID').format(bill.amount)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {bill.status === 'paid' ? (
                                                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase">Terbayar</span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-[10px] font-bold rounded-lg uppercase">Menunggu</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link 
                                                        href={route('invoice.show', bill.bill_number)}
                                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                            bill.status === 'paid' 
                                                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600' 
                                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                    >
                                                        {bill.status === 'paid' ? 'Kuitansi' : 'Bayar'}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-900 dark:bg-blue-950 rounded-2xl p-8 text-white relative overflow-hidden shadow-sm">
                    <div className="absolute left-0 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                        <div>
                            <h4 className="text-xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Butuh bantuan pembayaran?</h4>
                            <p className="text-blue-200 text-sm max-w-md">Jika Anda mengalami kendala saat melakukan transaksi, silakan hubungi bagian administrasi keuangan.</p>
                        </div>
                        <a 
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-6 py-3 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-400 rounded-xl font-semibold text-sm transition-colors hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-2 flex-shrink-0"
                        >
                            <span className="material-symbols-outlined text-[20px]">support_agent</span>
                            Hubungi Admin
                        </a>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}

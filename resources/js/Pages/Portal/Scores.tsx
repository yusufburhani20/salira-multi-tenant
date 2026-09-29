import PortalLayout from '@/Layouts/PortalLayout';
import { Head } from '@inertiajs/react';

export default function Scores({ scores }: { scores: any }) {
    return (
        <PortalLayout header="Detail Nilai Akademik">
            <Head title="Rincian Nilai" />

            <div className="max-w-6xl mx-auto space-y-8 pb-20">
                {Object.keys(scores).length > 0 ? (
                    Object.entries(scores).map(([subject, subjectScores]: [string, any]) => (
                        <div key={subject} className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-indigo-50/30 dark:bg-indigo-900/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{subject}</h3>
                                        <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Total {subjectScores.length} Penilaian</p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <span className="text-xs font-bold text-slate-400 mr-2 uppercase">Rata-rata:</span>
                                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                        {Math.round(subjectScores.reduce((acc: any, s: any) => acc + Number(s.score), 0) / subjectScores.length)}
                                    </span>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {subjectScores.map((s: any) => (
                                    <div key={s.id} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-tight">
                                                    {new Date(s.assessment.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{s.assessment.title}</h4>
                                            {s.notes && (
                                                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl italic border-l-4 border-slate-200 dark:border-slate-700">
                                                    "{s.notes}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-black text-2xl border-4 ${s.score >= 80 ? 'border-emerald-100 dark:border-emerald-500/20 text-emerald-600' : s.score >= 70 ? 'border-blue-100 dark:border-blue-500/20 text-blue-600' : 'border-rose-100 dark:border-rose-500/20 text-rose-600'}`}>
                                                {s.score}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[3rem] shadow-sm border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada data nilai akademik tersedia.</p>
                    </div>
                )}
            </div>
        </PortalLayout>
    );
}

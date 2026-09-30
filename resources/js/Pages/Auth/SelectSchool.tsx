import { Head, useForm, usePage } from '@inertiajs/react';

interface School {
    id: number;
    name: string;
    type: string;
    logo: string | null;
    is_primary: boolean;
}

interface Props {
    schools: School[];
    currentSchoolId?: number | null;
}

const schoolTypeColors: Record<string, { bg: string; text: string; border: string }> = {
    SMK:  { bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-500/30' },
    MTs:  { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30' },
    MA:   { bg: 'bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30' },
    SMA:  { bg: 'bg-orange-500/10',  text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30' },
    SD:   { bg: 'bg-pink-500/10',    text: 'text-pink-600 dark:text-pink-400',   border: 'border-pink-500/30' },
};

function SchoolIcon({ type }: { type: string }) {
    return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
    );
}

export default function SelectSchool({ schools, currentSchoolId }: Props) {
    const { data, setData, post, processing } = useForm({
        school_id: currentSchoolId ?? schools.find(s => s.is_primary)?.id ?? schools[0]?.id ?? '',
    });

    const { auth } = usePage().props as any;

    const handleSelect = (schoolId: number) => {
        setData('school_id', schoolId);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('school.switch'));
    };

    return (
        <>
            <Head title="Pilih Sekolah" />

            {/* Background gradient */}
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
                {/* Decorative blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
                </div>

                <div className="relative w-full max-w-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">
                            Selamat datang, {auth?.user?.name?.split(' ')[0]}!
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Anda terdaftar di beberapa sekolah. Pilih sekolah tempat Anda bertugas hari ini.
                        </p>
                    </div>

                    {/* School Cards */}
                    <form onSubmit={handleSubmit}>
                        <div className={`grid gap-3 mb-6 ${schools.length > 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {schools.map((school) => {
                                const colors = schoolTypeColors[school.type] ?? {
                                    bg: 'bg-slate-500/10',
                                    text: 'text-slate-300',
                                    border: 'border-slate-500/30',
                                };
                                const isSelected = Number(data.school_id) === school.id;

                                return (
                                    <button
                                        key={school.id}
                                        type="button"
                                        onClick={() => handleSelect(school.id)}
                                        className={`
                                            relative w-full p-5 rounded-2xl border-2 text-left
                                            transition-all duration-200 cursor-pointer
                                            ${isSelected
                                                ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                                                : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                                            }
                                        `}
                                    >
                                        {/* Selected indicator */}
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-4">
                                            {/* Logo or Icon */}
                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center overflow-hidden`}>
                                                {school.logo ? (
                                                    <img src={school.logo} alt={school.name} className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <div className={colors.text}>
                                                        <SchoolIcon type={school.type} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                        {school.type}
                                                    </span>
                                                    {school.is_primary && (
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                            ⭐ Utama
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-semibold text-white text-sm leading-snug truncate">
                                                    {school.name}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={processing || !data.school_id}
                            className="
                                w-full py-3.5 px-6 rounded-xl font-semibold text-sm
                                bg-gradient-to-r from-blue-500 to-indigo-600
                                text-white shadow-lg shadow-blue-500/30
                                hover:from-blue-400 hover:to-indigo-500
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-all duration-200 flex items-center justify-center gap-2
                            "
                        >
                            {processing ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Masuk...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Masuk ke {schools.find(s => s.id === Number(data.school_id))?.name ?? 'Sekolah'}
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-500 mt-4">
                            Anda bisa mengganti sekolah kapan saja melalui menu di atas aplikasi.
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}

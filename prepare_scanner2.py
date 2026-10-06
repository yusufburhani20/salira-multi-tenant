import re
import os

with open('e:/Y/laravel/SALIRA/resources/js/Pages/User/Attendances/Scanner.tsx', 'r', encoding='utf-8') as f:
    scanner_content = f.read()

with open('e:/Y/laravel/SALIRA/scratch_jsx.txt', 'r', encoding='utf-8') as f:
    jsx_content = f.read()

# SPLIT JSX
jsx_lines = jsx_content.split('\n')
new_banner = '\n'.join(jsx_lines[2:62]) # skipping 1st line wrapper, include banner
new_dashboard = '\n'.join(jsx_lines[62:-2]) # include section 2 & 3

# --- 1. PREPARE NEW BANNER ---
new_banner = new_banner.replace(
    '<button className="px-4 py-2 rounded-lg bg-surface-container-lowest text-primary font-title text-body-md flex items-center gap-2 shadow-sm" type="button">',
    '<button onClick={() => setActiveTab(\'dashboard\')} className={`px-4 py-2 rounded-lg font-title text-body-md flex items-center gap-2 transition-colors ${activeTab === \'dashboard\' ? \'bg-surface-container-lowest text-primary shadow-sm\' : \'bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary\'}`} type="button">'
)
new_banner = new_banner.replace(
    '<button className="px-4 py-2 rounded-lg bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary font-title text-body-md flex items-center gap-2 transition-colors" type="button">',
    '<button onClick={() => setActiveTab(\'presensi\')} className={`px-4 py-2 rounded-lg font-title text-body-md flex items-center gap-2 transition-colors ${activeTab === \'presensi\' ? \'bg-surface-container-lowest text-primary shadow-sm\' : \'bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary\'}`} type="button">',
    1
)
new_banner = new_banner.replace(
    '<button className="px-4 py-2 rounded-lg bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary font-title text-body-md flex items-center gap-2 transition-colors" type="button">',
    '<button onClick={() => setActiveTab(\'izin\')} className={`px-4 py-2 rounded-lg font-title text-body-md flex items-center gap-2 transition-colors ${activeTab === \'izin\' ? \'bg-surface-container-lowest text-primary shadow-sm\' : \'bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary\'}`} type="button">',
    1
)
new_banner = new_banner.replace(
    '<span className="font-medium tracking-tight" id="live-clock">11:53:34 WIB | Selasa, 29 September 2026</span>',
    '<span className="font-medium tracking-tight" id="live-clock">{new Date().toLocaleString(\'id-ID\', {weekday:\'long\', year:\'numeric\', month:\'long\', day:\'numeric\', hour:\'2-digit\', minute:\'2-digit\', second:\'2-digit\'})} WIB</span>'
)
new_banner = new_banner.replace(
    '<button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-title text-label-md transition-colors hover:bg-surface-container-low shadow-sm" type="button">',
    '<button onClick={() => setActiveTab(\'presensi\')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-title text-label-md transition-colors hover:bg-surface-container-low shadow-sm" type="button">'
)


# --- 2. PREPARE NEW DASHBOARD ---
# Add onClick functionality to all metric cards
def inject_click(html_str, search_text, modal_title, arr_name):
    target = f'<div className="p-space-md rounded-xl {search_text} flex flex-col justify-between hover:'
    replace = f'<div onClick={{() => openDetailModal(\'{modal_title}\', dashboardStats?.{arr_name})}} className="cursor-pointer p-space-md rounded-xl {search_text} flex flex-col justify-between hover:'
    return html_str.replace(target, replace)

# Total Personel
new_dashboard = new_dashboard.replace('>36<', '>{dashboardStats?.total_staff || 0}<')
# Hadir
new_dashboard = inject_click(new_dashboard, 'bg-emerald-50/70', 'Hadir', 'hadir')
new_dashboard = new_dashboard.replace('>28<', '>{dashboardStats?.hadir?.length || 0}<')
new_dashboard = new_dashboard.replace('>77.8%<', '>{Math.round(((dashboardStats?.hadir?.length || 0) / (dashboardStats?.total_staff || 1)) * 100)}%<')
# Izin Pribadi -> mapped to izin
new_dashboard = inject_click(new_dashboard, 'bg-amber-50/70', 'Izin Pribadi', 'izin')
new_dashboard = new_dashboard.replace(
    '<span className="font-display text-headline-lg font-bold text-amber-900">1</span>',
    '<span className="font-display text-headline-lg font-bold text-amber-900">{dashboardStats?.izin?.length || 0}</span>', 1
)
# Izin Dinas -> mapped to pulang
new_dashboard = inject_click(new_dashboard, 'bg-cyan-50/70', 'Izin Dinas', 'pulang')
new_dashboard = new_dashboard.replace(
    '<span className="font-display text-headline-lg font-bold text-cyan-900">1</span>',
    '<span className="font-display text-headline-lg font-bold text-cyan-900">{dashboardStats?.pulang?.length || 0}</span>'
)
new_dashboard = new_dashboard.replace(
    '<span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Izin Dinas</span>',
    '<span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Pulang</span>'
)
# Sakit
new_dashboard = inject_click(new_dashboard, 'bg-orange-50/70', 'Sakit', 'sakit')
new_dashboard = new_dashboard.replace(
    '<span className="font-display text-headline-lg font-bold text-orange-900">1</span>',
    '<span className="font-display text-headline-lg font-bold text-orange-900">{dashboardStats?.sakit?.length || 0}</span>'
)
# Cuti
new_dashboard = inject_click(new_dashboard, 'bg-purple-50/70', 'Cuti', 'cuti')
new_dashboard = new_dashboard.replace(
    '<span className="font-display text-headline-lg font-bold text-purple-900">1</span>',
    '<span className="font-display text-headline-lg font-bold text-purple-900">{dashboardStats?.cuti?.length || 0}</span>'
)
# Libur
# The class for Libur / Selesai is "bg-surface-container". Need to be careful because Total Personel also uses it. 
# Total personel is the first one. So let's skip the first one for libur click, or just do replace for "Libur / Selesai" div
libur_html = '''<div className="p-space-md rounded-xl bg-surface-container flex flex-col justify-between hover:bg-surface-container-high transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Libur / Selesai</span>'''
libur_repl = '''<div onClick={() => openDetailModal('Libur', dashboardStats?.libur)} className="cursor-pointer p-space-md rounded-xl bg-surface-container flex flex-col justify-between hover:bg-surface-container-high transition-colors">
<div className="flex items-center justify-between text-outline">
<span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Libur / Selesai</span>'''
new_dashboard = new_dashboard.replace(libur_html, libur_repl)

new_dashboard = new_dashboard.replace(
    '<span className="font-display text-headline-lg font-bold text-on-surface">0</span>',
    '<span className="font-display text-headline-lg font-bold text-on-surface">{dashboardStats?.libur?.length || 0}</span>'
)
# Alfa
new_dashboard = inject_click(new_dashboard, 'bg-error-container/60', 'Alfa', 'alfa')
new_dashboard = new_dashboard.replace(
    '<span className="font-display text-headline-lg font-bold text-error">4</span>',
    '<span className="font-display text-headline-lg font-bold text-error">{dashboardStats?.alfa?.length || 0}</span>'
)

# Replace hardcoded table rows with dynamic data mapping
feed_pattern = re.compile(r'<tbody className="divide-y divide-surface-container">.*?</tbody>', re.DOTALL)
feed_replacement = """<tbody className="divide-y divide-surface-container">
{dashboardStats?.all_logs?.length > 0 ? (
    [...dashboardStats.all_logs].sort((a,b) => b.time.localeCompare(a.time)).map((log: any) => (
        <tr key={log.id} className="hover:bg-surface-container-low transition-colors">
            <td className="py-3 px-3 font-semibold text-primary">{log.time?.substring(0, 8)} WIB</td>
            <td className="py-3 px-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center uppercase">{log.user?.name?.substring(0,2)}</div>
                    <div className="flex flex-col">
                        <span className="font-title text-body-md text-on-surface font-semibold leading-snug">{log.user?.name}</span>
                        <span className="font-label-sm text-label-sm text-outline">{log.session?.name || 'Kegiatan'}</span>
                    </div>
                </div>
            </td>
            <td className="py-3 px-3">
                <span className="text-on-surface">Civitas Sekolah</span>
            </td>
            <td className="py-3 px-3">
                <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
                    <span className="">Sistem</span>
                </div>
            </td>
            <td className="py-3 px-3 text-right">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-label-sm text-label-sm font-semibold ${log.status === 'tawasul' ? 'bg-primary-container text-on-primary' : 'bg-emerald-50 text-emerald-700'}`}>
                    {log.status === 'tawasul' ? 'Tawasul' : log.status}
                </span>
            </td>
        </tr>
    ))
) : (
    <tr><td colSpan={5} className="py-6 text-center text-outline">Belum ada aktivitas hari ini.</td></tr>
)}
</tbody>"""
new_dashboard = feed_pattern.sub(feed_replacement, new_dashboard)

# Replace top tier list
top_pattern = re.compile(r'<div className="overflow-y-auto flex-1 pr-1 space-y-2\.5 pt-3">.*?</div></div></div></div>', re.DOTALL)
top_replacement = """<div className="overflow-y-auto flex-1 pr-1 space-y-2.5 pt-3">
{dashboardStats?.ranking?.length > 0 ? (
    dashboardStats.ranking.map((log: any, i: number) => {
        const rank = i + 1;
        const isTop3 = rank <= 3;
        return (
            <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-full font-bold font-label-sm text-label-sm flex items-center justify-center shrink-0 ${rank === 1 ? 'bg-amber-400 text-amber-950' : rank === 2 ? 'bg-slate-300 text-slate-800' : rank === 3 ? 'bg-amber-700/30 text-amber-900' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                        {rank}
                    </div>
                    <div className="min-w-0">
                        <p className="font-title text-body-sm text-on-surface font-semibold truncate leading-tight">{log.user?.name}</p>
                        <p className="font-body-sm text-[11px] text-outline truncate">Hadir Valid</p>
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <span className="font-label-sm text-label-md font-bold text-emerald-600">{log.time?.substring(0, 5)}</span>
                    <span className="block text-[10px] text-outline">WIB</span>
                </div>
            </div>
        );
    })
) : (
    <div className="py-6 text-center text-outline text-sm">Belum ada data kedatangan terawal.</div>
)}
</div></div></div></div>"""
new_dashboard = top_pattern.sub(top_replacement, new_dashboard)

# --- 3. INJECT INTO SCANNER.TSX ---
pattern_banner = re.compile(r'(<div className="flex flex-col w-full pb-24 [^>]*>).*?(<div className="relative -mt-6 bg-white)', re.DOTALL)
def banner_repl(m):
    return m.group(1) + "\n<div className=\"flex flex-col w-full space-y-space-lg px-gutter-sm\">\n" + new_banner + "\n</div>\n" + m.group(2)

new_scanner_content = pattern_banner.sub(banner_repl, scanner_content)

pattern_dash = re.compile(r'(<div className="flex flex-col space-y-8 bg-slate-50 dark:bg-slate-900 [^>]*>).*?(</div>\s*</div>\s*</div>\s*</div>\s*\{/\* DIALOG FOR PERMISSION)', re.DOTALL)
def dash_repl(m):
    return m.group(1) + "\n" + new_dashboard + "\n" + m.group(2)

new_scanner_content = pattern_dash.sub(dash_repl, new_scanner_content)

# Write to Scanner_new.tsx
with open('e:/Y/laravel/SALIRA/resources/js/Pages/User/Attendances/Scanner_new.tsx', 'w', encoding='utf-8') as f:
    f.write(new_scanner_content)

print("Created Scanner_new.tsx successfully")

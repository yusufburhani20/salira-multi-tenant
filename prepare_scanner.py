import re

# Read current Scanner.tsx
with open('e:/Y/laravel/SALIRA/resources/js/Pages/User/Attendances/Scanner.tsx', 'r', encoding='utf-8') as f:
    scanner_content = f.read()

# Read scratch_jsx.txt
with open('e:/Y/laravel/SALIRA/scratch_jsx.txt', 'r', encoding='utf-8') as f:
    jsx_content = f.read()

# Split jsx into parts
# Banner: lines 1-61
# Section 2: lines 62-242
# Section 3: lines 243-end
jsx_lines = jsx_content.split('\n')
new_banner = '\n'.join(jsx_lines[1:62]) # skipping <div className="flex flex-col w-full space-y-space-lg">
new_dashboard = '\n'.join(jsx_lines[62:]) + '\n</div>'

# Fix Tabs in Banner
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

# Add clock state to Scanner.tsx if not exists
# (I'll just inject standard JS Date in React)
new_banner = new_banner.replace(
    '<span className="font-medium tracking-tight" id="live-clock">11:53:34 WIB | Selasa, 29 September 2026</span>',
    '<span className="font-medium tracking-tight" id="live-clock">{new Date().toLocaleString(\'id-ID\', {weekday:\'long\', year:\'numeric\', month:\'long\', day:\'numeric\', hour:\'2-digit\', minute:\'2-digit\', second:\'2-digit\'})} WIB</span>'
)
new_banner = new_banner.replace(
    '<button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-title text-label-md transition-colors hover:bg-surface-container-low shadow-sm" type="button">',
    '<button onClick={() => setActiveTab(\'presensi\')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary font-title text-label-md transition-colors hover:bg-surface-container-low shadow-sm" type="button">'
)

# Map Dynamic Variables in new_dashboard
def replace_stat(label, icon, stat_expr, desc, action, color_class):
    # This is complex, I'll just do manual replaces for the numbers.
    pass

new_dashboard = new_dashboard.replace('>36<', '>{dashboardStats?.total_staff || 0}<')
new_dashboard = new_dashboard.replace('>28<', '>{dashboardStats?.hadir?.length || 0}<')
new_dashboard = new_dashboard.replace('77.8%', '{Math.round(((dashboardStats?.hadir?.length || 0) / (dashboardStats?.total_staff || 1)) * 100)}%')

new_dashboard = new_dashboard.replace(
    '<div className="p-space-md rounded-xl bg-surface-container flex flex-col justify-between hover:bg-surface-container-high transition-colors">',
    '<div className="p-space-md rounded-xl bg-surface-container flex flex-col justify-between hover:bg-surface-container-high transition-colors">'
)
# I will use a simple regex to replace the 8 metric cards to be clickable
# Actually, let's keep it simple. I'll just write the dashboard replacement directly using a template string in python to make it perfect.

# Let's write the whole file generator and output to e:/Y/laravel/SALIRA/Scanner_new.tsx

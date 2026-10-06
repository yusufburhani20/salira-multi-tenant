import re

html_path = 'e:/Y/laravel/SALIRA/stitch_dashboard_redesign/salira_dashboard_kehadiran_pegawai_desktop/code.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract from <main> to </main>
main_match = re.search(r'<main[^>]*>(.*?)<\/main>', content, re.DOTALL)
if main_match:
    jsx = main_match.group(1)
    # Convert class to className
    jsx = jsx.replace('class=', 'className=')
    jsx = jsx.replace('viewbox=', 'viewBox=')
    jsx = jsx.replace('stroke-width=', 'strokeWidth=')
    jsx = jsx.replace('stroke-dasharray=', 'strokeDasharray=')
    jsx = jsx.replace('stroke-dashoffset=', 'strokeDashoffset=')
    jsx = jsx.replace('stroke-linecap=', 'strokeLinecap=')
    jsx = jsx.replace('for=', 'htmlFor=')
    
    # Close img and input tags correctly
    jsx = re.sub(r'<(img|input|br|hr)([^>]*?)\s*>', r'<\1\2 />', jsx)
    
    # Also strip script tags
    jsx = re.sub(r'<script.*?>.*?<\/script>', '', jsx, flags=re.DOTALL)
    
    with open('e:/Y/laravel/SALIRA/scratch_jsx.txt', 'w', encoding='utf-8') as f:
        f.write(jsx)
    print('Converted to scratch_jsx.txt')
else:
    print('Main content not found')

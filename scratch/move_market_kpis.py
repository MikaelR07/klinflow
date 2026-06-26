import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/MarketIntelligence.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Extract KPI CARDS block
kpi_regex = re.compile(r'(\s*\{\/\* KPI CARDS \(TOP 5\) \*\/\}\s*<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">.*?</div>\s*)(?=<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">)', re.DOTALL)
kpi_match = kpi_regex.search(content)

if kpi_match:
    kpi_code = kpi_match.group(1)
    
    # Remove KPI from old location
    content = content.replace(kpi_code, '')
    
    # Adjust KPI grid classes to reduce gap
    kpi_code = kpi_code.replace('gap-4 mb-6', 'gap-3')
    
    # Reduce size of KPI cards
    kpi_code = kpi_code.replace('rounded-2xl p-5 border', 'rounded-2xl p-3.5 border')
    kpi_code = kpi_code.replace('w-7 h-7 rounded-md', 'w-6 h-6 rounded-md')
    kpi_code = kpi_code.replace('mb-3 z-10', 'mb-2 z-10')
    kpi_code = kpi_code.replace('text-xl font-bold', 'text-lg font-bold')
    kpi_code = kpi_code.replace('text-2xl font-medium', 'text-lg font-bold')
    
    # Insert KPI code inside the left column
    left_col_marker = '{/* MAIN COLUMN (LEFT) */}\n          <div className="xl:col-span-3 space-y-6">'
    new_left_col = f'{{/* MAIN COLUMN (LEFT) */}}\n          <div className="xl:col-span-3 space-y-4">\n{kpi_code}'
    
    content = content.replace(left_col_marker, new_left_col)

    # Change the main grid gap if needed, from gap-6 to gap-4 (like we did in dispatch)
    content = content.replace(
        '<div className="grid grid-cols-1 xl:grid-cols-4 gap-6">',
        '        {/* ── MAIN GRID ── */}\n        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mt-2">'
    )
    
    # Also reduce padding/spacing of the right side cards if requested
    content = content.replace(
        '<div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">',
        '<div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">'
    )

    # Save the file
    with open(filepath, 'w') as f:
        f.write(content)
    print("Done")
else:
    print("KPI regex failed")

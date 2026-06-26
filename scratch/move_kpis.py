import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/DispatchDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. We need to find the KPI CARDS block and TABS block.
# We will extract them from their current location and place them inside the LEFT COLUMN.

kpi_regex = re.compile(r'(\s*\{\/\* ── KPI CARDS ── \*\/\}\s*<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">.*?</div>\s*)\{\/\* ── TABS', re.DOTALL)
kpi_match = kpi_regex.search(content)

tabs_regex = re.compile(r'(\{\/\* ── TABS ── \*\/\}\s*<div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">.*?</div>\s*)\{\/\* ── NEW MAIN CONTENT', re.DOTALL)
tabs_match = tabs_regex.search(content)

if kpi_match and tabs_match:
    kpi_code = kpi_match.group(1)
    tabs_code = tabs_match.group(1)
    
    # Remove KPI and TABS from old location
    content = content.replace(kpi_code, '')
    content = content.replace(tabs_code, '')
    
    # Adjust KPI grid classes for 3 cols since it's now in an 8-col parent
    kpi_code = kpi_code.replace('lg:grid-cols-6 gap-4', 'gap-3')
    
    # Find the left column start
    left_col_marker = '{/* LEFT COLUMN (lg:col-span-8): Queue, Map, Active Cards */}'
    
    new_left_col = f"""{left_col_marker}
        <div className="lg:col-span-8 flex flex-col gap-4">
           {kpi_code}
           {tabs_code}"""
           
    # Wait, the current left col has:
    # {/* LEFT COLUMN (lg:col-span-8): Queue, Map, Active Cards */}
    # <div className="lg:col-span-8 flex flex-col gap-6">
    
    content = content.replace(
        left_col_marker + '\n        <div className="lg:col-span-8 flex flex-col gap-6">', 
        new_left_col
    )

    # Change "mt-6" to "mt-4" for the main content grid
    content = content.replace(
        '{/* ── NEW MAIN CONTENT ── */}\n      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-6">',
        '{/* ── MAIN CONTENT ── */}\n      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-2">'
    )

    # 2. Reduce the size of the side cards a bit. 
    # The right column currently has `<div className="lg:col-span-4 flex flex-col gap-6">`
    content = content.replace(
        '{/* RIGHT COLUMN (lg:col-span-4): The 3 Insight Cards Vertical */}\n        <div className="lg:col-span-4 flex flex-col gap-6">',
        '{/* RIGHT COLUMN (lg:col-span-4): The 3 Insight Cards Vertical */}\n        <div className="lg:col-span-4 flex flex-col gap-4">'
    )
    
    # Card paddings: change `p-5` to `p-4` for the 3 insight cards
    content = content.replace(
        'rounded-2xl shadow-sm p-5 flex flex-col',
        'rounded-2xl shadow-sm p-4 flex flex-col'
    )
    # Card 2 and 3 padding
    content = content.replace(
        'rounded-2xl shadow-sm p-4 flex flex-col',
        'rounded-2xl shadow-sm p-3.5 flex flex-col'
    )
    
    # Save the file
    with open(filepath, 'w') as f:
        f.write(content)
    print("Done")
else:
    print("Regex failed")

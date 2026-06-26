import re

def fix_page(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Page Title
    content = re.sub(r'text-xl\s+font-bold\s+tracking-tight', r'text-2xl font-semibold tracking-tight leading-none', content)
    content = re.sub(r'text-xl\s+font-bold\s+text-slate-900\s+dark:text-white\s+tracking-tight', r'text-2xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none', content)

    # 2. Table Headers (thead)
    # thead className="... text-[10px] uppercase tracking-widest text-slate-400 font-medium"
    content = re.sub(r'font-medium(.*?)text-\[10px\]\s+uppercase\s+tracking-widest\s+text-slate-400', r'font-bold\1text-[10px] uppercase tracking-widest text-slate-500', content)
    content = re.sub(r'text-xs\s+uppercase\s+tracking-wider\s+text-slate-500\s+font-medium', r'text-[10px] font-bold uppercase tracking-widest text-slate-500', content)
    content = re.sub(r'text-xs\s+font-semibold\s+text-slate-500', r'text-[10px] font-bold text-slate-500 uppercase tracking-widest', content)

    # 3. Sublabels
    content = re.sub(r'text-xs\s+font-medium\s+text-slate-500', r'text-[10px] font-bold text-slate-500 uppercase tracking-widest', content)
    
    # 4. Standard text
    content = re.sub(r'font-medium\s+text-xs\s+font-medium', r'font-medium text-sm', content) # fix accidental double font-medium
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Updated {filepath}")

fix_page('/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/FleetManagement.tsx')
fix_page('/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/DispatchDashboard.tsx')

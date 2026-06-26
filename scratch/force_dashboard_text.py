import re
import os

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Aggressively target all uppercase labels that have tracking-widest
# Any text-[10px] or text-xs or font-medium or font-semibold combined with uppercase and tracking-widest
# We want them all to precisely equal: text-[10px] font-bold text-slate-500 uppercase tracking-widest
def replace_uppercase_labels(match):
    return 'text-[10px] font-bold text-slate-500 uppercase tracking-widest'

# This regex matches className="... uppercase tracking-widest ..." but we only want to replace the typography parts.
# It's easier to just do string replacements for the specific combinations found in the grep:
content = content.replace('text-[10px] font-bold text-slate-400 uppercase tracking-widest', 'text-[10px] font-bold text-slate-500 uppercase tracking-widest')
content = content.replace('text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest', 'text-[10px] font-bold text-slate-500 uppercase tracking-widest')
content = content.replace('text-[10px] text-slate-400 uppercase tracking-widest', 'text-[10px] font-bold text-slate-500 uppercase tracking-widest')
content = content.replace('font-medium text-[10px] text-slate-400 uppercase tracking-widest', 'text-[10px] font-bold text-slate-500 uppercase tracking-widest')
content = content.replace('text-xs text-slate-400 uppercase tracking-widest', 'text-[10px] font-bold text-slate-500 uppercase tracking-widest')

# 2. General text-slate-400 to text-slate-500 to darken them as requested
content = content.replace('text-slate-400', 'text-slate-500')

# 3. Ensure font-medium is bumped to font-bold for better readability where text-slate-500 is used
content = content.replace('font-medium text-[10px] text-slate-500', 'font-bold text-[10px] text-slate-500')
content = content.replace('font-medium text-xs text-slate-500', 'font-bold text-xs text-slate-600')
content = content.replace('font-medium text-sm text-slate-500', 'font-bold text-sm text-slate-600')

with open(filepath, 'w') as f:
    f.write(content)

print(f"Aggressively updated {os.path.basename(filepath)}")

import re

FILE_PATH = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(FILE_PATH, 'r') as f:
    content = f.read()

# 1. Update font-semibold to font-bold for tiny uppercase labels
content = re.sub(r'text-\[10px\]\s+font-semibold\s+(.*?)uppercase\s+tracking-widest', r'text-[10px] font-bold \1uppercase tracking-widest', content)
content = re.sub(r'text-xs\s+font-semibold\s+(.*?)uppercase\s+tracking-widest', r'text-[10px] font-bold \1uppercase tracking-widest', content)

# 2. Page title
# from text-xl md:text-2xl font-semibold tracking-tight to text-2xl font-bold tracking-tight leading-none
content = re.sub(r'text-xl md:text-2xl\s+font-semibold\s+tracking-tight', r'text-2xl font-bold tracking-tight leading-none', content)

# 3. Headers for sections
# text-sm font-semibold to text-sm font-bold
content = re.sub(r'text-sm\s+font-semibold', r'text-sm font-bold', content)

# 4. Values / Metrics
# text-2xl font-semibold to text-xl font-bold
content = re.sub(r'text-2xl\s+font-semibold', r'text-xl font-bold', content)
# font-medium text-lg text-slate-900 to font-bold text-sm text-slate-900
content = re.sub(r'font-medium\s+text-lg\s+text-slate-900', r'font-bold text-sm text-slate-900', content)

with open(FILE_PATH, 'w') as f:
    f.write(content)

print("Updated text sizes for CompanyAdminDashboard.tsx")

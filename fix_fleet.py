import os

filepath = 'apps/agent/src/pages/admin/FleetManagement.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace('bg-slate-50/50', 'bg-white')
content = content.replace('bg-slate-50', 'bg-white')
content = content.replace('border-slate-200/50', 'border-[#e0e3eb]')
content = content.replace('border-slate-200', 'border-[#e0e3eb]')
content = content.replace('border-slate-100', 'border-[#e0e3eb]')
content = content.replace('shadow-sm', 'shadow-none')
content = content.replace('shadow-md', 'shadow-none')
content = content.replace('shadow-lg', 'shadow-none')
content = content.replace('text-slate-900', 'text-[#131722]')
content = content.replace('text-slate-800', 'text-[#131722]')
content = content.replace('rounded-2xl', 'rounded-lg')
content = content.replace('rounded-3xl', 'rounded-xl')

with open(filepath, 'w') as f:
    f.write(content)

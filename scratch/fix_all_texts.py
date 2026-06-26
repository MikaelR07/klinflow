import os
import glob
import re

target_dir = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin'
files = glob.glob(os.path.join(target_dir, '*.tsx'))

# Exclude FleetRFQs.tsx
files = [f for f in files if 'FleetRFQs.tsx' not in f]

def replace_classes(content):
    # Fix the missing edge cases from previous run
    
    # 1. Update font-semibold to font-bold for tiny uppercase labels
    content = re.sub(r'text-\[10px\]\s+font-semibold\s+(.*?)uppercase\s+tracking-widest', r'text-[10px] font-bold \1uppercase tracking-widest', content)
    content = re.sub(r'text-xs\s+font-semibold\s+(.*?)uppercase\s+tracking-(wider|widest)', r'text-[10px] font-bold \1uppercase tracking-widest', content)
    content = re.sub(r'text-xs\s+font-medium\s+(.*?)uppercase\s+tracking-(wider|widest)', r'text-[10px] font-bold \1uppercase tracking-widest', content)

    # 2. Page title
    content = re.sub(r'text-xl\s+md:text-2xl\s+font-semibold\s+tracking-tight', r'text-2xl font-bold tracking-tight leading-none', content)

    # 3. Headers for sections
    content = re.sub(r'text-sm\s+font-semibold', r'text-sm font-bold', content)
    content = re.sub(r'text-sm\s+font-medium', r'text-sm font-bold', content)

    # 4. Values / Metrics
    content = re.sub(r'text-2xl\s+font-semibold', r'text-xl font-bold', content)
    content = re.sub(r'font-medium\s+text-lg\s+text-slate-900', r'font-bold text-sm text-slate-900', content)
    
    return content

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = replace_classes(content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(filepath)}")

print("Done catching edge cases.")

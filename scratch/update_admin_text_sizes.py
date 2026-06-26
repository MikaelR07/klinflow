import os
import glob
import re

target_dir = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin'
files = glob.glob(os.path.join(target_dir, '*.tsx'))

# Exclude FleetRFQs.tsx as it is the reference template
files = [f for f in files if 'FleetRFQs.tsx' not in f]

def replace_classes(content):
    # Page Titles / Huge Headers
    content = re.sub(r'\btext-4xl\s+font-bold\b', 'text-2xl font-semibold tracking-tight leading-none', content)
    content = re.sub(r'\btext-3xl\s+font-bold\b', 'text-2xl font-semibold tracking-tight leading-none', content)
    content = re.sub(r'\btext-2xl\s+font-bold\b', 'text-xl font-bold leading-none', content)
    
    # Section Headers
    content = re.sub(r'\btext-lg\s+font-semibold\b', 'text-sm font-bold', content)
    content = re.sub(r'\btext-sm\s+font-semibold\b', 'text-sm font-bold', content)
    content = re.sub(r'\btext-xl\s+font-semibold\b', 'text-sm font-bold', content)
    
    # Uppercase Labels (Table headers, tiny labels)
    content = re.sub(r'\btext-xs\s+font-semibold\s+(text-[a-z]+-\d+)\s+uppercase\s+tracking-wider\b', r'text-[10px] font-bold \1 uppercase tracking-widest', content)
    content = re.sub(r'\btext-xs\s+font-medium\s+uppercase\s+(text-[a-z]+-\d+)\s+tracking-wider\b', r'text-[10px] font-bold uppercase \1 tracking-widest', content)
    content = re.sub(r'\btext-xs\s+font-semibold\s+uppercase\s+tracking-wider\b', r'text-[10px] font-bold uppercase tracking-widest', content)
    content = re.sub(r'\btext-xs\s+(text-[a-z]+-\d+)\s+uppercase\s+tracking-wider\b', r'text-[10px] font-bold \1 uppercase tracking-widest', content)
    
    # Standard text mappings (soften text-sm to text-xs for dense dashboards)
    content = re.sub(r'\btext-sm\s+font-medium\s+(text-slate-500|text-slate-400)\b', r'text-xs font-medium \1', content)
    content = re.sub(r'\btext-sm\s+(text-slate-500|text-slate-400)\b', r'text-xs font-medium \1', content)
    
    return content

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = replace_classes(content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {os.path.basename(filepath)}")

print("Done standardizing text sizes.")

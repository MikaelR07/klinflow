import os
import re

TARGET_DIR = '/home/mikael/Desktop/Coding/Klinflow/apps/business/src'

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # We want to replace non-dark text colors to make them darker.
    # text-slate-500 -> text-slate-700
    # text-slate-600 -> text-slate-800
    # text-slate-700 -> text-slate-900
    # text-slate-800 -> text-slate-900
    def replacer(m):
        full = m.group(0)
        val = int(m.group(1))
        
        # Only shift if it's less than 900
        if val <= 700:
            return f'text-slate-{val + 200}'
        elif val == 800:
            return f'text-slate-900'
        return full

    # We use a negative lookbehind for 'dark:' to only affect light mode texts.
    content = re.sub(r'(?<!dark:)text-slate-(\d{3})\b', replacer, content)
    
    # Also fix "thinness" globally by adding font-medium anywhere there's a text-xs or text-sm without a font weight
    # Actually we already added font-medium to the body, which propagates down. 
    # But sometimes people use Tailwind's text-slate-X without font-medium and we want to guarantee it.
    # Let's trust the body inheritance for now.
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            update_file(os.path.join(root, file))

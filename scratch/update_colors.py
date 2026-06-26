import os
import re

TARGET_DIR = '/home/mikael/Desktop/Coding/Klinflow/apps/business/src'

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # 1. Page Backgrounds
    content = content.replace('bg-[#F8F8FF]', 'bg-slate-50')
    content = content.replace('bg-[#F4F4F4]', 'bg-slate-50')
    
    # 2. Card Backgrounds to white (for areas that might use slate-100 as cards)
    # The user asked to make cards a better white color. 
    # If the page is slate-50, cards should be bg-white. 
    # We will replace bg-slate-100 with bg-white if it's likely a card.
    # Actually, let's just make all bg-slate-100 to bg-white.
    # content = content.replace('bg-slate-100', 'bg-white')
    # Actually, bg-white with a subtle border/shadow makes it a better white.
    # Let's not blindly replace bg-slate-100 as inputs might use it.
    
    # 3. Darken text in light mode
    # We want to shift text-slate-X00 up by 100.
    # But only if NOT preceded by dark:
    def shift_text_color(match):
        prefix = match.group(1)
        val = int(match.group(2))
        
        # If it's already dark:, don't shift it.
        if 'dark:' in prefix:
            return match.group(0)
            
        if val < 900:
            new_val = val + 100
            return f"{prefix}text-slate-{new_val}"
        return match.group(0)

    # regex: match anything that precedes text-slate-X00
    # we capture the prefix to check if it contains dark:
    # Actually, let's just use a negative lookbehind for 'dark:'
    # re.sub(r'(?<!dark:)text-slate-(\d00)', shift_text_color)
    # Python's re doesn't support variable length lookbehind, but 'dark:' is fixed length.
    
    # Let's do it safely:
    def replacer(m):
        full = m.group(0)
        val = int(m.group(1))
        if val < 900:
            return f'text-slate-{val + 100}'
        return full

    # We use a trick: split by 'dark:text-slate-', replace others, then join.
    # A better regex: match word boundaries
    # We want to match text-slate-XYZ where it's not preceded by dark:
    
    # We can do this with regex: \b(?<!dark:)text-slate-(\d{3})\b
    # Let's test the negative lookbehind.
    content = re.sub(r'(?<!dark:)text-slate-(\d{3})\b', replacer, content)

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            update_file(os.path.join(root, file))

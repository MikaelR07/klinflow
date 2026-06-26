"""
Fix font weights across all company owner (admin) pages.
Rules:
- h1 page titles: font-semibold (not font-bold)
- h3 card titles: font-semibold (not font-bold)
- h4 subtitles: font-semibold (not font-bold)
- KPI big values (font-black on h3): font-bold
- Body text / labels with font-bold: font-medium
- Buttons with font-bold: font-medium
- Very small text (text-[9px], text-[10px], text-[11px]) with font-bold: font-medium
  EXCEPT: badge/tag items and tracking-widest which should stay font-bold for legibility
- Chart legend labels: font-medium
- font-extrabold → font-semibold
"""

import re, os, glob

admin_dir = 'apps/agent/src/pages/admin'
files = glob.glob(os.path.join(admin_dir, '*.tsx'))

def fix_font_weights(content):
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        original = line
        
        # Rule 1: h1 tags — font-bold → font-semibold
        if '<h1 ' in line and 'font-bold' in line:
            line = line.replace('font-bold', 'font-semibold')
        
        # Rule 2: h3 card titles — font-bold → font-semibold
        elif '<h3 ' in line and 'font-bold' in line and 'font-black' not in line:
            line = line.replace('font-bold', 'font-semibold')
        
        # Rule 3: h4 subtitles — font-bold → font-semibold
        elif '<h4 ' in line and 'font-bold' in line:
            line = line.replace('font-bold', 'font-semibold')
        
        # Rule 4: KPI big values — font-black → font-bold  
        elif 'font-black' in line:
            line = line.replace('font-black', 'font-bold')
        
        # Rule 5: font-extrabold → font-semibold
        elif 'font-extrabold' in line:
            line = line.replace('font-extrabold', 'font-semibold')
        
        # Rule 6: Small label text (text-[9px], text-[10px], text-[11px]) with font-bold
        # but NOT tracking-widest (badges) and NOT buttons
        elif re.search(r'text-\[(9|10|11)px\]', line) and 'font-bold' in line:
            if 'tracking-widest' not in line and 'uppercase' not in line and '<button' not in line:
                line = line.replace('font-bold', 'font-medium')
        
        # Rule 7: <p> tags with font-bold that are description/label text → font-medium
        # (but not ones that are clearly important like names)
        elif '<p ' in line and 'font-bold' in line:
            # Keep bold for: names (text-sm with dark:text-white), status text
            if 'text-slate-500' in line or 'text-slate-400' in line:
                line = line.replace('font-bold', 'font-medium')
        
        # Rule 8: <span> labels with font-bold (non-badge) → font-medium
        elif '<span ' in line and 'font-bold' in line:
            if 'tracking-widest' not in line and 'uppercase' not in line and 'rounded-full' not in line:
                # These are typically chart labels, value displays, etc
                if 'text-slate-500' in line or 'text-slate-400' in line:
                    line = line.replace('font-bold', 'font-medium')
        
        # Rule 9: <button> with font-bold → font-medium
        elif '<button' in line and 'font-bold' in line:
            line = line.replace('font-bold', 'font-medium')
        
        # Rule 10: <th> table headers — font-bold → font-medium
        elif '<th ' in line and 'font-bold' in line:
            line = line.replace('font-bold', 'font-medium')

        new_lines.append(line)
    
    return '\n'.join(new_lines)


total_changes = 0
for filepath in sorted(files):
    basename = os.path.basename(filepath)
    with open(filepath, 'r') as f:
        original = f.read()
    
    fixed = fix_font_weights(original)
    
    if fixed != original:
        # Count changes
        orig_bold = original.count('font-bold') + original.count('font-black') + original.count('font-extrabold')
        new_bold = fixed.count('font-bold') + fixed.count('font-black') + fixed.count('font-extrabold')
        changes = orig_bold - new_bold
        
        with open(filepath, 'w') as f:
            f.write(fixed)
        
        remaining_bold = fixed.count('font-bold')
        remaining_semibold = fixed.count('font-semibold')
        remaining_medium = fixed.count('font-medium')
        
        print(f"✅ {basename}: {changes} weight reductions (bold:{remaining_bold} semibold:{remaining_semibold} medium:{remaining_medium})")
        total_changes += changes
    else:
        print(f"⏭️  {basename}: no changes needed")

print(f"\n🎯 Total font weight reductions: {total_changes}")

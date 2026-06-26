import re
import os
import glob

hub_pages_dir = 'apps/hub/src/pages'
hub_layouts_dir = 'apps/hub/src/layouts'

files = glob.glob(os.path.join(hub_pages_dir, '*.tsx'))
files += glob.glob(os.path.join(hub_layouts_dir, '*.tsx'))

def fix_font_weights(content):
    """
    Match the company owner (agent admin) text styling:
    - font-bold on page titles (h1, h2) -> font-semibold
    - font-bold on body/label text -> font-medium
    - font-extrabold / font-black -> font-semibold (for headings) or font-medium
    - Add font-medium to text elements that have no font weight
    """
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        if 'className' not in line:
            new_lines.append(line)
            continue
        
        # Replace font-black and font-extrabold with font-semibold
        line = line.replace('font-black', 'font-semibold')
        line = line.replace('font-extrabold', 'font-semibold')
        
        # Replace font-bold with font-semibold for headings (h1, h2, h3 tags)
        if re.search(r'<h[1-3]\s', line):
            line = line.replace('font-bold', 'font-semibold')
        else:
            # For everything else, font-bold -> font-medium
            line = line.replace('font-bold', 'font-medium')
        
        # Add font-medium to text elements that don't have any font weight
        if 'className="' in line:
            if re.search(r'text-(xs|sm|base|lg|xl|2xl|3xl|slate-|emerald-|amber-|rose-|blue-|white|black|\[\d+px\])', line):
                if not re.search(r'font-(normal|medium|semibold|bold|black|extrabold|light)', line):
                    line = line.replace('className="', 'className="font-medium ')
        
        new_lines.append(line)
    
    return '\n'.join(new_lines)

total_files = 0
for filepath in sorted(files):
    with open(filepath, 'r') as f:
        original = f.read()
    
    fixed = fix_font_weights(original)
    
    if fixed != original:
        with open(filepath, 'w') as f:
            f.write(fixed)
        total_files += 1
        print(f"Fixed font weights in {os.path.basename(filepath)}")

print(f"\nTotal files updated: {total_files}")

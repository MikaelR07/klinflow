import re
import os
import glob

admin_dir = 'apps/agent/src/pages/admin'
files = glob.glob(os.path.join(admin_dir, '*.tsx'))

def apply_medium_weight(content):
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        # Check if line has className="..."
        if 'className="' in line:
            # We want to add font-medium to text elements that don't have a font weight
            # Look for text sizing or coloring classes typical of text elements
            if re.search(r'text-(xs|sm|base|lg|xl|2xl|3xl|slate-|emerald-|amber-|rose-|blue-|white|black|\[\d+px\])', line):
                # If it does NOT already have a font-weight
                if not re.search(r'font-(normal|medium|semibold|bold|black|extrabold|light)', line):
                    # Inject font-medium
                    line = line.replace('className="', 'className="font-medium ')
        
        new_lines.append(line)
        
    return '\n'.join(new_lines)

total_files = 0
for filepath in sorted(files):
    with open(filepath, 'r') as f:
        original = f.read()
    
    fixed = apply_medium_weight(original)
    
    if fixed != original:
        with open(filepath, 'w') as f:
            f.write(fixed)
        total_files += 1
        print(f"Added font-medium to {os.path.basename(filepath)}")

print(f"Total files updated: {total_files}")

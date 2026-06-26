import re
import os
import glob

admin_dir = 'apps/agent/src/pages/admin'
files = glob.glob(os.path.join(admin_dir, '*.tsx'))

def normalize_fonts(content):
    # We will literally remove font-bold, font-black, font-extrabold, font-semibold from most text elements.
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        # If it's a heading, we allow font-semibold
        if re.search(r'<(h1|h2|h3|h4)', line):
            line = re.sub(r'font-(black|extrabold|bold)', 'font-semibold', line)
        else:
            # For everything else (p, span, div, td, button), remove font-bold, font-black, font-semibold entirely
            # We will just replace them with empty string
            line = re.sub(r'\s*font-(black|extrabold|bold|semibold)\s*', ' ', line)
            # We can optionally change font-medium to nothing too, but let's leave font-medium for now
            # as it's closer to normal. Actually, let's remove font-medium too for maximum "normalcy".
            line = re.sub(r'\s*font-medium\s*', ' ', line)
            
            # Clean up extra spaces inside className
            line = re.sub(r'className="\s+', 'className="', line)
            line = re.sub(r'\s+"', '"', line)
            
        new_lines.append(line)
        
    return '\n'.join(new_lines)

total_files = 0
for filepath in sorted(files):
    with open(filepath, 'r') as f:
        original = f.read()
    
    fixed = normalize_fonts(original)
    
    if fixed != original:
        with open(filepath, 'w') as f:
            f.write(fixed)
        total_files += 1
        print(f"Normalized fonts in {os.path.basename(filepath)}")

print(f"Total files updated: {total_files}")

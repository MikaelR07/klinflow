import re
import os
import glob

admin_dir = 'apps/agent/src/pages/admin'
files = glob.glob(os.path.join(admin_dir, '*.tsx'))

sticky_classes = ' sticky top-0 z-40 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 lg:-mx-6 lg:px-6 border-b border-slate-200 dark:border-slate-800 mb-6'

def make_sticky(content):
    # Find the first match of flex flex-col md:flex-row
    match = re.search(r'className="([^"]*flex flex-col md:flex-row[^"]*)"', content)
    if match:
        original_classes = match.group(1)
        if 'sticky top-0' not in original_classes:
            new_classes = original_classes + sticky_classes
            # Replace exactly the first occurrence
            new_content = content[:match.start(1)] + new_classes + content[match.end(1):]
            return new_content
    return content

total_files = 0
for filepath in sorted(files):
    if os.path.basename(filepath) == 'AdminLayout.tsx':
        continue
    with open(filepath, 'r') as f:
        original = f.read()
    
    fixed = make_sticky(original)
    
    if fixed != original:
        with open(filepath, 'w') as f:
            f.write(fixed)
        total_files += 1
        print(f"Added sticky header to {os.path.basename(filepath)}")

print(f"Total files updated: {total_files}")

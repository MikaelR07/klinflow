import os
import glob

admin_dir = 'apps/agent/src/pages/admin'
files = glob.glob(os.path.join(admin_dir, '*.tsx'))

sticky_classes = ' sticky top-0 z-40 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 lg:-mx-6 lg:px-6 border-b border-slate-200 dark:border-slate-800 mb-6'

total_files = 0
for filepath in sorted(files):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if sticky_classes in content:
        new_content = content.replace(sticky_classes, '')
        with open(filepath, 'w') as f:
            f.write(new_content)
        total_files += 1
        print(f"Removed sticky header from {os.path.basename(filepath)}")

print(f"Total files reverted: {total_files}")

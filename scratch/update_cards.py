import os

TARGET_DIR = '/home/mikael/Desktop/Coding/Klinflow/apps/business/src'

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Replace bg-slate-100 with bg-white to make cards whiter against slate-50
    content = content.replace('bg-slate-100', 'bg-white shadow-sm')
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            update_file(os.path.join(root, file))

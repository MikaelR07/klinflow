import os

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'surface-' in content:
        new_content = content.replace('surface-', 'slate-')
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Replaced in {filepath}")

for root, dirs, files in os.walk('apps/hub/src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            replace_in_file(os.path.join(root, file))

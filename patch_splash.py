import os

apps = ['agent', 'hub', 'business', 'admin']
base_dir = '/home/mikael/Desktop/Coding/Klinflow'

# Extract style and loader from client/index.html
with open(f'{base_dir}/apps/client/index.html', 'r') as f:
    client_html = f.read()

style_start = client_html.find('<style>')
style_end = client_html.find('</style>') + len('</style>')
style_block = client_html[style_start:style_end]

loader_start = client_html.find('<div id="initial-loader">')
loader_end = client_html.find('<div id="root">')
loader_block = client_html[loader_start:loader_end].strip()

removal_logic = """
// Remove the HTML splash screen only AFTER React has painted.
// Double rAF ensures the browser has committed at least one frame
// with the React LoadingScreen visible before we remove the HTML one.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const loader = document.getElementById("initial-loader");
    if (loader) {
      loader.remove();
    }
  });
});
"""

for app in apps:
    # Patch index.html
    idx_path = f'{base_dir}/apps/{app}/index.html'
    if os.path.exists(idx_path):
        with open(idx_path, 'r') as f:
            idx_html = f.read()
        
        if '<style>' not in idx_html and '#initial-loader {' not in idx_html:
            idx_html = idx_html.replace('</head>', '\n' + style_block + '\n</head>')
        elif '<style>' in idx_html and '#initial-loader {' not in idx_html:
            idx_html = idx_html.replace('</style>', '\n' + style_block.replace('<style>', '').replace('</style>', '') + '\n</style>')
            
        if '<div id="initial-loader">' not in idx_html:
            idx_html = idx_html.replace('<div id="root">', loader_block + '\n\n    <div id="root">')
            
        with open(idx_path, 'w') as f:
            f.write(idx_html)
            
    # Patch main.tsx
    main_path = f'{base_dir}/apps/{app}/src/main.tsx'
    if os.path.exists(main_path):
        with open(main_path, 'r') as f:
            main_tsx = f.read()
            
        if 'getElementById("initial-loader")' not in main_tsx:
            with open(main_path, 'a') as f:
                f.write('\n' + removal_logic)
                
    print(f'Patched {app}')

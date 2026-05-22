import os
import re

directories = [
    "apps/marketing/src/pages",
    "apps/marketing/src/components",
    "apps/marketing/src/layouts"
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Colors & Surfaces
    content = content.replace("bg-slate-900", "bg-surface-950")
    content = content.replace("bg-slate-950", "bg-surface-950")
    content = content.replace("text-emerald-500", "text-primary")
    content = content.replace("text-emerald-600", "text-primary-dark")
    content = content.replace("bg-emerald-500", "bg-primary")
    content = content.replace("bg-emerald-400", "bg-primary")
    content = content.replace("border-emerald-500", "border-primary")
    content = content.replace("border-emerald-100", "border-primary/20")
    
    # Dark mode backgrounds for cards/sections
    content = content.replace("bg-surface-950/50", "bg-surface-900")
    content = content.replace("bg-slate-800", "bg-surface-800")
    content = content.replace("bg-[#0f172a]", "bg-surface-950")

    # 2. Typography Hierarchy (reducing overly large text)
    content = content.replace("text-3xl sm:text-4xl md:text-6xl lg:text-7xl", "text-4xl md:text-5xl lg:text-6xl")
    content = content.replace("text-2xl sm:text-3xl md:text-5xl", "text-3xl md:text-4xl")
    content = content.replace("text-5xl md:text-8xl", "text-5xl md:text-6xl lg:text-7xl")
    
    # 3. Gradients
    content = content.replace("from-emerald-400 via-emerald-500 to-teal-500", "from-primary to-primary-dark")
    content = content.replace("from-emerald-500 to-teal-500", "from-primary to-primary-dark")
    content = content.replace("from-emerald-500 to-teal-400", "from-primary to-primary-dark")

    # 4. Shadows & Borders (Reducing exaggerated effects)
    content = content.replace("shadow-2xl shadow-emerald-500/30", "shadow-sm hover:shadow-md transition-shadow")
    content = content.replace("shadow-[0_0_50px_rgba(79,70,229,0.3)]", "shadow-sm")
    content = content.replace("blur-[100px]", "blur-[120px] opacity-30")
    content = content.replace("blur-[150px]", "blur-[120px] opacity-20")

    # 5. Buttons Refactoring
    # Convert standard long class chains to our new utility classes where possible
    # We'll just do some common ones found in Home.tsx
    content = re.sub(
        r'px-10 py-5 bg-primary hover:bg-primary text-white font-bold rounded-2xl transition-all shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-3 active:scale-95 text-sm uppercase tracking-widest',
        r'btn-primary flex items-center justify-center gap-2 text-sm uppercase tracking-widest',
        content
    )
    content = re.sub(
        r'px-10 py-5 border rounded-2xl font-bold transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest \$\{isDarkMode \? \'bg-white/5 border-white/10 hover:bg-white/10\' : \'bg-white border-slate-200 hover:bg-slate-50 shadow-sm\'\}',
        r'btn-secondary flex items-center justify-center gap-2 text-sm uppercase tracking-widest',
        content
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                process_file(os.path.join(root, file))

print("Done")

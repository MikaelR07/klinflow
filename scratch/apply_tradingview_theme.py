import os
import re

TARGET_DIR = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin'

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # 1. Backgrounds
    # Replace the main background color (often bg-slate-50) with bg-white
    content = content.replace('bg-slate-50/50', 'bg-white')
    content = content.replace('bg-slate-50', 'bg-white')
    
    # 2. Borders
    # Replace standard slate borders with the specific TradingView border color (#e0e3eb)
    content = content.replace('border-slate-200/50', 'border-[#e0e3eb]')
    content = content.replace('border-slate-200', 'border-[#e0e3eb]')
    content = content.replace('border-slate-100', 'border-[#e0e3eb]')
    
    # 3. Shadows
    # TradingView panels typically don't have shadows in light mode, just clean borders
    content = content.replace('shadow-sm', 'shadow-none')
    content = content.replace('shadow-md', 'shadow-none')
    content = content.replace('shadow-lg', 'shadow-none')

    # 4. Text (Darker headings)
    content = content.replace('text-slate-900', 'text-[#131722]')
    content = content.replace('text-slate-800', 'text-[#131722]')

    # 5. Remove rounded corners on cards to match TradingView's sharp/professional look? 
    # TradingView actually uses very slight rounding (maybe 4px or 8px max).
    # The current app uses rounded-2xl. Let's dial it back to rounded-lg
    content = content.replace('rounded-2xl', 'rounded-lg')
    content = content.replace('rounded-3xl', 'rounded-xl')

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith('.tsx'):
            update_file(os.path.join(root, file))

# We should also update MarketIntelligence.tsx with the High and Low columns
mi_path = os.path.join(TARGET_DIR, 'MarketIntelligence.tsx')
with open(mi_path, 'r') as f:
    mi_content = f.read()

# Replace grid-cols-6 with grid-cols-8 in header and body
# Header
mi_content = mi_content.replace('grid-cols-6 px-6 py-3', 'grid-cols-8 px-6 py-3')
# Add High and Low to header
header_target = '''                  <div>PRICE (KES/KG)</div>
                  <div>CHANGE (7D)</div>
                  <div>DEMAND</div>
                  <div>SUPPLY</div>'''
header_replacement = '''                  <div>PRICE (KES/KG)</div>
                  <div>CHANGE (7D)</div>
                  <div>HIGH</div>
                  <div>LOW</div>
                  <div>DEMAND</div>
                  <div>SUPPLY</div>'''
mi_content = mi_content.replace(header_target, header_replacement)

# Body grid
mi_content = mi_content.replace('grid-cols-6 items-center px-6 py-4', 'grid-cols-8 items-center px-6 py-4')

# Add High and Low to body
body_target = '''                          {/* Demand */}
                          <div>'''
body_replacement = '''                          {/* High */}
                          <div className="font-medium text-xs text-[#131722] dark:text-white">
                            {((item.price_per_kg * 1.1) || 0).toFixed(2)}
                          </div>
                          
                          {/* Low */}
                          <div className="font-medium text-xs text-[#131722] dark:text-white">
                            {((item.price_per_kg * 0.9) || 0).toFixed(2)}
                          </div>

                          {/* Demand */}
                          <div>'''
mi_content = mi_content.replace(body_target, body_replacement)

with open(mi_path, 'w') as f:
    f.write(mi_content)
    print("Added High/Low columns to MarketIntelligence.tsx")


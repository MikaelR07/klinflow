import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Extract Revenue Overview block
revenue_regex = re.compile(r'(\{\/\* Revenue Overview Chart \*\/\}\s*<Card className="lg:col-span-2">.*?</Card>)', re.DOTALL)
# Extract Material Market Intelligence block
material_regex = re.compile(r'(\{\/\* Material Market Intelligence \*\/\}\s*<Card>.*?</Card>)', re.DOTALL)

revenue_match = revenue_regex.search(content)
material_match = material_regex.search(content)

if revenue_match and material_match:
    revenue_block = revenue_match.group(1)
    material_block = material_match.group(1)
    
    # 1. Remove Material Market Intelligence from its original location
    content = content.replace(material_block, '')
    
    # 2. Add lg:col-span-2 to Material Market Intelligence
    modified_material_block = material_block.replace('<Card>', '<Card className="lg:col-span-2">')
    
    # Optional: adjust paddings slightly so the 3 AI cards fit better in a narrower column
    modified_material_block = modified_material_block.replace('md:grid-cols-3 gap-3', 'xl:grid-cols-3 gap-2')
    modified_material_block = modified_material_block.replace('rounded-xl p-4 flex flex-col', 'rounded-xl p-3 flex flex-col')
    
    # 3. Replace Revenue Overview block with the modified Material Market Intelligence block
    content = content.replace(revenue_block, modified_material_block)

# 4. Clean up the empty Row 4 container
row4_regex = re.compile(r'\{\/\* ══════════════════════════════════════════════════════════════════════\s*ROW 4 — MATERIAL MARKET INTELLIGENCE / ATTENTION CENTER\s*══════════════════════════════════════════════════════════════════════ \*\/\}\s*<div className="grid grid-cols-1\s*gap-3">\s*</div>', re.DOTALL)
content = row4_regex.sub('', content)

with open(filepath, 'w') as f:
    f.write(content)

print("Updates applied.")

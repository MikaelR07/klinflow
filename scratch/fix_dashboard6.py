import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Update Row 3 Layout
# From lg:grid-cols-3 to lg:grid-cols-4
row3_header_regex = re.compile(r'(\{\/\* ══════════════════════════════════════════════════════════════════════\s*ROW 3 — LIVE FLEET MAP / REVENUE CHART / TOP DRIVERS\s*══════════════════════════════════════════════════════════════════════ \*\/\}\s*<div className="grid grid-cols-1 )lg:grid-cols-3( gap-3">)')
content = row3_header_regex.sub(r'\1lg:grid-cols-4\2', content)

# 2. Update Revenue Overview col-span
# From lg:col-span-1 to lg:col-span-2
revenue_header_regex = re.compile(r'(\{\/\* Revenue Overview Chart \*\/\}\s*<Card className=")lg:col-span-1(">)')
content = revenue_header_regex.sub(r'\1lg:col-span-2\2', content)

# 3. Extract Attention Center and delete Marketplace Opportunities
market_regex = re.compile(r'(\{\/\* Marketplace Opportunities \*\/\}\s*<Card className="lg:col-span-1 flex flex-col justify-between">.*?</Card>)', re.DOTALL)
content = market_regex.sub('MARKETPLACE_PLACEHOLDER', content)

attention_regex = re.compile(r'(\{\/\* Attention Center \*\/\}\s*<Card>.*?</Card>)', re.DOTALL)
attention_match = attention_regex.search(content)

if attention_match:
    attention_block = attention_match.group(1)
    # Remove original Attention Center
    content = content.replace(attention_block, '')
    
    # Replace the Marketplace placeholder with Attention Center, adding lg:col-span-1 so it explicitly fits
    attention_block_modified = attention_block.replace('<Card>', '<Card className="lg:col-span-1">')
    content = content.replace('MARKETPLACE_PLACEHOLDER', attention_block_modified)

# 4. Update Row 4 Layout
# From lg:grid-cols-2 to grid-cols-1
row4_header_regex = re.compile(r'(\{\/\* ══════════════════════════════════════════════════════════════════════\s*ROW 4 — MATERIAL MARKET INTELLIGENCE / ATTENTION CENTER\s*══════════════════════════════════════════════════════════════════════ \*\/\}\s*<div className="grid grid-cols-1 )lg:grid-cols-2( gap-3">)')
content = row4_header_regex.sub(r'\1\2', content) # Removes lg:grid-cols-2 entirely, falling back to grid-cols-1

# 5. Multiple AI Recommendations in Material Intelligence
ai_rec_single_regex = re.compile(r'(<div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4">\s*<div className="flex items-center gap-2 mb-2">\s*<Bot className="font-medium w-4 h-4 text-emerald-600 dark:text-emerald-400" />\s*<p className="font-medium text-\[10px\] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">AI Recommendation</p>\s*</div>\s*<p className="font-medium text-xs text-slate-700 dark:text-slate-300 leading-relaxed">\s*Focus on collecting <strong>\{highestDemand\?\.material_name \|\| highestDemand\?\.material \|\| \'PET Bottles\'\}</strong> this week\.\s*High demand detected in Industrial Area with expected profit of KSh \{highestDemand\?\.price_per_kg \|\| highestDemand\?\.avgPrice \|\| 42\}/kg\.\s*</p>\s*<button onClick=\{\(\) => navigate\(\'/admin/market-intelligence\'\)\} className="font-medium mt-2 text-\[10px\] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">\s*View details <ArrowRight className="w-3 h-3" />\s*</button>\s*</div>)', re.DOTALL)

multi_ai_rec = """<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="font-medium w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">High Demand Alert</p>
                </div>
                <p className="font-medium text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Focus on collecting <strong>{highestDemand?.material_name || highestDemand?.material || 'PET Bottles'}</strong> this week.
                  High demand detected in Industrial Area with expected profit of KSh {highestDemand?.price_per_kg || highestDemand?.avgPrice || 42}/kg.
                </p>
              </div>
              <button onClick={() => navigate('/admin/market-intelligence')} className="font-medium mt-3 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
                View details <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="font-medium w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="font-medium text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest">Price Surge Expected</p>
                </div>
                <p className="font-medium text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>HDPE Plastic</strong> prices are projected to rise by 12% in the next 14 days due to new recycling plant capacities opening up in Nairobi.
                </p>
              </div>
              <button onClick={() => navigate('/admin/market-intelligence')} className="font-medium mt-3 text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                View trends <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-900/30 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="font-medium w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <p className="font-medium text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-widest">Optimization Tip</p>
                </div>
                <p className="font-medium text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Your fleet is currently underutilizing <strong>Cardboard</strong> collections by 30%. Consider running a targeted promotion in Eastleigh to capture this volume.
                </p>
              </div>
              <button onClick={() => navigate('/admin/dispatch')} className="font-medium mt-3 text-[10px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                Deploy fleet <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>"""

content = ai_rec_single_regex.sub(multi_ai_rec, content)

with open(filepath, 'w') as f:
    f.write(content)

print("Card modifications applied successfully.")

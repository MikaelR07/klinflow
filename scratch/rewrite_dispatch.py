import re

with open('apps/agent/src/pages/admin/DispatchDashboard.tsx', 'r') as f:
    content = f.read()

# We need to extract the various sections
# 1. Header & Tabs
# 2. Queue List
# 3. Map & Active Cards
# 4. Today's Performance
# 5. Dispatch Insights
# 6. AI Dispatch Recommendation
# 7. Assignment Modal

header_start = content.find('{/* ── HEADER ── */}')
queue_start = content.find('{/* LEFT: QUEUE LIST */}')
map_start = content.find('{/* RIGHT: MAP & ACTIVE CARDS */}')
perf_start = content.find('{/* Card 1: Today\'s Performance */}')
insights_start = content.find('{/* Card 2: Dispatch Insights */}')
ai_start = content.find('{/* Card 3: AI Dispatch Recommendation */}')
modal_start = content.find('{/* ASSIGNMENT MODAL */}')

# Extract blocks
header_tabs = content[header_start:content.find('{/* ── MAIN CONTENT (SPLIT) ── */}')]
queue = content[queue_start:map_start].strip()
map_cards = content[map_start:content.find('{/* ── BOTTOM METRICS (3 CARDS) ── */}')].strip()
map_cards = map_cards[:-6] # Remove trailing </div></div> from the grid

perf = content[perf_start:insights_start].strip()
insights = content[insights_start:ai_start].strip()
ai = content[ai_start:content.find('</div>\n\n      {/* ASSIGNMENT MODAL */}')].strip()
modal = content[modal_start:]

# Fix up the extracted map_cards div closure
if map_cards.endswith('</div>'):
   pass # We might need to adjust this depending on exact extraction

# Build the new layout
new_layout = f"""
      {header_tabs.strip()}

      {{/* ── NEW MAIN CONTENT ── */}}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {{/* LEFT COLUMN (lg:col-span-8): Queue, Map, Active Cards */}}
        <div className="lg:col-span-8 flex flex-col gap-6">
           
           {{/* Top Row of Left Column: Queue & Map side-by-side */}}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px]">
              <div className="lg:col-span-5 h-full">
                 {queue.replace('lg:col-span-5', '').strip()}
              </div>
              <div className="lg:col-span-7 h-full">
                 {map_cards.replace('lg:col-span-7', '').strip()}
              </div>
           </div>
           
        </div>

        {{/* RIGHT COLUMN (lg:col-span-4): The 3 Insight Cards Vertical */}}
        <div className="lg:col-span-4 flex flex-col gap-6">
           {perf}
           {insights}
           {ai}
        </div>
        
      </div>

      {modal.strip()}
"""

# Now replace the return block
return_start = content.find('  return (\n    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-10">')
if return_start != -1:
    before = content[:return_start]
    # We reconstruct the return statement
    new_return = f'  return (\n    <div className="space-y-6 animate-fade-in max-w-[1400px] mx-auto pb-10">\n{new_layout}\n    </div>\n  );\n}}'
    
    with open('apps/agent/src/pages/admin/DispatchDashboard.tsx', 'w') as f:
        f.write(before + new_return)
        print("Successfully rewrote DispatchDashboard.tsx layout")
else:
    print("Could not find return statement")


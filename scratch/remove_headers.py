import os
import re

base_dir = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin'

def process_file(filename, start_marker, end_marker, replacement):
    path = os.path.join(base_dir, filename)
    if not os.path.exists(path):
        print(f"File not found: {filename}")
        return

    with open(path, 'r') as f:
        content = f.read()

    # Find start and end indices using simple string search
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print(f"Start marker not found in {filename}")
        return
        
    end_idx = content.find(end_marker, start_idx)
    if end_idx == -1:
        print(f"End marker not found in {filename}")
        return
        
    end_idx += len(end_marker)
    
    new_content = content[:start_idx] + replacement + content[end_idx:]
    
    with open(path, 'w') as f:
        f.write(new_content)
    print(f"Successfully updated {filename}")

# 1. FleetManagement.tsx
process_file(
    'FleetManagement.tsx',
    '{/* ── HEADER ── */}',
    '</div>\n        </div>',
    '''{/* ── DESCRIPTION ── */}
        <div className="mb-4">
          <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Manage and monitor your operations team in real-time.</p>
        </div>'''
)

# 2. DispatchDashboard.tsx
process_file(
    'DispatchDashboard.tsx',
    '{/* ── HEADER ── */}',
    '</div>\n      </div>',
    '''{/* ── DESCRIPTION ── */}
      <div className="mb-4">
        <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Dispatch drivers, monitor active pickups, and track fulfillment in real-time.</p>
      </div>'''
)

# 3. AdminMarketplace.tsx
process_file(
    'AdminMarketplace.tsx',
    '{/* ── HEADER ── */}',
    '</div>\n      </div>',
    '''{/* ── DESCRIPTION ── */}
      <div className="mb-4">
        <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Manage public orders, accept RFQs, and fulfill on-demand pickups.</p>
      </div>'''
)

# 4. MarketIntelligence.tsx (Uses a different div structure)
process_file(
    'MarketIntelligence.tsx',
    '<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">',
    '</div>\n        </div>',
    '''{/* ── DESCRIPTION ── */}
        <div className="mb-4">
          <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Live market prices, demand trends and commodity insights.</p>
        </div>'''
)

# 5. FleetFinance.tsx
process_file(
    'FleetFinance.tsx',
    '<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">',
    '</div>\n      </div>',
    '''{/* ── DESCRIPTION ── */}
      <div className="mb-4">
        <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Monitor liquidity, track disbursements, manage approvals, and analyze financial performance.</p>
      </div>'''
)

# 6. DisputesPage.tsx
process_file(
    'DisputesPage.tsx',
    '<div className="mb-6">',
    '</p>\n      </div>',
    '''{/* ── DESCRIPTION ── */}
      <div className="mb-4">
        <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Monitor, investigate and resolve operational, client and staff disputes across your network.</p>
      </div>'''
)

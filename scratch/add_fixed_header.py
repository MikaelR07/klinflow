import re

with open('apps/hub/src/pages/ExecutiveCommandCenter.tsx', 'r') as f:
    content = f.read()

# We need to insert the Title block back, right before ROW 1
title_block = """
          {/* TITLE / PAGE HEADER (FIXED) */}
          <div className="sticky top-[-1.5rem] z-40 flex items-center justify-between mb-4 bg-slate-50/95 dark:bg-surface-950/95 backdrop-blur-sm p-4 -mx-4 border-b border-[#e0e3eb] dark:border-slate-700/50 shadow-sm">
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${textTitle}`}>Greenloop Global Hub</h1>
              <p className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1`}>Enterprise Command OS</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsSidebarOpen(true)}
                 className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md border text-[10px] font-bold shadow-none transition-colors ${isDarkMode ? 'bg-slate-800/60 border-slate-700/50 hover:border-emerald-500/50 text-emerald-400' : 'bg-white border-[#e0e3eb] hover:border-emerald-500/50 text-emerald-600'}`}
               >
                 <Activity className="w-4 h-4" /> Live Feed
               </button>
            </div>
          </div>
"""

content = content.replace('{/* ROW 1: Executive KPI Cards (6) */}', title_block + '\n          {/* ROW 1: Executive KPI Cards (6) */}')

with open('apps/hub/src/pages/ExecutiveCommandCenter.tsx', 'w') as f:
    f.write(content)

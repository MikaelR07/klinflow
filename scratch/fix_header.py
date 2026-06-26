with open('apps/hub/src/pages/ExecutiveCommandCenter.tsx', 'r') as f:
    content = f.read()

# Replace the parent div and sticky header so the header sits outside the padding wrapper
old_code = """      {/* ── MAIN SCROLLABLE DASHBOARD ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fade-in pb-10 space-y-5">
        <div className="max-w-[1600px] mx-auto space-y-5">
          
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
          </div>"""

new_code = """      {/* ── MAIN SCROLLABLE DASHBOARD ── */}
      <div className="flex-1 flex flex-col relative animate-fade-in overflow-hidden">
          {/* TITLE / PAGE HEADER (FIXED) */}
          <div className="shrink-0 flex items-center justify-between bg-slate-50/95 dark:bg-surface-950/95 backdrop-blur-sm px-4 md:px-6 lg:px-8 py-4 border-b border-[#e0e3eb] dark:border-slate-700/50 z-40">
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
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-10 space-y-5 scrollbar-hide">
             <div className="max-w-[1600px] mx-auto space-y-5">"""

content = content.replace(old_code, new_code)

# We need to add one more closing div at the end of the scrollable area
old_end = """        </div>
      </div>

      {/* ── SLIDING RIGHT SIDEBAR"""
      
new_end = """          </div>
        </div>
      </div>

      {/* ── SLIDING RIGHT SIDEBAR"""

content = content.replace(old_end, new_end)

with open('apps/hub/src/pages/ExecutiveCommandCenter.tsx', 'w') as f:
    f.write(content)

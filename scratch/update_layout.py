import re

FILE_PATH = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/FleetRFQs.tsx'

with open(FILE_PATH, 'r') as f:
    content = f.read()

pattern = r'\{\/\* Top Section: View Mode & Search \*\/\}.*?</div>\s*</div>\s*</div>'

new_ui = """{/* Top Section: View Mode & Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white dark:bg-slate-900">
            {/* Left: View Tabs */}
            <div className="flex items-center justify-start">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit shrink-0">
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'my' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  My RFQs
                </button>
                <button
                  onClick={() => setViewMode('market')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'market' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Market RFQs
                </button>
              </div>
            </div>

            {/* Center: Search */}
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search RFQs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Right: Status Filter */}
            <div className="flex items-center justify-end">
              {viewMode === 'my' && (
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl w-fit border border-slate-100 dark:border-slate-700/50 overflow-x-auto no-scrollbar shrink-0">
                  {['pending', 'accepted', 'closed', 'cancelled'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab as any)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${filter === tab ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      {tab === 'pending' ? 'Open' : tab === 'accepted' ? 'Fulfilled' : tab}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>"""

content = re.sub(pattern, new_ui, content, flags=re.DOTALL)

with open(FILE_PATH, 'w') as f:
    f.write(content)

print("Updated flex layout successfully.")

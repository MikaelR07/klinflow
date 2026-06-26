import re

FILE_PATH = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/FleetRFQs.tsx'

with open(FILE_PATH, 'r') as f:
    content = f.read()

# 1. Add viewMode state
state_pattern = r"const \[searchQuery, setSearchQuery\] = useState\(''\);"
if "const [viewMode, setViewMode]" not in content:
    content = re.sub(
        state_pattern, 
        "const [searchQuery, setSearchQuery] = useState('');\n  const [viewMode, setViewMode] = useState<'my' | 'market'>('my');", 
        content
    )

# 2. Update the fetchRFQs logic
fetch_pattern = r"""      const \{ data, error \} = await supabase
        \.from\('rfqs'\)
        \.select\(`\*, rfq_offers\(count\)`\)
        \.eq\('buyer_id', profile\.id\)
        \.order\('created_at', \{ ascending: false \}\);"""

new_fetch = """      let query = supabase.from('rfqs').select(`*, rfq_offers(count)`).order('created_at', { ascending: false });
      if (viewMode === 'my') {
        query = query.eq('buyer_id', profile.id);
      } else {
        query = query.neq('buyer_id', profile.id);
      }
      const { data, error } = await query;"""

content = re.sub(fetch_pattern, new_fetch, content)

# 3. Add viewMode to useEffect dependencies
dep_pattern = r"\}, \[profile\?\.id\]\);"
content = re.sub(dep_pattern, "}, [profile?.id, viewMode]);", content)

# 4. Update the Tabs & Search UI
ui_pattern = r"""          \{/\* Tabs & Search \*/\}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/30 dark:bg-slate-900/50">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
              \{\['pending', 'accepted', 'closed', 'cancelled'\]\.map\(tab => \(
                <button
                  key=\{tab\}
                  onClick=\{.*?\}
                  className=\{.*?\}
                >
                  \{.*?\}
                </button>
              \)\)\}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search RFQs\.\.\." 
                value=\{searchQuery\}
                onChange=\{.*?\}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
              />
            </div>
          </div>"""

new_ui = """          {/* Top Section: View Mode & Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row gap-4 justify-between bg-white dark:bg-slate-900">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* My RFQs vs Market RFQs */}
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

              {/* Status Filter */}
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
            </div>

            <div className="relative w-full lg:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search RFQs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
              />
            </div>
          </div>"""

# Ensure we do a non-greedy match of onClick and className
content = re.sub(ui_pattern, new_ui, content, flags=re.DOTALL)

with open(FILE_PATH, 'w') as f:
    f.write(content)

print("Successfully added My RFQs / Market RFQs tabs")

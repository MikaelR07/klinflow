import re

with open('apps/hub/src/layouts/HubLayout.tsx', 'r') as f:
    content = f.read()

# 1. Update Section Header text size (text-[10px] -> text-xs)
content = content.replace("text-[10px] font-bold uppercase tracking-widest transition-colors", "text-xs font-bold uppercase tracking-widest transition-colors")

# 2. Update NavLink text size (text-xs font-medium -> text-sm font-semibold)
content = content.replace("px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200", "px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200")

# 3. Add the 3-chevron collapse button to the Sidebar Header
sidebar_header_old = """             <span className={`text-lg font-bold tracking-tight whitespace-nowrap transition-opacity duration-300 ${isDesktopSidebarCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
               KLINFLOW <span className="text-emerald-500 font-light">MOS</span>
             </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>"""

sidebar_header_new = """             <span className={`text-lg font-bold tracking-tight whitespace-nowrap transition-opacity duration-300 ${isDesktopSidebarCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'} ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
               KLINFLOW <span className="text-emerald-500 font-light">MOS</span>
             </span>
          </div>
          
          <button 
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
              } else {
                setIsSidebarOpen(false);
              }
            }} 
            className={`hidden lg:flex items-center -space-x-2 text-slate-400 hover:text-emerald-500 transition-colors ${isDesktopSidebarCollapsed ? 'mr-0' : ''}`}
          >
            {isDesktopSidebarCollapsed ? (
               <>
                 <ChevronRight className="w-6 h-6" />
                 <ChevronRight className="w-6 h-6 opacity-80" />
                 <ChevronRight className="w-6 h-6 opacity-60" />
               </>
            ) : (
               <>
                 <ChevronLeft className="w-6 h-6 opacity-60" />
                 <ChevronLeft className="w-6 h-6 opacity-80" />
                 <ChevronLeft className="w-6 h-6" />
               </>
            )}
          </button>

          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>"""

content = content.replace(sidebar_header_old, sidebar_header_new)

# 4. Remove the topnav button
topnav_button_old = """           {/* Left side */}
           <div className="flex items-center gap-4">
             <button 
               onClick={() => {
                 if (window.innerWidth >= 1024) {
                   setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
                 } else {
                   setIsSidebarOpen(true);
                 }
               }}
               className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
             >
               <Menu className="w-5 h-5" />
             </button>

             {/* Org Switcher */}"""

topnav_button_new = """           {/* Left side */}
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className={`lg:hidden p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
             >
               <Menu className="w-5 h-5" />
             </button>

             {/* Org Switcher */}"""

content = content.replace(topnav_button_old, topnav_button_new)

# Make sure ChevronLeft is imported
if "ChevronLeft" not in content[:500]:
    content = content.replace("ChevronRight,", "ChevronRight,\n  ChevronLeft,")

with open('apps/hub/src/layouts/HubLayout.tsx', 'w') as f:
    f.write(content)

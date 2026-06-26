import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/AdminLayout.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Update imports to include Sun, Moon
content = re.sub(
    r"import \{ LayoutDashboard(.*?)\} from 'lucide-react';",
    r"import { LayoutDashboard\1, Sun, Moon } from 'lucide-react';",
    content
)

# 2. Remove the User Info / Logout section from the sidebar
# From {/* User Info / Logout */} to </div> right before </div> closing the sidebar.
# In the original file:
#         {/* User Info / Logout */}
#         <div className="p-4 border-t border-slate-200 dark:border-slate-700"> ... </div>
#       </div>
user_info_pattern = re.compile(r'\{\/\* User Info / Logout \*\/\}.*?</div>\s*</div>\s*</div>', re.DOTALL)
# Wait, it's safer to just replace from `{/* User Info / Logout */}` to `<div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">`
user_info_pattern = re.compile(r'\{\/\* User Info \/ Logout \*\/\}.*?(?=\{\/\* Main Content Area \*\/\})', re.DOTALL)
content = user_info_pattern.sub('      </div>\n\n      ', content)

# 3. Replace the Top Nav completely
new_topnav = """{/* Fixed Top Navigation */}
        <header className="h-16 bg-white dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 shrink-0 z-10 sticky top-0">
          
          {/* Left Side: Welcome Text */}
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors relative"
            >
              <Menu className="w-6 h-6" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
            <div className="hidden lg:block">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Welcome back, {profile?.name?.split(' ')[0] || 'Admin'}</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Company Dashboard</p>
            </div>
          </div>

          {/* Center: Global Search */}
          <div className="flex-1 flex justify-center">
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none w-64 md:w-80 transition-all focus:w-96 shadow-sm"
              />
            </div>
          </div>

          {/* Right Side: Toggles, Profile, Logout */}
          <div className="flex items-center justify-end gap-3 flex-1">
            
            {/* Marketplace Toggle */}
            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-100 dark:border-indigo-500/20" onClick={() => navigate('/admin/marketplace')}>
              <Store className="w-3 h-3" />
              Marketplace
            </button>

            {/* Dark/Light Mode Toggle */}
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors relative" onClick={() => document.documentElement.classList.toggle('dark')}>
              <Sun className="w-5 h-5 hidden dark:block" />
              <Moon className="w-5 h-5 block dark:hidden" />
            </button>

            {/* Notifications */}
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-800"></span>
            </button>

            {/* Profile Avatar */}
            <div 
              onClick={() => navigate('/settings')}
              className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold border border-emerald-200 cursor-pointer shadow-sm hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 transition-all dark:ring-offset-slate-800"
            >
              {profile?.avatar || '👤'}
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors hidden sm:block"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>"""

topnav_pattern = re.compile(r'\{\/\* Fixed Top Navigation \*\/\}.*?(?=\{\/\* Scrollable Content \*\/\})', re.DOTALL)
content = topnav_pattern.sub(new_topnav + '\n\n        ', content)

with open(filepath, 'w') as f:
    f.write(content)

print("Updated AdminLayout TopNav and Sidebar.")

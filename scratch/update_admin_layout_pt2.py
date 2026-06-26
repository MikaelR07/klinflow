import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/AdminLayout.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace("import { LayoutDashboard", "import { RefreshCw, Power, Loader2, LayoutDashboard")

# 2. Add toggleOnline and state
auth_store_line = "const { logout, profile } = useAuthStore();"
new_auth_store = "const { logout, profile, toggleOnline } = useAuthStore();"
content = content.replace(auth_store_line, new_auth_store)

state_line = "const [pendingDriverCount, setPendingDriverCount] = useState(0);"
new_state_lines = """const [pendingDriverCount, setPendingDriverCount] = useState(0);
  const [isTogglingMarketplace, setIsTogglingMarketplace] = useState(false);

  const handleToggleMarketplace = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTogglingMarketplace) return;
    setIsTogglingMarketplace(true);
    try {
      if (toggleOnline) await toggleOnline();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingMarketplace(false);
    }
  };"""
content = content.replace(state_line, new_state_lines)

# 3. Update Marketplace link in sidebar to have the toggle
# Original: <span className="flex-1 text-left">{item.name}</span>
nav_text_line = '<span className="flex-1 text-left">{item.name}</span>'
new_nav_text = """<span className="flex-1 text-left">{item.name}</span>
                {item.name === 'Marketplace' && (
                  <div 
                    onClick={handleToggleMarketplace}
                    className={`relative w-8 h-4 rounded-full transition-all duration-300 ${profile?.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm ${profile?.isOnline ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                )}"""
content = content.replace(nav_text_line, new_nav_text)

# 4. Update TopNav (Left side + Right side)
# We will use regex to replace from {/* Fixed Top Navigation */} to </header>
old_topnav_pattern = re.compile(r'\{\/\* Fixed Top Navigation \*\/\}.*?<\/header>', re.DOTALL)

new_topnav = """{/* Fixed Top Navigation */}
        <header className="h-20 bg-white dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 shrink-0 z-10 sticky top-0">
          
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
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome back, {profile?.name?.split(' ')[0] || 'Admin'} 👋</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{profile?.companyName || 'Company Dashboard'}</p>
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
            
            {/* Refresh */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors relative"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
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
              className="flex items-center gap-2 px-3 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-full transition-colors hidden sm:flex"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
            </button>
          </div>
        </header>"""

content = old_topnav_pattern.sub(new_topnav, content)

with open(filepath, 'w') as f:
    f.write(content)

print("Updated AdminLayout.")

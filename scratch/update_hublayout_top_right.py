import re

with open('apps/hub/src/layouts/HubLayout.tsx', 'r') as f:
    content = f.read()

# 1. Add imports (Power, Loader2, LogOut, User as UserIcon)
content = content.replace("} from 'lucide-react';", "  Power, Loader2, LogOut, User as UserIcon\n} from 'lucide-react';")

# 2. Add toast if not exists
if "toast" not in content:
    content = content.replace("import { motion", "import { toast } from 'sonner';\nimport { motion")

# 3. Add states and destructured AuthStore vars
auth_pattern = r"const { profile } = useAuthStore\(\);"
auth_replacement = """const { profile, toggleOnline, logout } = useAuthStore();
  const [isTogglingMarketplace, setIsTogglingMarketplace] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleToggleMarketplace = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTogglingMarketplace) return;
    setIsTogglingMarketplace(true);
    try {
      if (toggleOnline) {
        await toggleOnline();
        toast.success(profile?.isOnline ? 'Marketplace Closed' : 'Marketplace Open!', {
          description: profile?.isOnline ? 'Your fleet is now hidden.' : 'Your company is now visible to residents.'
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Toggle failed');
    } finally {
      setIsTogglingMarketplace(false);
    }
  };"""

content = content.replace(auth_pattern, auth_replacement)

# 4. Replace right side
right_side_pattern = r"\{/\* Right side \*/\}.*?(?=</header>)"
right_side_replacement = """{/* Right side */}
           <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Marketplace Toggle */}
              {profile?.agentAccountType === 'company_admin' && (
                <div className="hidden lg:flex font-medium bg-white dark:bg-slate-900 text-[#131722] dark:text-white p-1.5 px-3 rounded-full items-center gap-4 border border-[#e0e3eb] dark:border-slate-700/50 transition-colors mr-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${profile?.isOnline ? 'bg-emerald-500 shadow-none text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500'}`}>
                      {isTogglingMarketplace ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                    </div>
                    <div className="mr-2 hidden xl:block">
                      <p className="font-bold text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 leading-none mb-0.5">Marketplace</p>
                      <p className="font-bold text-[10px] text-slate-500 tracking-tight leading-none">{profile?.isOnline ? 'Active' : 'Offline'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleMarketplace}
                    disabled={isTogglingMarketplace}
                    className={`relative w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 ${profile?.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-none ${profile?.isOnline ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}

              <button className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${isDarkMode ? 'bg-slate-900 border-white/10 hover:border-emerald-500/50 text-slate-300' : 'bg-white border-slate-200 hover:border-emerald-500/50 text-slate-600'}`}>
                 <FileBarChart className="w-3.5 h-3.5 text-emerald-500" />
                 Report
              </button>

              <div className="w-px h-6 mx-1 bg-slate-200 dark:bg-white/10 hidden sm:block" />

              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-yellow-400' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button 
                className={`relative p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}
              >
                 <Bell className="w-5 h-5" />
                 {unreadCount > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950" />
                 )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="w-8 h-8 rounded-full border border-[#e0e3eb] dark:border-slate-700/50 overflow-hidden ml-1"
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {profile?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-[#e0e3eb] dark:border-slate-700">
                        <p className="text-sm font-bold text-[#131722] dark:text-white truncate">{profile?.name || 'User'}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{profile?.email}</p>
                      </div>
                      <div className="p-1">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left">
                          <Settings className="w-4 h-4 text-slate-400" />
                          Settings
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          Account
                        </button>
                      </div>
                      <div className="p-1 border-t border-[#e0e3eb] dark:border-slate-700">
                        <button 
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            if(logout) logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

           </div>
        """

content = re.sub(right_side_pattern, right_side_replacement, content, flags=re.DOTALL)

with open('apps/hub/src/layouts/HubLayout.tsx', 'w') as f:
    f.write(content)

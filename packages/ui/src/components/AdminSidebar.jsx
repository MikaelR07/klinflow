/**
 * Admin Sidebar — desktop sidebar navigation for admin panel
 */
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, Recycle, Brain, MessageSquare, Network, Coins, UserCheck, Building2 } from 'lucide-react';

const links = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'User Manager' },
  { path: '/agent-metrics', icon: UserCheck, label: 'Ind. Agent Metrics' },
  { path: '/company-metrics', icon: Building2, label: 'Company Metrics' },
  { path: '/hub', icon: Coins, label: 'Market Hub' },
  { path: '/b2b', icon: Network, label: 'B2B Logistics' },
  { path: '/reports', icon: FileText, label: 'System Reports' },
  { path: '/reviews', icon: MessageSquare, label: 'Feedback' },
  { path: '/hygenex', icon: Brain, label: 'HygeneX AI' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100dvh-56px)] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
      {/* Branding Section */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col gap-4">
          <img src="/logo.png" alt="Admin Logo" className="w-16 h-16 rounded-2xl shadow-lg ring-1 ring-black/5" />
          <div>
            <p className="text-xs font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Command</p>
            <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">Network Oracle</h1>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.end}
            id={`admin-nav-${link.label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/10'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            <link.icon className="w-5 h-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Recycle className="w-4 h-4" />
          <span>CleanFlow KE v2.0</span>
        </div>
      </div>
    </aside>
  );
}

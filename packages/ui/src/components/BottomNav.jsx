/**
 * Bottom Navigation — for User and Agent mobile views
 */
import { NavLink } from 'react-router-dom';

export default function BottomNav({ items }) {
  return (
    <nav className="shrink-0 z-50 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200/60 dark:border-slate-800/60 safe-bottom lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[56px] ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg transition-colors relative ${isActive ? 'bg-primary/10' : ''}`}>
                  <item.icon className="w-5 h-5" />
                  {item.badge > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-white text-xs font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-in zoom-in ${item.badgeColor || 'bg-rose-500'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] leading-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

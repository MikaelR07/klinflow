/**
 * TopTabs — Alibaba-style persistent top navigation tabs
 * Shared between MarketplaceHome and HygeneX pages.
 */
import { useNavigate } from 'react-router-dom';

const TABS = [
  { label: 'AI Mode', path: '/hygenex' },
  { label: 'Materials', path: '/' },
  { label: 'Aggregators', path: '/aggregators' },
  { label: 'Chatroom', path: '/chatroom' },
];

export default function TopTabs({ active }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 pt-2 pb-1">
      {TABS.map((tab) => {
        const isActive = active === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`text-xs font-bold uppercase tracking-widest transition-all duration-300 active:opacity-60 pb-0.5 text-slate-900 dark:text-white ${
              isActive ? 'scale-100' : 'scale-90 opacity-60'
            }`}
          >
            <span className={isActive ? 'border-b-2 border-slate-900 dark:border-white pb-0.5' : ''}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import { Users, Target, Receipt } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ContractsTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'group', path: '/group-rfqs', label: 'Group', icon: Users },
    { id: 'individual', path: '/individual-rfqs', label: 'Individual', icon: Target },
    { id: 'proposals', path: '/my-rfq-offers', label: 'My Proposals', icon: Receipt },
  ];

  return (
    <div className="flex px-4 pb-2  gap-1.5 w-full">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-all border relative ${
              isActive
                ? 'bg-primary text-white border-transparent shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

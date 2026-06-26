import React from 'react';
import { 
  Truck, 
  UserCircle, 
  Store, 
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Scale
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNavigate } from 'react-router-dom';

export default function IntakeChannelSelector() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const channels = [
    {
      id: 'fleet',
      title: 'Fleet Agent',
      description: 'Employed agents arriving with company vehicles. Requires a 4-digit PIN to pull their verified manifest.',
      icon: <Truck className="w-8 h-8" />,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-500',
      features: ['PIN Verification', 'AI Verified Manifest', 'No Direct Payment'],
      route: '/operations/intake/fleet',
    },
    {
      id: 'individual',
      title: 'Individual Klinflow Agent',
      description: 'Independent collectors who use the Klinflow app. Lookup via Klin-ID to access their warehouse logs and negotiate price.',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-500',
      features: ['Klin-ID Lookup', 'Price Negotiation', 'Direct M-PESA Payout'],
      route: '/operations/intake/individual',
    },
    {
      id: 'walkin',
      title: 'Walk-in Seller / Resident',
      description: 'Anyone walking through the gate with materials. Requires manual entry of materials, weights, and grades.',
      icon: <Store className="w-8 h-8" />,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      textColor: 'text-amber-500',
      features: ['Quick Registration', 'Full Manual Entry', 'GFP Points Awarded'],
      route: '/operations/intake/walkin',
    }
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Scale className="font-medium w-8 h-8 text-slate-400" />
        </div>
        <h1 className={`text-3xl font-semibold tracking-tight mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Select Intake Channel</h1>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          How is this material arriving at the Hub? Choose the appropriate channel to load the correct verification and payment workflow.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <div 
            key={channel.id}
            onClick={() => navigate(channel.route)}
            className={`group cursor-pointer p-6 md:p-8 rounded-[2rem] border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
              isDarkMode 
                ? 'bg-slate-900 border-white/5 hover:border-white/20 hover:shadow-black/50' 
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-slate-200/50'
            }`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${channel.lightColor} ${channel.textColor}`}>
              {channel.icon}
            </div>
            
            <h2 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{channel.title}</h2>
            <p className={`text-sm mb-6 min-h-[60px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {channel.description}
            </p>

            <div className="space-y-3 mb-8">
              {channel.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${channel.textColor}`} />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                </div>
              ))}
            </div>

            <div className={`w-full py-4 rounded-xl font-medium text-sm text-center flex items-center justify-center gap-2 transition-all ${
              isDarkMode 
                ? 'bg-slate-800 text-white group-hover:bg-white group-hover:text-slate-900' 
                : 'bg-slate-50 text-slate-900 group-hover:bg-slate-900 group-hover:text-white'
            }`}>
              Select Channel <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

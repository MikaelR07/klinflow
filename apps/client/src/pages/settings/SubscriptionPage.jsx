import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Crown, Zap, Shield, Sparkles, Star } from 'lucide-react';
import { useAuthStore } from '@cleanflow/core';
import { SUBSCRIPTION_TIERS } from '@cleanflow/core/src/data/mockData';
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { profile, updateSubscription } = useAuthStore();
  
  const currentTier = profile?.subscriptionTier || 'lite';

  const handleUpgrade = (tierId) => {
    navigate(`/settings/subscriptions/${tierId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 px-2">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Your Membership</h1>
      </div>

      {/* Hero Card (Platform Value Focus) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">CleanFlow Platform Access</p>
          <h2 className="text-2xl font-semibold mb-4 tracking-tight">One Subscription. <br/> Access Every Fleet.</h2>
          <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full w-fit border border-white/10 uppercase tracking-widest">
            <Zap className="w-3 h-3 fill-amber-300 text-amber-300" /> Earn massive multipliers on points and rewards!
          </div>
        </div>
        <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {Object.values(SUBSCRIPTION_TIERS).map((tier) => {
          const isCurrent = tier.id === currentTier;
          const isImpact = tier.id !== 'lite';
          
          return (
            <div 
              key={tier.id}
              className={`card p-6 relative transition-all border-2 ${
                isCurrent ? 'border-primary ring-4 ring-primary/5' : 'border-transparent'
              }`}
            >
              {isImpact && (
                <div className="absolute top-0 right-6 -translate-y-1/2 bg-amber-400 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg uppercase tracking-widest flex items-center gap-1 ring-4 ring-white dark:ring-slate-900">
                  <Star className="w-2.5 h-2.5 fill-white" /> {tier.impactTag}
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    {tier.label}
                    {tier.id === 'premium' && <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </h3>
                  <p className="text-xs font-semibold text-primary uppercase tracking-widest">
                    {tier.rewardMult}x Point Boost
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-slate-900 dark:text-white leading-none">
                    {tier.price === 0 ? 'Free' : `KSh ${tier.price.toLocaleString()}`}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">Per month</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier.id)}
                disabled={isCurrent}
                className={`w-full py-4 rounded-2xl font-semibold text-sm uppercase tracking-widest transition-all ${
                  isCurrent 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default' 
                    : 'bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isCurrent ? 'Current Plan Details' : `View ${tier.label} Details`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Community Impact Footer */}
      <div className="card p-5 bg-slate-50 dark:bg-slate-800/50 border-dashed border-2 border-slate-200 dark:border-slate-700">
        <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> The CleanFlow Promise
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed uppercase tracking-tight">
          CleanFlow is a platform that connects you to independent waste businesses. Your subscription fee helps us build better logistics tools, 
          verify more agents, and provide 24/7 support. 100% of your material value and logistics fees go directly to the service providers.
        </p>
      </div>
      <p className="text-center text-xs text-slate-400 font-semibold uppercase tracking-widest leading-relaxed px-6 py-6">
        Prices include all waste disposal fees. You can change or cancel your plan at any time.
      </p>
    </div>
  );
}

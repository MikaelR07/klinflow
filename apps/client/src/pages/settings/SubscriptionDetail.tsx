import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, Zap, 
  Crown, Star, Globe2, CreditCard, Clock, 
  Info, TrendingUp, Building2
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { SUBSCRIPTION_TIERS } from '@klinflow/core/data/mockData';
import { toast } from 'sonner';

export default function SubscriptionDetail() {
  const { tierId } = useParams();
  const navigate = useNavigate();
  const authStore = useAuthStore() as any;
  const { profile, updateSubscription } = authStore;
  
  const tier = (SUBSCRIPTION_TIERS as any)[tierId || 'lite'];
  const isCurrent = (profile?.subscriptionTier === tierId || profile?.subscriptionTier === tierId);

  if (!tier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="font-semibold text-slate-400 capitalize tracking-widest">Plan not found</p>
      </div>
    );
  }

  const handleAction = async () => {
    if (isCurrent) return;
    try {
      await updateSubscription(tierId);
      toast.success(`Welcome to ${tier.label}!`, {
        description: "Your platform benefits are now active."
      });
      navigate('/');
    } catch (err) {
      toast.error("Upgrade failed. Please try again.");
    }
  };

  const expandedDetails = {
    lite: {
      tagline: "Pay only for what you use.",
      longDesc: "The Basic plan is perfect for occasional recyclers who want access to the Klinflow marketplace without a monthly commitment. You pay a small platform fee per booking to help us keep the network running.",
      points: [
        "Verified Fleet Marketplace Access",
        "Standard GFP Rewards (1x)",
        "Mobile App Support",
        "Secure M-Pesa Payments",
        "Public Recycling Maps"
      ]
    },
    standard: {
      tagline: "The Smart Choice for Regular Recyclers.",
      longDesc: "Klinflow Plus is our most popular plan. By removing the platform fee, it practically pays for itself if you book more than twice a month. Plus, you get official Impact Certificates to track your environmental contribution.",
      points: [
        "Unlimited Free Platform Fees",
        "2x GFP Reward Multiplier",
        "Monthly PDF Impact Certificates",
        "Priority Support Response",
        "Early Access to Partner Deals",
        "Verified Payment Protection"
      ]
    },
    premium: {
      tagline: "Elite Impact. Total Protection.",
      longDesc: "Klinflow Elite is designed for those who want to lead the change. Not only do you get the highest reward multipliers, but you also get property management and our exclusive Verified Payment Protection.",
      points: [
        "Everything in Plus, and more",
        "3.5x Elite Points Multiplier",
        "Link & Manage up to 3 Properties",
        "Verified Payment Protection",
        "Elite Resident Profile Badge",
        "Direct Phone Support Line",
        "VIP Access to Cleanup Events"
      ]
    }
  };

  const details = (expandedDetails as any)[tierId || 'lite'] || expandedDetails.lite;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 pb-32 px-2">
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <h1 className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Plan Details</h1>
      </div>

      {/* Hero */}
      <div className={`mx-4 rounded-3xl p-8 relative overflow-hidden shadow-2xl ${
        tierId === 'premium' ? 'bg-slate-900 text-white' : 
        tierId === 'standard' ? 'bg-primary text-white' : 
        'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800'
      }`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold capitalize tracking-widest opacity-60">{tier.impactTag}</span>
            {tierId === 'premium' && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
          </div>
          <h2 className="text-4xl font-semibold tracking-tight mb-4">{tier.label}</h2>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold">{tier.price === 0 ? 'Free' : `KSh ${tier.price.toLocaleString()}`}</span>
            <span className="text-xs font-semibold opacity-60 capitalize tracking-tighter">/ Month</span>
          </div>
        </div>
        
        {/* Background Icons */}
        <div className="absolute top-0 right-0 p-8 opacity-10">
          {tierId === 'premium' ? <Crown className="w-32 h-32" /> : tierId === 'standard' ? <TrendingUp className="w-32 h-32" /> : <Globe2 className="w-32 h-32" />}
        </div>
      </div>

      <div className="mx-4 mt-6 space-y-6">
        {/* Tagline & Desc */}
        <div className="px-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight mb-2">{details.tagline}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {details.longDesc}
          </p>
        </div>

        {/* Benefits List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
          <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-2">What's Included</p>
          <div className="space-y-4">
            {details.points.map((point: string, i: number) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-0.5">
                  <CheckCircle2 className={`w-5 h-5 ${tierId === 'lite' ? 'text-slate-300' : 'text-emerald-500'}`} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform ROI Notice */}
        {tierId !== 'lite' && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 capitalize tracking-widest">Platform ROI</h4>
            </div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200/80 leading-relaxed">
              By waiving the platform fee and boosting your GFP rewards, this plan pays for itself if you recycle {tierId === 'standard' ? '40kg' : '100kg'} of plastic monthly.
            </p>
          </div>
        )}

        {/* Payment Protection Block */}
        {tierId === 'premium' && (
          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-500/20 rounded-3xl p-6 flex items-center gap-4">
            <ShieldCheck className="w-8 h-8 text-indigo-500" />
            <div>
              <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 capitalize tracking-widest mb-1">Verified Payment Protection</h4>
              <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-200/80 capitalize tracking-tight">Your funds and recycling value are protected by the platform at all times until you authorize release.</p>
            </div>
          </div>
        )}
      </div>

      {/* CTA Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 z-50">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAction}
          disabled={isCurrent}
          className={`w-full py-5 rounded-2xl font-semibold text-sm shadow-2xl transition-all flex items-center justify-center gap-3 ${
            isCurrent 
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-default shadow-none' 
              : 'bg-primary text-white shadow-primary/40'
          }`}
        >
          {isCurrent ? (
            <><CheckCircle2 className="w-5 h-5" /> Active Subscription</>
          ) : (
            <><CreditCard className="w-5 h-5" /> {tierId === 'lite' ? 'Downgrade to Basic' : `Subscribe to ${tier.label}`}</>
          )}
        </motion.button>
      </div>
    </div>
  );
}

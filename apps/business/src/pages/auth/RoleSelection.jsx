import { useNavigate } from 'react-router-dom';
import { Package, Factory, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleSelection = (role) => {
    navigate(`/register?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col p-6 animate-fade-in">
      {/* Header */}
      <button 
        onClick={() => navigate(-1)} 
        className="p-2 -ml-2 w-fit rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="mb-10">
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight leading-none mb-3">
          How do you want to <br />
          <span className="text-primary italic">use CleanFlow?</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Choose the identity that best describes your business goals.
        </p>
      </div>

      {/* Cards Container */}
      <div className="flex-1 flex flex-col gap-6 justify-center pb-20">
        {/* Weaver Card */}
        <button
          onClick={() => handleSelection('weaver')}
          className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] text-left hover:border-primary transition-all active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-primary/10 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <Package className="w-24 h-24 text-primary" />
          </div>
          
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
            <Package className="w-7 h-7" />
          </div>
          
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">I am a Weaver</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[80%]">
            I collect, sort, and aggregate verified waste to sell to industrial buyers in bulk.
          </p>
          
          <div className="mt-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-primary">
            Start Selling <ArrowRight className="w-3 h-3" />
          </div>
        </button>

        {/* Recycler Card */}
        <button
          onClick={() => handleSelection('recycler')}
          className="group relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] text-left hover:border-secondary transition-all active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-secondary/10 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
            <Factory className="w-24 h-24 text-secondary" />
          </div>
          
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-6">
            <Factory className="w-7 h-7" />
          </div>
          
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">I am a Buyer</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[80%]">
            I want to source high-quality, verified recyclable materials for my manufacturing plant.
          </p>
          
          <div className="mt-6 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-secondary">
            Source Material <ArrowRight className="w-3 h-3" />
          </div>
        </button>
      </div>

      {/* Trust Footer */}
      <div className="flex items-center justify-center gap-2 py-6 opacity-40 grayscale">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[10px] font-semibold uppercase tracking-widest">Escrow-Backed Trading Network</span>
      </div>
    </div>
  );
}

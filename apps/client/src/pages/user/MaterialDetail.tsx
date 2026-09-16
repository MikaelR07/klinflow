/**
 * MaterialDetail — Premium material intelligence & selling page.
 * Designed with a fintech/commodity-marketplace aesthetic.
 * Visual hierarchy: What is this? → What is it worth? → How do I prepare? → Sell it.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  Check,
  X,
  Lightbulb,
  Recycle,
  ShieldCheck,
  Zap,
  DollarSign,
  Layers,
  Share,
  Bookmark,
  Activity,
  ArrowRight,
  TrendingUp,
  Info,
  MapPin,
  TrendingDown,
  Package
} from 'lucide-react';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';

/* ────────────────────────────────────────────────────────────────────────
 * MATERIAL INTELLIGENCE DATABASE
 * Professional, industry-accurate content for each material category.
 * ──────────────────────────────────────────────────────────────────────── */
const MATERIAL_KNOWLEDGE: Record<string, {
  title: string;
  subtitle: string;
  icon: string;
  heroImage: string;
  demand: 'High' | 'Medium' | 'Very High' | 'Variable';
  whyCollectorsBuy: string;
  valueProps: string[];
  doList: string[];
  dontList: string[];
  proTip: string;
}> = {
 plastic: {
  title: 'Plastic Bottles & Containers',
  subtitle: 'Water Bottles, Juice Bottles, Containers & More',
  icon: '♻️',
  heroImage: '/material-categories/plastic.webp',

  demand: 'High',

  whyCollectorsBuy:
    'Plastic bottles and containers can be cleaned, sorted and processed into new plastic products. Collectors look for good-quality plastic because clean and well-sorted material is easier to process and usually gets a better offer.',

  valueProps: [
    'Regularly collected',
    'Easy to identify and sort',
    'Clean plastic has better value',
    'Can be processed into new products',
  ],

  doList: [
    'Empty bottles and containers completely',
    'Keep PET bottles separate from other plastics',
    'Keep your plastic clean and dry',
    'Flatten bottles to save space in your sack',
  ],

  dontList: [
    'Mix different plastic types when they can be separated',
    'Include bottles with food or chemical residue',
    'Sell plastic that is wet, muddy or mouldy',
    'Mix plastic with general rubbish',
  ],

  proTip:
    'Keep your plastic clean, dry and sorted. If you collect many bottles, separate clear bottles from coloured ones and keep different plastic types apart. Better sorting makes your material easier for collectors to handle and can improve the offer you receive.',
},
  paper: {
  title: 'Paper',
  subtitle: 'Cartons, Boxes, Office Paper & Newspapers',
  icon: '📦',
  heroImage: '/material-categories/boxes.webp',

  demand: 'Medium',

  whyCollectorsBuy:
    'Old cartons, boxes and paper can be turned into new paper products and packaging. Collectors buy clean, dry paper because it can be sorted and processed more easily.',

  valueProps: [
    'Collected in many areas',
    'Easy to bundle and store',
    'Clean cardboard has good demand',
    'Can be turned into new paper products',
  ],

  doList: [
    'Flatten cartons and cardboard boxes',
    'Keep paper dry and away from rain',
    'Bundle similar paper types together',
    'Remove excess plastic and other materials',
  ],

  dontList: [
    'Mix paper with food or oily waste',
    'Leave your paper stock in the rain',
    'Mix heavily wet or mouldy paper with good stock',
    'Add plastic bags and other rubbish',
  ],

  proTip:
    'Keep your paper and cartons somewhere dry. Rain can quickly reduce the quality of paper. Flattening boxes also saves space, so you can collect more before making a trip to the collector.',
},
metal: {
  title: 'Scrap Metal',
  subtitle: 'Aluminium Cans, Steel, Copper & Other Metal',
  icon: '🥫',
  heroImage: '/material-categories/metal.webp',

  demand: 'High',

  whyCollectorsBuy:
    'Metal can be recycled and used to make new products. Different metals have different values, so separating aluminium, steel, copper and other metals can help you get a better offer.',

  valueProps: [
    'Strong collector demand',
    'Different metals have different values',
    'Easy to separate with basic sorting',
    'Can be recycled into new products',
  ],

  doList: [
    'Separate aluminium from steel where possible',
    'Keep different metals in separate groups',
    'Empty food and drink cans before storing',
    'Keep valuable copper items separate',
  ],

  dontList: [
    'Mix hazardous containers with ordinary scrap',
    'Include leaking or damaged batteries',
    'Mix electronic waste into ordinary scrap',
    'Burn materials to remove plastic or insulation',
  ],

  proTip:
    'A simple magnet can help you sort metal. If the magnet sticks, it is usually steel or another magnetic metal. Aluminium does not attract a magnet. Keep higher-value metals separate instead of selling everything as one mixed pile.',
},
 ewaste: {
  title: 'Electronic Waste',
  subtitle: 'Phones, Computers, Cables, TVs & Appliances',
  icon: '📱',
  heroImage: '/material-categories/E-waste.webp',

  demand: 'Very High',

  whyCollectorsBuy:
    'Old electronics contain materials that can be recovered and reused. Some devices can also be repaired or reused instead of being broken down. This makes phones, computers, cables and other electronics valuable to specialised collectors.',

  valueProps: [
    'High-value materials inside',
    'Strong demand from specialised collectors',
    'Working devices may be worth more',
    'Parts and materials can be recovered',
  ],

  doList: [
    'Keep electronics dry and protected',
    'Separate phones, computers and cables',
    'Keep chargers and accessories together',
    'Remove your personal information from working devices',
  ],

  dontList: [
    'Do not burn electronics or cables',
    'Do not break open batteries',
    'Do not mix e-waste with ordinary scrap',
    'Do not dismantle electronics unless you know how to do it safely',
  ],

  proTip:
    'Before selling an old phone, computer or appliance as scrap, check whether it still works. A working or repairable device may be worth more than its scrap value. Keep the charger or other accessories with it if you have them.',
},
  textile: {
  title: 'Textiles & Clothes',
  subtitle: 'Old Clothes, Fabrics & Textiles',
  icon: '👕',
  heroImage: '/material-categories/textile.webp',

  demand: 'Medium',

  whyCollectorsBuy:
    'Textiles can be resold, repurposed, or recycled into new fabrics and materials. Clean and reusable clothes are in higher demand.',

  valueProps: [
    'Reusable clothes have good value',
    'Can be recycled into rags or new fabric',
    'Keeps textiles out of landfills',
  ],

  doList: [
    'Wash and dry clothes before selling',
    'Keep reusable clothes separate from damaged ones',
    'Pack textiles in clean, dry bags',
  ],

  dontList: [
    'Sell wet or mouldy clothes',
    'Mix textiles with other types of waste',
    'Include heavily soiled fabrics',
  ],

  proTip:
    'Separate clothes that can still be worn from those that are torn or stained. Reusable clothes often fetch a better price than scrap textiles.',
},
  glass: {
  title: 'Glass Bottles & Jars',
  subtitle: 'Drink Bottles, Food Jars & Container Glass',
  icon: '🍾',
  heroImage: '/material-categories/glasses.webp',

  demand: 'Medium',

  whyCollectorsBuy:
    'Glass bottles and jars can be cleaned, sorted and used to make new glass products. Collectors prefer bottles that are clean, separated and easy to handle.',

  valueProps: [
    'Can be recycled again and again',
    'Common bottles and jars are easy to identify',
    'Clean glass is easier to process',
    'Sorted colours can have better value',
  ],

  doList: [
    'Empty bottles and jars before storing',
    'Rinse out leftover food or drinks',
    'Separate glass by colour where possible',
    'Handle and store bottles carefully',
  ],

  dontList: [
    'Mix glass with ceramics or mirrors',
    'Include window glass unless specifically requested',
    'Mix broken glass with other materials',
    'Put dangerous or sharp glass where people can get injured',
  ],

  proTip:
    'If your collector accepts colour-sorted glass, keep clear, green and brown bottles in separate groups. Most importantly, handle broken glass carefully and use a strong container or sack that will not tear.',
},
};

const FALLBACK = {
  title: 'Recyclable Material',
  subtitle: 'Material that can be collected, sorted and sold',

  icon: '♻️',
  heroImage: '/material-categories/recyclables.webp',

  demand: 'Variable',

  whyCollectorsBuy:
    'Collectors buy materials that can be sorted, processed and sold again. The cleaner and better sorted your material is, the easier it is to handle and the better your offer may be.',

  valueProps: [
    'Can be collected and sold',
    'Sorting can improve value',
    'Clean and dry is better',
    'Keep different materials separate',
  ],

  doList: [
    'Sort materials by type',
    'Keep your materials clean and dry',
    'Store materials safely',
    'Ask your collector what grades they accept',
  ],

  dontList: [
    'Mix different materials unnecessarily',
    'Include hazardous waste',
    'Store recyclable material in wet conditions',
    'Mix valuable material with general rubbish',
  ],

  proTip:
    'Before you collect a large amount, find out what your collector is currently buying. Different collectors may accept different materials and grades. Knowing what has demand can help you spend your time collecting what is worth selling.',
};

/* ── GRADE DEFINITIONS ── */
const GRADES = [
  {
    key: 'premium',
    label: 'Premium',
    desc: 'Clean, dry and well sorted',
  },
  {
    key: 'standard',
    label: 'Good',
    desc: 'Mostly clean with minor contamination',
  },
  {
    key: 'mixed',
    label: 'Mixed',
    desc: 'Different types or some contamination',
  },
  {
    key: 'low',
    label: 'Low Grade',
    desc: 'Heavy contamination or poor condition',
  },
];

/* ── ANIMATIONS ── */
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

/* ══════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ══════════════════════════════════════════════════════════════════════════ */
export default function MaterialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { categories, fetchCategories } = useServiceStore();
  const { fetchPrices, getPriceForMaterial } = usePriceStore();
  const role = useAuthStore((s) => s.role);

  const [isScrolled, setIsScrolled] = useState(false);
  const [liveStats, setLiveStats] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
    fetchPrices();
    
    // Fetch live market stats for this material
    const fetchLiveStats = async () => {
      if (!slug) return;
      try {
        const { data, error } = await supabase.rpc('get_material_stats', { material_name_param: slug });
        if (!error && data) {
          setLiveStats(data);
        } else if (error) {
          console.error('Failed to fetch material stats:', error.message, error.details, error.hint, error);
        }
      } catch (err) {
        console.error('Failed to fetch material stats exception:', err);
      }
    };
    fetchLiveStats();

    const onScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  // Resolve material data
  const dbCat = categories.find(c => (c.slug || '').toLowerCase() === slug?.toLowerCase() || c.id === slug);
  const key = slug ? Object.keys(MATERIAL_KNOWLEDGE).find(k => {
    const s = slug.toLowerCase();
    const l = (dbCat?.label || (dbCat as any)?.name || '').toLowerCase();
    if (k === 'textile' && (s.includes('clothes') || l.includes('clothes') || s.includes('textile') || l.includes('textile'))) return true;
    if (k === 'paper' && (s.includes('cardboard') || l.includes('cardboard') || s.includes('box') || l.includes('box'))) return true;
    if (k === 'ewaste' && (s.includes('e-waste') || l.includes('e-waste') || s.includes('electronic') || l.includes('electronic'))) return true;
    if (k === 'organic' && (s.includes('food') || l.includes('food'))) return true;
    if (k === 'bulky' && (s.includes('appliance') || l.includes('appliance') || s.includes('sofa') || l.includes('sofa') || s.includes('furniture') || l.includes('furniture'))) return true;
    return s.includes(k) || l.includes(k);
  }) || '' : '';
  const mat = MATERIAL_KNOWLEDGE[key] || FALLBACK;
  const title = dbCat?.label || mat.title;
  const livePrice = getPriceForMaterial(slug || '');

  // Use Live Stats if available, fallback to mock/admin defaults
  const displayPrice = liveStats ? liveStats.vwap : livePrice;
  const displayDemand = liveStats ? liveStats.demand : 'Calculating...';
  const displayTrend = liveStats ? liveStats.change_30d : '--%';
  const isTrendUp = displayTrend.includes('+');
  const isTrendDown = displayTrend.includes('-');
  
  // Dynamic Actionable Advice based on Real Data
  const getSellingAdvice = () => {
    if (displayDemand === 'Critical') return "Buyers are actively sourcing this. Schedule a pickup now to secure premium rates.";
    if (displayDemand === 'High') return "Strong market demand today. Great time to sell your stored volume.";
    if (isTrendDown) return "Market prices are slightly down. Consider holding if you have storage, or liquidate now before further drops.";
    return "Stable market conditions. Standard rates apply for clean, sorted material.";
  };

  const isSeller = role === 'seller';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0c10] pb-10">

      {/* ═══════════ FIXED TOP NAV ═══════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0f1117]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-1.5 py-3 flex items-center justify-between mt-[env(safe-area-inset-top)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 active:scale-95 transition-all hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <span className="text-[13px] font-bold text-slate-800 dark:text-white tracking-widest uppercase">Material Details</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              <Share className="w-4.5 h-4.5" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              <Bookmark className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed nav */}
      <div className="h-[calc(env(safe-area-inset-top)+56px)]" />

      {/* ═══════════ HERO SECTION ═══════════ */}
      <div className="max-w-7xl mx-auto px-1.5 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl mx-auto">
          
          {/* Image Card (Restored Style) */}
          <div className="relative h-[270px] md:h-[320px] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-sm">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${mat.heroImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
            
            {/* Category tag overlaid on image */}
            <div className="absolute top-3 left-3">
              <div className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-white backdrop-blur-md shadow-sm flex items-center gap-1.5 border border-white/20 dark:border-slate-700/50">
                <span>{mat.icon}</span> {mat.title.split(' ')[0]}
              </div>
            </div>
          </div>

          {/* Unified Material Info Card */}
          <div className="flex flex-col justify-center">
            <div className="bg-white dark:bg-[#12141c] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm h-full flex flex-col max-h-[320px] overflow-hidden">
              
              {/* Header Section */}
              <div className="p-5 md:p-6 pb-0 md:pb-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h1 className="text-[18px] md:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                    {title}
                  </h1>
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0 ${
                    displayDemand === 'Critical' || displayDemand === 'High'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                    : displayDemand === 'Calculating...'
                    ? 'text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                    : 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20'
                  }`}>
                    {displayDemand} {displayDemand !== 'Calculating...' ? 'Demand' : ''}
                  </div>
                </div>
                <p className="text-[12px] md:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  {mat.subtitle}
                </p>
              </div>

              {/* Market Snapshot in Top Card */}
              <div className="mt-auto p-4 md:p-6 pt-2 md:pt-2">
                <div className="bg-slate-200 dark:bg-slate-800/60 rounded-xl p-1.5 md:p-2 mb-3 shadow-inner">
                  <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                    {/* Metric 1 */}
                    <div className="bg-white dark:bg-[#12141c] rounded-lg p-2.5 md:p-3 shadow-sm flex flex-col justify-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Current Price</p>
                      <p className="text-[13px] md:text-[15px] font-black text-slate-900 dark:text-white leading-none mb-1">
                        {displayPrice > 0 ? `KSh ${displayPrice}` : 'Varies'}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-500 leading-tight truncate">VWAP Rate</p>
                    </div>
                    {/* Metric 2 */}
                    <div className="bg-white dark:bg-[#12141c] rounded-lg p-2.5 md:p-3 shadow-sm flex flex-col justify-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Demand Level</p>
                      <p className="text-[13px] md:text-[15px] font-black text-slate-900 dark:text-white leading-none mb-1 truncate">{displayDemand}</p>
                      <p className="text-[9px] font-semibold text-slate-500 leading-tight truncate">Buyer activity</p>
                    </div>
                    {/* Metric 3 */}
                    <div className="bg-white dark:bg-[#12141c] rounded-lg p-2.5 md:p-3 shadow-sm flex flex-col justify-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">30-Day Trend</p>
                      <p className={`text-[13px] md:text-[15px] font-black ${isTrendUp ? 'text-emerald-600 dark:text-emerald-500' : isTrendDown ? 'text-rose-600 dark:text-rose-500' : 'text-slate-600 dark:text-slate-400'} leading-none mb-1`}>
                        {isTrendUp ? '▲' : isTrendDown ? '▼' : ''} {displayTrend}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-500 leading-tight truncate">Past 30 days</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Actionable Advice */}
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3 flex gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium leading-snug">
                    {getSellingAdvice()}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ═══════════ BODY CONTENT ═══════════ */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-7xl mx-auto px-1.5 pt-6 md:pt-10 space-y-12">
        
        {/* Main Grid Layout for Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* LEFT COLUMN (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* ── WHY IT'S WORTH COLLECTING ── */}
            <motion.div variants={fadeUp}>
              <div className="bg-slate-200 dark:bg-slate-800/50 rounded-2xl p-4 md:p-5">
                <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  Why it's worth collecting
                </h2>
                <p className="text-[13px] md:text-[13.5px] text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {mat.whyCollectorsBuy}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mat.valueProps.map((vp, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white dark:bg-[#12141c] border border-slate-100 dark:border-slate-700/50 rounded-xl p-3.5 shadow-sm">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="pt-0.5">
                        <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-snug">{vp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── MATERIAL QUALITY (Horizontal) ── */}
            <motion.div variants={fadeUp}>
              <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight mb-2">
                What gets the better offer?
              </h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-5">
                Condition and sorting affect what collectors may offer you.
              </p>
              
              <div className="w-full overflow-x-auto pb-4 no-scrollbar">
                <div className="flex min-w-[500px]">
                  {GRADES.map((g, i) => (
                    <div key={g.key} className="flex-1 relative">
                      {/* Connection Line */}
                      {i < GRADES.length - 1 && (
                        <div className="absolute top-2.5 left-[50%] w-full h-[2px] bg-slate-200 dark:bg-slate-800" />
                      )}
                      
                      <div className="flex flex-col items-center text-center relative z-10 px-2">
                        {/* Dot */}
                        <div className={`w-5 h-5 rounded-full border-4 border-white dark:border-[#0a0c10] flex items-center justify-center mb-3 shadow-sm ${
                          i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-emerald-400' : i === 2 ? 'bg-amber-400' : 'bg-slate-400'
                        }`} />
                        
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">
                          {g.label}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 leading-tight max-w-[100px]">
                          {g.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* ── PREPARE YOUR MATERIAL ── */}
            <motion.div variants={fadeUp}>
              <div className="bg-slate-200 dark:bg-slate-800/50 rounded-2xl p-4 md:p-5">
                <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight mb-4">
                  Prepare your material
                </h2>
                
                <div className="flex flex-col gap-3">
                  {/* DO Box */}
                  <div className="bg-white dark:bg-[#12141c] border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 md:p-5 shadow-sm">
                    <h3 className="text-[11px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      Do
                    </h3>
                    <ul className="space-y-2.5">
                      {mat.doList.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-[13px] font-medium text-slate-800 dark:text-slate-300 leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AVOID Box */}
                  <div className="bg-white dark:bg-[#12141c] border border-slate-100 dark:border-slate-700/50 rounded-xl p-4 md:p-5 shadow-sm">
                    <h3 className="text-[11px] font-black text-amber-800 dark:text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      Avoid
                    </h3>
                    <ul className="space-y-2.5">
                      {mat.dontList.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <X className="w-4 h-4 text-amber-600 dark:text-amber-600 shrink-0 mt-0.5" />
                          <span className="text-[13px] font-medium text-slate-800 dark:text-slate-400 leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── COLLECTOR TIP ── */}
            <motion.div variants={fadeUp}>
              <div className="bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6">
                <h3 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="text-amber-500 text-base">💡</span> Collector tip
                </h3>
                <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {mat.proTip}
                </p>
              </div>
            </motion.div>

            {/* ── WHERE THE MATERIAL GOES ── */}
            <motion.div variants={fadeUp}>
              <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">
                Where this material goes
              </h2>
              
              {/* Minimal horizontal flow */}
              <div className="flex items-center justify-between text-center px-2 mb-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Package className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /></div>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Collection</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /></div>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Sorting</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" /></div>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Processing</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center"><Recycle className="w-3.5 h-3.5 text-emerald-600" /></div>
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider">Reuse</span>
                </div>
              </div>
              
              <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                Your collected {title.toLowerCase()} can be sorted, processed and used to make new products.
              </p>
            </motion.div>

          </div>
        </div>
      </motion.div>

      {/* ═══════════ STICKY BOTTOM CTA ═══════════ */}
      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0a0c10]/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/80 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-7xl mx-auto px-1.5 py-3 md:py-4 flex items-center justify-between gap-2">
          
          {/* Material Thumbnail + Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-cover bg-center shrink-0 border border-slate-200 dark:border-slate-700"
              style={{ backgroundImage: `url(${mat.heroImage})` }}
            />
            <div className="flex flex-col min-w-0">
              <p className="text-[12px] md:text-[14px] font-bold text-slate-900 dark:text-white truncate">
                {title}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-black text-slate-700 dark:text-slate-300">
                  {displayPrice > 0 ? `KSh ${displayPrice}/kg` : 'Price varies'}
                </span>
                <span className={`text-[10px] font-bold hidden sm:inline-block ${isTrendUp ? 'text-emerald-600' : isTrendDown ? 'text-rose-600' : 'text-slate-500'}`}>
                  {isTrendUp ? '▲' : isTrendDown ? '▼' : ''} {displayTrend}
                </span>
              </div>
            </div>
          </div>
          
          {/* CTA Button */}
          <button
            onClick={() => navigate(isSeller ? `/post-trade?material=${slug}` : '/book-pickup')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 md:px-8 py-3.5 md:py-4 rounded-xl text-[12px] md:text-[13px] font-bold tracking-widest active:scale-95 transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-600/20"
          >
            {isSeller ? 'Sell this material' : 'Book a Pickup'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}


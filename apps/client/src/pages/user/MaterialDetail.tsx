/**
 * MaterialDetail — Premium material intelligence & selling page.
 * Designed with a fintech/commodity-marketplace aesthetic.
 * Visual hierarchy: What is this? → What is it worth? → How do I prepare? → Sell it.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
organic: {
  title: 'Organic & Food Waste',
  subtitle: 'Food Scraps, Vegetable Peels & Green Waste',
  icon: '🍎',
  heroImage: '/material-categories/organic-waste.webp',
  
  demand: 'Medium',
  
  whyCollectorsBuy: 
    'Organic waste is collected to be composted into nutrient-rich fertiliser or processed into clean biogas energy. Proper separation prevents it from contaminating other recyclables.',
  
  valueProps: [
    'Can be turned into compost or biogas',
    'Keeps other recyclables clean',
    'Reduces harmful landfill gases',
    'High demand from commercial composting facilities',
  ],
  
  doList: [
    'Keep organic waste in a dedicated bin',
    'Include vegetable peels, fruit scraps, and coffee grounds',
    'Drain excess liquid before disposal',
    'Include garden waste like leaves and grass',
  ],
  
  dontList: [
    'Mix with plastic bags or wrappers',
    'Include glass or metal items',
    'Add hazardous chemicals or pet waste',
    'Let it sit for too long to avoid pests and strong odours',
  ],
  
  proTip: 
    'Use a compostable bag or line your bin with newspaper to keep it clean. Emptying your organic waste bin regularly helps prevent bad smells and makes it easier for collectors to handle.',
},
mixed: {
  title: 'Mixed Recyclables',
  subtitle: 'Unsorted Paper, Plastic, Metal & Glass',
  icon: '♻️',
  heroImage: '/material-categories/recyclables.webp',
  
  demand: 'Variable',
  
  whyCollectorsBuy: 
    'Mixed recyclables are bought by facilities that have automated or manual sorting lines. While sorting it yourself gets you the best price, mixed recycling is highly convenient and ensures materials are recovered rather than thrown away.',
  
  valueProps: [
    'Very convenient and saves you time',
    'Accepts multiple material types in one go',
    'Keeps waste out of landfills',
    'Processed by specialised sorting facilities',
  ],
  
  doList: [
    'Ensure all items are completely empty and dry',
    'Rinse food containers before mixing them in',
    'Flatten cardboard and crush cans to save space',
    'Place everything loosely in the collection bag/bin',
  ],
  
  dontList: [
    'Include organic waste or food scraps',
    'Put items inside tied plastic bags (keep them loose)',
    'Include hazardous waste, batteries, or electronics',
    'Mix heavily soiled items that can contaminate clean ones',
  ],
  
  proTip: 
    'The golden rule for mixed recyclables is keeping everything clean and dry. A single half-full soda bottle can leak and ruin paper and cardboard in the same bin, making them impossible to recycle.',
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
        const { data, error } = await (supabase.rpc as any)('get_material_stats', { material_name_param: slug });
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
  
  

  const isSeller = role === 'seller';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-36 lg:pb-24 transition-colors">

      {/* ═══════════ FIXED TOP NAV ═══════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3 flex items-center justify-between relative">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Material Details
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
              Know what buyers want
            </p>
          </div>
          <div className="w-10 h-10" />
        </div>
      </div>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <div className="max-w-5xl mx-auto px-3 pt-[calc(env(safe-area-inset-top,1rem)+4.75rem)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-stretch">

          {/* Hero Image Card */}
          <div className="md:col-span-5 relative h-[210px] md:h-auto md:min-h-[240px] w-full overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
              style={{ backgroundImage: `url(${mat.heroImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent pointer-events-none" />

            {/* Floating Category Tag */}
            <div className="absolute top-3 left-3">
              <div className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-white backdrop-blur-md flex items-center gap-1.5 border border-white/30 dark:border-slate-700/60">
                <span>{mat.icon}</span>
                <span>{mat.title.split(' ')[0]}</span>
              </div>
            </div>

            {/* Floating Demand Pill */}
            <div className="absolute top-3 right-3">
              <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border flex items-center gap-1.5 ${
                displayDemand === 'Critical' || displayDemand === 'High'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400/30'
                  : displayDemand === 'Calculating...'
                  ? 'bg-slate-900/80 text-slate-300 border-slate-600/40'
                  : 'bg-amber-950/80 text-amber-300 border-amber-400/30'
              }`}>
                {displayDemand !== 'Calculating...' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                {displayDemand} {displayDemand !== 'Calculating...' ? 'Demand' : ''}
              </div>
            </div>
          </div>

          {/* Right Hero Column: Title + Market Snapshot */}
          <div className="md:col-span-7 flex flex-col justify-between gap-4">
            <div className="px-1 space-y-1.5">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                {title}
              </h2>
              <p className="text-xs md:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                {mat.subtitle}
              </p>
            </div>

            {/* Market Snapshot Card */}
            <div className="bg-gradient-to-br from-[#1178ab] to-[#085078] rounded-2xl p-4 md:p-5 text-white shadow-xs">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Price & Trend */}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-100/80 mb-1">
                    Average Market Rate
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums leading-none">
                      {displayPrice > 0 ? `KSh ${displayPrice}` : 'Varies'}
                    </span>
                    {displayPrice > 0 && (
                      <span className="text-xs font-semibold text-sky-100/80">/kg</span>
                    )}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-lg text-[10.5px] font-bold">
                    {isTrendUp ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                    ) : isTrendDown ? (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-sky-100" />
                    )}
                    <span className={isTrendUp ? 'text-emerald-300' : isTrendDown ? 'text-rose-300' : 'text-sky-100'}>
                      {isTrendUp ? 'Up' : isTrendDown ? 'Down' : 'Steady'} {displayTrend} (30d)
                    </span>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-14 bg-white/15 shrink-0" />

                {/* Right: Demand */}
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-sky-100/80 mb-1">
                    Demand
                  </p>
                  <p className="text-base md:text-lg font-bold text-white leading-tight">
                    {displayDemand}
                  </p>
                  <p className="text-[10px] text-sky-100/75 font-medium mt-0.5">
                    Live hub index
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════ BODY CONTENT ═══════════ */}
      <div className="max-w-5xl mx-auto px-3 pt-6 md:pt-8 space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

          {/* LEFT COLUMN (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* ── WHY IT'S WORTH COLLECTING ── */}
            <section className="space-y-3">
              <div className="px-0.5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                  Why it's worth collecting
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                  {mat.whyCollectorsBuy}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mat.valueProps.map((vp, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5"
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-100/80 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                      {vp}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── MATERIAL GRADES ── */}
            <section className="space-y-2.5">
              <div className="px-0.5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                  Quality grades
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  How you sort and prepare materials directly impacts buyer offers.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {GRADES.map((g, i) => {
                  const badgeStyle =
                    i === 0
                      ? 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                      : i === 1
                      ? 'bg-sky-100/80 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400'
                      : i === 2
                      ? 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-rose-100/80 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400';

                  const dotColor =
                    i === 0
                      ? 'bg-emerald-500'
                      : i === 1
                      ? 'bg-sky-500'
                      : i === 2
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                  return (
                    <div
                      key={g.key}
                      className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 space-y-1.5"
                    >
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        {g.label}
                      </span>
                      <p className="text-[11.5px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
                        {g.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN (5 cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* ── PREPARE YOUR MATERIAL ── */}
            <section className="space-y-2.5">
              <div className="px-0.5">
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                  How to prepare your material
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Follow these guidelines for faster pickups and top rates.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* DO Box */}
                <div className="bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Do
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {mat.doList.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AVOID Box */}
                <div className="bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/70 dark:border-rose-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                    </div>
                    <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                      Avoid
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {mat.dontList.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-snug">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* ── COLLECTOR TIP ── */}
            <section>
              <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-100/80 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Collector Tip
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  {mat.proTip}
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ═══════════ STICKY BOTTOM CTA ═══════════ */}
      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] lg:bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

          {/* Material Thumbnail + Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl bg-cover bg-center shrink-0 border border-slate-200/80 dark:border-slate-700/60"
              style={{ backgroundImage: `url(${mat.heroImage})` }}
            />
            <div className="flex flex-col min-w-0">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate">
                {title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {displayPrice > 0 ? `KSh ${displayPrice}/kg` : 'Price varies'}
                </span>
                {displayTrend !== '--%' && (
                  <span className={`text-[10px] font-bold ${isTrendUp ? 'text-emerald-600 dark:text-emerald-400' : isTrendDown ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                    {isTrendUp ? '▲' : isTrendDown ? '▼' : '•'} {displayTrend}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate(isSeller ? `/post-trade?material=${slug}` : '/book-pickup')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold tracking-wide active:scale-95 transition-all flex items-center gap-2 shrink-0"
          >
            {isSeller ? 'Sell this material' : 'Book a Pickup'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}


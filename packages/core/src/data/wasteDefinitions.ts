export interface WasteSubcategory {
  id: string;
  label: string;
  description: string;
}

export interface WasteCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  subcategories: WasteSubcategory[];
}

export const WASTE_CATEGORIES: WasteCategory[] = [
  {
    id: 'plastic',
    label: 'Plastic',
    icon: '🥤',
    color: 'emerald',
    subcategories: [
      { id: 'pet', label: 'PET Bottles', description: 'Clear water/soda bottles' },
      { id: 'hdpe', label: 'HDPE Plastic', description: 'Milk jugs, detergent bottles' },
      { id: 'ldpe', label: 'LDPE Plastic', description: 'Plastic bags, wraps' },
      { id: 'pp', label: 'PP Plastic', description: 'Bottle caps, containers' },
      { id: 'mixed_plastic', label: 'Mixed Plastic', description: 'Unsorted recyclables' }
    ]
  },
  {
    id: 'metal',
    label: 'Metal',
    icon: '⚙️',
    color: 'slate',
    subcategories: [
      { id: 'aluminium', label: 'Aluminium', description: 'Soda cans, foil' },
      { id: 'copper', label: 'Copper', description: 'Wiring, pipes' },
      { id: 'steel', label: 'Scrap Steel', description: 'Iron, heavy metal' },
      { id: 'brass', label: 'Brass', description: 'Valves, fittings' }
    ]
  },
  {
    id: 'ewaste',
    label: 'E-Waste',
    icon: '💻',
    color: 'amber',
    subcategories: [
      { id: 'batteries', label: 'Batteries', description: 'Li-ion, Lead-acid' },
      { id: 'logic_boards', label: 'Logic Boards', description: 'Computer/Phone PCBs' },
      { id: 'cables', label: 'Cables & Wires', description: 'Power cords, USB' },
      { id: 'screens', label: 'Screens/LCDs', description: 'Monitors, TVs' }
    ]
  },
  {
    id: 'paper',
    label: 'Paper & Cardboard',
    icon: '📦',
    color: 'orange',
    subcategories: [
      { id: 'cardboard', label: 'Corrugated Cardboard', description: 'Brown boxes' },
      { id: 'office_paper', label: 'Office Paper', description: 'White A4, books' },
      { id: 'newsprint', label: 'Newsprint', description: 'Newspapers' }
    ]
  },
  {
    id: 'glass',
    label: 'Glass',
    icon: '🍾',
    color: 'sky',
    subcategories: [
      { id: 'clear_glass', label: 'Clear Glass', description: 'Flint glass' },
      { id: 'colored_glass', label: 'Colored Glass', description: 'Amber, Green' }
    ]
  },
  {
    id: 'organic',
    label: 'Organic Waste',
    icon: '🍎',
    color: 'green',
    subcategories: [
      { id: 'food_scraps', label: 'Food Scraps', description: 'Vegetable peels, leftovers' },
      { id: 'green_waste', label: 'Green Waste', description: 'Grass, leaves, branches' }
    ]
  },
  {
    id: 'general',
    label: 'General Waste',
    icon: '🗑️',
    color: 'slate',
    subcategories: [
      { id: 'household_trash', label: 'Household Trash', description: 'Non-recyclable domestic waste' }
    ]
  }
];

export const getCategoryBySlug = (slug: string) => {
  return WASTE_CATEGORIES.find(c => c.id === slug);
};

export const getSubcategoryLabel = (catSlug: string, subSlug: string) => {
  const cat = getCategoryBySlug(catSlug);
  const sub = cat?.subcategories.find(s => s.id === subSlug);
  return sub?.label || subSlug;
};

// ── Shared UI Constants ──────────────────────────────────────────

export const MATERIAL_LABELS: Record<string, string> = {
  plastic: 'Plastic', 
  metal: 'Metal', 
  ewaste: 'E-Waste',
  paper: 'Paper & Cardboard', 
  glass: 'Glass',
  organic: 'Organic',
  general: 'General',
};

export const SCALE_DEFS = [
  { id: 'standard', label: 'Standard', icon: '🚛', description: 'Households & small waste (< 50kg)' },
  { id: 'bulk', label: 'Bulk', icon: '🏢', description: 'Estates & large loads (50kg+)' },
  { id: 'industrial', icon: '✨', label: 'Industrial', description: 'Factories & construction (500kg+)' }
];

const fs = require('fs');

let file = fs.readFileSync('apps/agent/src/pages/admin/AdminMarketplace.tsx', 'utf8');

// 1. Find Search & Filters Row start
const searchStart = file.indexOf('{/* ── SEARCH & FILTERS ROW ── */}');

// 2. Find Bottom Insights Row start
const bottomStart = file.indexOf('{/* ── BOTTOM INSIGHTS ROW ── */}');

// 3. Find Listing Modal start
const modalStart = file.indexOf('{/* ── LISTING MODAL (PRESERVED EXACTLY) ── */}');

if (searchStart === -1 || bottomStart === -1 || modalStart === -1) {
  console.log("Could not find blocks");
  process.exit(1);
}

// 4. Extract Market Insights Card
const insightsStart = file.indexOf('{/* Market Insights */}');
const trendsStart = file.indexOf('{/* Recent Price Trends */}');
let marketInsights = file.substring(insightsStart, trendsStart).trim();

// Remove lg:col-span-1 from the Insights card since it will be in a 1-col sidebar
marketInsights = marketInsights.replace('lg:col-span-1 ', '');

// Create a new Top Buyers Card
const topBuyers = `
         {/* Top Buyers */}
         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-5">
              <Users className="w-4 h-4 text-emerald-500" /> Active Buyers
            </h3>
            <div className="space-y-4">
              {[
                { name: 'EcoPlastics Inc.', type: 'Recycler', qty: '12.4t needed' },
                { name: 'GreenMetal Co.', type: 'Smelter', qty: '8.2t needed' },
                { name: 'PaperMills Ltd', type: 'Manufacturer', qty: '24.5t needed' },
                { name: 'GlassWorks', type: 'Manufacturer', qty: '5.0t needed' }
              ].map((buyer, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{buyer.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{buyer.type}</p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 px-2 py-1 rounded-md">{buyer.qty}</span>
                </div>
              ))}
            </div>
         </div>
`;

// Combine into Sidebar
const sidebar = `
        {/* ── SIDEBAR (RIGHT) ── */}
        <div className="xl:col-span-1 space-y-6">
${marketInsights}
${topBuyers}
        </div>
`;

// Main Column Content (from searchStart to bottomStart)
let mainContent = file.substring(searchStart, bottomStart).trim();

// Change grid cols for listings to fit better in 3-column span
// Currently: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
// It should be: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 (since it takes 3/4 width now)
mainContent = mainContent.replace('xl:grid-cols-4', '');

const newLayout = `
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* ── MAIN COLUMN (LEFT) ── */}
        <div className="xl:col-span-3 space-y-6">
${mainContent}
        </div>

${sidebar}

      </div>
`;

// Reconstruct file
file = file.substring(0, searchStart) + newLayout + '\n\n      ' + file.substring(modalStart);

fs.writeFileSync('apps/agent/src/pages/admin/AdminMarketplace.tsx', file);
console.log("Patched successfully!");

const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '../apps/agent/src/pages/admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  if (file === 'AdminLayout.tsx') {
    content = content.replace('bg-[#F8F8FF] dark:bg-slate-800', 'bg-slate-50 dark:bg-slate-900');
    // Also standardizing the sidebar if needed, but the user mainly mentioned backgrounds and cards
  }

  if (file === 'AdminMarketplace.tsx') {
    // Remove background from wrapper
    content = content.replace('bg-slate-50 dark:bg-slate-950 ', '');
  }

  if (file === 'MarketIntelligence.tsx') {
    // Remove background from wrapper
    content = content.replace('bg-slate-50/50 dark:bg-[#0f172a] ', '');
    // Change cards to dark:bg-slate-800
    content = content.replaceAll('dark:bg-[#1e293b]', 'dark:bg-slate-800');
  }

  // General card replacements for consistency
  // Change bg-white dark:bg-slate-900 to bg-white dark:bg-slate-800
  content = content.replaceAll('bg-white dark:bg-slate-900', 'bg-white dark:bg-slate-800');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}

const fs = require('fs');

const lines = fs.readFileSync('apps/agent/src/pages/admin/FleetFinance.tsx', 'utf8').split('\n');

let depth = 0;
let inRender = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('return (')) {
    inRender = true;
    depth = 0;
  }
  
  if (inRender) {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    
    depth += opens;
    depth -= closes;
    
    if (i > lines.length - 20) console.log(`Line ${i + 1}: depth ${depth} -> ${line.trim()}`);
  }
}
console.log(`Final depth: ${depth}`);

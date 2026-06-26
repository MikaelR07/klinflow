const fs = require('fs');

const lines = fs.readFileSync('apps/agent/src/pages/admin/MarketIntelligence.tsx', 'utf8').split('\n');

let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('return (')) depth = 0;
  
  // Count un-closed opening tags and closing tags
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  
  depth += opens;
  depth -= closes;
  
  if (i > 540) console.log(`Line ${i + 1}: depth ${depth} -> ${line.trim()}`);
}
console.log(`Final depth: ${depth}`);

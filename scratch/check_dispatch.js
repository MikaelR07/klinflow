const fs = require('fs');
const content = fs.readFileSync('apps/agent/src/pages/admin/DispatchDashboard.tsx', 'utf8');

const stack = [];
for (let i = 0; i < content.length; i++) {
  const char = content[i];
  if (char === '{' || char === '(' || char === '<' || char === '[') {
    stack.push({ char, index: i, line: content.slice(0, i).split('\n').length });
  } else if (char === '}' || char === ')' || char === '>' || char === ']') {
    if (stack.length === 0) {
      console.log(`Extra closing ${char} at line ${content.slice(0, i).split('\n').length}`);
      process.exit(1);
    }
    const last = stack[stack.length - 1];
    const match = { '}': '{', ')': '(', '>': '<', ']': '[' };
    if (last.char === match[char]) {
      stack.pop();
    } else {
      console.log(`Mismatched closing ${char} at line ${content.slice(0, i).split('\n').length}, expected closing for ${last.char} from line ${last.line}`);
      process.exit(1);
    }
  }
}
console.log("Balanced.");

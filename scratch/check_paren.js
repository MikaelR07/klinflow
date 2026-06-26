const fs = require('fs');
const code = fs.readFileSync('apps/agent/src/pages/admin/FleetFinance.tsx', 'utf8');

// Use acorn or typescript parser if available.
// Let's just run node -c to see if there's a javascript level error (JSX often causes syntax errors in standard JS, but we can look for basic paren mismatch)

let stack = [];
let inString = false;
let stringChar = null;

for (let i = 0; i < code.length; i++) {
  const char = code[i];
  if (inString) {
    if (char === '\\') i++;
    else if (char === stringChar) inString = false;
  } else {
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
    } else if (char === '(') {
      stack.push({ char, line: code.substring(0, i).split('\n').length });
    } else if (char === '{') {
      stack.push({ char, line: code.substring(0, i).split('\n').length });
    } else if (char === ')') {
      if (stack[stack.length - 1] && stack[stack.length - 1].char === '(') {
        stack.pop();
      } else {
        console.log("Unmatched ) at line", code.substring(0, i).split('\n').length);
      }
    } else if (char === '}') {
      if (stack[stack.length - 1] && stack[stack.length - 1].char === '{') {
        stack.pop();
      } else {
        console.log("Unmatched } at line", code.substring(0, i).split('\n').length);
      }
    }
  }
}
console.log("Remaining in stack:");
for (let item of stack) {
  console.log(item);
}

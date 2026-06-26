const fs = require('fs');
const babel = require('@babel/core');

const code = fs.readFileSync('apps/hub/src/pages/ExecutiveCommandCenter.tsx', 'utf-8');

try {
  babel.transformSync(code, {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename: 'ExecutiveCommandCenter.tsx'
  });
  console.log("No syntax errors found!");
} catch (e) {
  console.error("Syntax Error:", e.message);
}

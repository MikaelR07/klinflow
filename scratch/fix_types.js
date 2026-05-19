import fs from 'fs';

const path = 'packages/supabase/src/database.types.ts';
let content = fs.readFileSync(path, 'utf8');

// The pattern is finding `Update: {\n[some stuff]\n        }` and replacing with `Update: { ... }\n        Relationships: any[]`
// Actually it's safer to look for `Update: {` and then find its matching closing brace, but simple regex works if indentation is consistent.
content = content.replace(/(Update: \{[^}]+\})/g, '$1\n        Relationships: any[]');

// Also check for Enums since it failed earlier on my manual edit.
// In Supabase v2, GenericSchema expects Enums: Record<string, string> or similar?
// The file has Enums: Record<string, never>

fs.writeFileSync(path, content, 'utf8');
console.log('Added Relationships: any[] to all tables');

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: prices } = await supabase.from('material_prices').select('*');
  console.log("Material Prices:", prices);

  const { data: categories } = await supabase.from('waste_categories').select('id, label, slug, price_per_unit');
  console.log("Waste Categories:", categories);
}

test();

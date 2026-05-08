import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: bookings, error: bErr } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(2);
  console.log("Recent Bookings:", bErr ? bErr : bookings);

  const { data: ledger, error: lErr } = await supabase.from('rewards_ledger').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Recent Ledger:", lErr ? lErr : ledger);
}

test();

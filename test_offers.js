import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'apps/client/.env.local' });
dotenv.config({ path: 'apps/client/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.log("No Supabase URL found in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking marketplace_offers...");
  const { data, error } = await supabase.from('marketplace_offers').select('*').limit(1);
  console.log('Offers data:', data);
  if (error) console.log('Error:', error);
}

test();

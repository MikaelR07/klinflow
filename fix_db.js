import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('marketplace_offers')
    .delete()
    .is('seller_id', null);
  
  if (error) console.error("Error:", error);
  else console.log("Successfully deleted corrupted offers with null seller_id");
}

run();

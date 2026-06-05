import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: wc, error: wcErr } = await supabase.from('waste_categories').select('*');
  console.log('--- waste_categories ---');
  console.log(wcErr || wc);

  const { data: mp, error: mpErr } = await supabase.from('material_prices').select('*');
  console.log('\n--- material_prices ---');
  console.log(mpErr || mp);
}

checkData();

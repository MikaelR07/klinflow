import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://heqxpcrguaopiimsuqmk.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: wallets } = await supabase.from('user_wallets').select('*');
  const { data: txns } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(50);
  const { data: bookings } = await supabase.from('bookings').select('id, total_price, fee, amount, status, client_cashback').limit(50);
  
  fs.writeFileSync('scratch/db_state.json', JSON.stringify({ wallets, txns, bookings }, null, 2));
}
run();

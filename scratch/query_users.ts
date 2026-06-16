import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://heqxpcrguaopiimsuqmk.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function run() {
  const { data: wallets } = await supabase.from("user_wallets").select("user_id, lifetime_earned, profiles(role, name)");
  console.log(JSON.stringify(wallets, null, 2));
}
run();

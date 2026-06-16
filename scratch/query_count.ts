import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://heqxpcrguaopiimsuqmk.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function run() {
  const { data: wallets } = await supabase.from("user_wallets").select("id", { count: "exact", head: true }).gt("lifetime_earned", 0).in("profiles.role", ["user", "resident", "client"]); console.log(wallets); process.exit(0);
  console.log(JSON.stringify(wallets, null, 2));
}
run();

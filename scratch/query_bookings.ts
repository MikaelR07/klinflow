import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://heqxpcrguaopiimsuqmk.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function run() {
  const { data } = await supabase.from("bookings").select("*").limit(1);
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
run();

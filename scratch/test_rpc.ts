import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://heqxpcrguaopiimsuqmk.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function run() {
  const { data, error } = await supabase.from('profiles').select('role, id').limit(10);
  console.log("DATA:", JSON.stringify(data, null, 2));
  console.log("ERROR:", error);
  process.exit(0);
}
run();

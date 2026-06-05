const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const matchUrl = env.match(/VITE_SUPABASE_URL=(.*)/);
const matchKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const supabase = createClient(matchUrl[1], matchKey[1]);

async function run() {
  const { data: policies, error } = await supabase.rpc('get_policies', { table_name: 'swarms' }).catch(() => ({}));
  console.log("Policies via RPC?", policies);
}
run();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJh...'
);

async function test() {
  const { data, error } = await supabase
    .from('swarms')
    .select('id, creator_id, profiles:creator_id(role)')
    .limit(1);
  console.log(error ? error : data);
}
test();

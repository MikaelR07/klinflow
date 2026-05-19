import { supabase } from '../src/lib/supabaseClient';

async function test() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (data) {
    // Check if data is typed correctly
    const first = data[0];
    console.log(first.id); // Should not be any
  }
}

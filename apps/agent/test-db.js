import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'dummy';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('waste_categories')
    .select('*')
    .is('parent_category', null);
  console.log('Categories:', data?.length, error);

  const { data: sub, error: err } = await supabase
    .from('waste_categories')
    .select('*')
    .not('parent_category', 'is', null);
  console.log('Subcategories:', sub?.length, err);
}

test();

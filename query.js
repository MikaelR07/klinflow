const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: './.env.local' });
require('dotenv').config({ path: './packages/supabase/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('waste_categories').select('*');
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
run();

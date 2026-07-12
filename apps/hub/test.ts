import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('waste_categories')
    .select('*');
    
  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log("Data count:", data?.length);
    if(data?.length > 0) {
      console.log("Sample:", data[0]);
    } else {
      console.log("Table is empty!");
    }
  }
}
run();

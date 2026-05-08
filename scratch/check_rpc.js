
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkFunction() {
  const { data, error } = await supabase.rpc('get_function_definition', { function_name: 'agent_completes_pickup' });
  if (error) {
    console.log("Error fetching via RPC, trying direct query...");
    const { data: queryData, error: queryError } = await supabase.from('pg_proc').select('prosrc').eq('proname', 'agent_completes_pickup');
    console.log(queryData?.[0]?.prosrc || "Function definition not found.");
  } else {
    console.log(data);
  }
}

checkFunction();

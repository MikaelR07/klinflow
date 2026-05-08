
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runMigration() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: "ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hidden_for_client BOOLEAN DEFAULT FALSE;"
  });
  
  if (error) {
    // If exec_sql doesn't exist, we might have to use another way or just assume it's there
    console.error("Migration Error:", error);
  } else {
    console.log("Migration Success:", data);
  }
}

runMigration();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://heqxpcrguaopiimsuqmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcXhwY3JndWFvcGlpbXN1cW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjM2NjgsImV4cCI6MjA5MTkzOTY2OH0.vGES_grqNJDhSJJPvodzAEn02uF7wScNIOk9AhIbczI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('waste_categories').select('*').limit(5);
  console.log("Categories:", data);
}
check();

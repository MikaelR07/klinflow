import { createClient } from '@supabase/supabase-js';

const url = 'https://heqxpcrguaopiimsuqmk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcXhwY3JndWFvcGlpbXN1cW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjM2NjgsImV4cCI6MjA5MTkzOTY2OH0.vGES_grqNJDhSJJPvodzAEn02uF7wScNIOk9AhIbczI';

const supabase = createClient(url, key);

async function run() {
  console.log('Fetching profiles...');
  const { data: profiles, error: fetchErr } = await supabase.from('profiles').select('id, rating');
  if (fetchErr) return console.error('Fetch error:', fetchErr);
  
  console.log(`Found ${profiles.length} profiles. Resetting ratings to NULL...`);
  
  // Update them to null one by one to ensure it fires correctly
  let successCount = 0;
  for (const p of profiles) {
    const { error } = await supabase.from('profiles').update({ rating: null }).eq('id', p.id);
    if (error) {
      console.error(`Failed for ${p.id}:`, error);
    } else {
      successCount++;
    }
  }
  
  console.log(`Successfully reset rating to NULL for ${successCount} profiles.`);
}

run();

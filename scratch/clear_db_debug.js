import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://heqxpcrguaopiimsuqmk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcXhwY3JndWFvcGlpbXN1cW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjM2NjgsImV4cCI6MjA5MTkzOTY2OH0.vGES_grqNJDhSJJPvodzAEn02uF7wScNIOk9AhIbczI';

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES_TO_CLEAR = [
  'notifications',
  'wallet_transactions',
  'assets',
  'bookings',
];

async function clearDebugData() {
  console.log('🚀 Starting Debug Data Cleanup (Profiles will be preserved)...\n');

  for (const table of TABLES_TO_CLEAR) {
    process.stdout.write(`🧹 Clearing "${table}"... `);
    const { error, count } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error(`\n❌ Failed to clear "${table}": ${error.message}`);
    } else {
      console.log(`✅ Done`);
    }
  }

  console.log('\n🎉 Cleanup Complete! Database is fresh for debugging.');
  console.log('   ✔ Profiles & user accounts preserved');
  console.log('   ✔ Bookings, notifications, assets & transactions wiped');
}

clearDebugData().catch(console.error);

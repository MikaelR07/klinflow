
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixPoints() {
  console.log("Checking last mission for point correction...");
  
  // Find the last completed booking
  const { data: bookings, error: bError } = await supabase
    .from('bookings')
    .select('id, user_id, actual_weight_kg')
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (bError || !bookings || bookings.length === 0) {
    console.log("No completed missions found to correct.");
    return;
  }

  const lastJob = bookings[0];
  const weight = Number(lastJob.actual_weight_kg) || 0;
  const expectedPoints = Math.floor(weight * 5);

  console.log(`Last Job: ${lastJob.id} | Weight: ${weight}kg | Expected Points: ${expectedPoints}`);

  if (weight >= 10) {
    console.log(`Fixing user ${lastJob.user_id} points to ${expectedPoints}...`);
    const { error: pError } = await supabase
      .from('profiles')
      .update({ reward_points: expectedPoints })
      .eq('id', lastJob.user_id);
    
    if (pError) console.error("Failed to update points:", pError);
    else console.log("Success! Points corrected to 50 GFP.");
  } else {
    console.log("Weight is less than 10kg, no correction needed for this specific test case.");
  }
}

fixPoints();

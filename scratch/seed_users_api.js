import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://heqxpcrguaopiimsuqmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcXhwY3JndWFvcGlpbXN1cW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjM2NjgsImV4cCI6MjA5MTkzOTY2OH0.vGES_grqNJDhSJJPvodzAEn02uF7wScNIOk9AhIbczI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const users = [
  { phone: '0712345678', name: 'Mikael (Admin)', type: 'company_admin' },
  { phone: '0722222222', name: 'John Driver', type: 'fleet_driver' },
  { phone: '0733333333', name: 'Sarah Freelance', type: 'independent' },
  { phone: '0711111111', name: 'Grace Wambui', type: 'resident', rewardPoints: 2260 },
  { phone: '0722222221', name: 'David Omari', type: 'resident', rewardPoints: 1940 },
  { phone: '0733333331', name: 'Alice Moraa', type: 'resident', rewardPoints: 1560 },
];

async function seed() {
  for (const user of users) {
    const email = `${254}${user.phone.slice(1)}@cleanflow.ke`;
    console.log(`Registering ${user.name} (${email})...`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: '12345678',
      options: {
        data: {
          full_name: user.name,
          phone: user.phone,
        }
      }
    });

    let userId = data?.user?.id;

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`${user.name} already exists. Retrieving ID...`);
        const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
          email,
          password: '12345678'
        });
        if (signError) {
          console.error(`Could not retrieve ID for ${user.name}:`, signError.message);
          continue;
        }
        userId = signData?.user?.id;
      } else {
        console.error(`Error registering ${user.name}:`, error.message);
        continue;
      }
    }

    console.log(`Successfully registered ${user.name}. UID: ${userId}`);
    
    // Use UPSERT instead of UPDATE to ensure the row is created
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: user.name,
        phone: user.phone,
        role: user.type === 'resident' ? 'user' : 'agent',
        agent_account_type: user.type === 'resident' ? null : user.type,
        reward_points: user.rewardPoints || 0,
        is_online: true,
        is_verified: true,
        company_name: user.type === 'company_admin' ? 'GreenLoop Logistics' : null,
        fleet_invite_code: user.type === 'company_admin' ? 'GLOOP24' : null,
        location: { estate: 'South B', latitude: -1.31, longitude: 36.83 }
      });

    if (profileError) {
      console.error(`Error updating profile for ${user.name}:`, profileError.message);
    } else {
      console.log(`Profile synchronized for ${user.name}.`);

      // Initialize Agent Configuration
      const { error: configError } = await supabase
        .from('agent_configurations')
        .upsert({
          agent_id: userId,
          base_logistics_fee: user.type === 'company_admin' ? 150 : 0,
          accepted_materials: user.type === 'company_admin' ? ['plastic', 'metal', 'e-waste'] : ['organic', 'general'],
          is_active: true
        }, { onConflict: 'agent_id' });

      if (configError) {
        console.error(`Error initializing config for ${user.name}:`, configError.message);
      } else {
        console.log(`Config initialized for ${user.name}.`);
      }
    }
  }
}

seed();

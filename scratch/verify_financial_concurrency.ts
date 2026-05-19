import { createClient } from '@supabase/supabase-js';

// This script simulates a concurrent withdrawal attack to verify the FOR UPDATE locking.
// It also tests the idempotency of the payout RPC.

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testConcurrency(userId: string) {
    console.log('--- STARTING CONCURRENCY TEST ---');
    console.log(`Target User: ${userId}`);

    // 1. Reset balance to 100
    await supabase.from('profiles').update({ wallet_balance: 100 }).eq('id', userId);
    console.log('Balance reset to 100.');

    // 2. Simultaneous withdrawal of 60 (x2)
    // If locking works, one should succeed (balance -> 40), the other should fail (insufficient funds).
    // If locking fails, both might succeed (balance -> -20).
    console.log('Sending 2 concurrent withdrawals of 60 each...');

    const results = await Promise.allSettled([
        supabase.rpc('process_wallet_withdrawal', { p_amount: 60 }),
        supabase.rpc('process_wallet_withdrawal', { p_amount: 60 })
    ]);

    results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
            if (res.value.error) {
                console.log(`Attempt ${i + 1}: Rejected correctly - ${res.value.error.message}`);
            } else {
                console.log(`Attempt ${i + 1}: Success! New balance: ${res.value.data.new_balance}`);
            }
        }
    });

    // 3. Final balance check
    const { data: profile } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
    console.log(`Final Database Balance: ${profile?.wallet_balance}`);
    
    if (Number(profile?.wallet_balance) >= 0) {
        console.log('✅ Concurrency Safety Verified: No negative balance drift.');
    } else {
        console.log('❌ Concurrency Safety Failed: Negative balance detected!');
    }
}

async function testIdempotency(bookingId: string) {
    console.log('\n--- STARTING IDEMPOTENCY TEST ---');
    
    // Attempt 1
    const res1 = await supabase.rpc('process_booking_payout', { p_booking_id: bookingId, p_weight_kg: 10 });
    console.log('Attempt 1 Payout:', res1.error ? res1.error.message : 'Success');

    // Attempt 2 (should fail)
    const res2 = await supabase.rpc('process_booking_payout', { p_booking_id: bookingId, p_weight_kg: 10 });
    console.log('Attempt 2 Payout (Replay):', res2.error ? res2.error.message : 'Success (ERROR)');

    if (res2.error && res2.error.message.includes('already')) {
        console.log('✅ Idempotency Verified: Duplicate payout blocked.');
    } else {
        console.log('❌ Idempotency Failed: Duplicate payout allowed.');
    }
}

// Usage: Run with a valid userId and bookingId
// testConcurrency('user-uuid');
// testIdempotency('booking-uuid');

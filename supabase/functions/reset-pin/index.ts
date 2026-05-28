import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getEnv, validateEnv } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PayloadSchema = z.object({
  phone: z.string().min(1),
  otp: z.string().min(1),
  newPin: z.string().min(8)
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    validateEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
    
    const body = await req.json();
    const parseResult = PayloadSchema.safeParse(body);
    
    if (!parseResult.success) {
      throw new Error(`Invalid payload: ${parseResult.error.message}`);
    }
    
    const { phone, otp, newPin } = parseResult.data;

    // Normalize phone to e164 format
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '254' + normalized.slice(1);
    if (!normalized.startsWith('254')) normalized = '254' + normalized;
    const e164 = '+' + normalized;

    // Normalize phone to Klinflow fake email format for auth search
    const fakeEmail = `${normalized}@klinflow.ke`;

    const supabase = createClient(
      getEnv('SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY')
    );

    // 1. Verify OTP
    const { data: otpData, error: otpError } = await supabase
      .from('otp_verifications')
      .select('otp_code, expires_at')
      .eq('phone', e164)
      .single();

    if (otpError || !otpData) throw new Error('No OTP found for this number. Please request a new code.');

    if (new Date(otpData.expires_at) < new Date()) {
      await supabase.from('otp_verifications').delete().eq('phone', e164);
      throw new Error('OTP has expired. Please request a new code.');
    }

    if (otpData.otp_code !== otp) {
      throw new Error('Incorrect OTP. Please check your SMS and try again.');
    }

    // 2. OTP is valid, find the user
    // We search profiles by phone, but the surest way is by checking the auth users, 
    // however admin API doesn't allow easy searching by email without paginating listUsers.
    // Instead, we use the profiles table which maps phone to id.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', normalized)
      .single();

    if (profileError || !profile) {
      // Fallback if phone wasn't saved normalized in profiles
      const { data: profileFallback, error: fallbackError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .single();
        
      if (fallbackError || !profileFallback) {
         throw new Error('No account found for this phone number.');
      }
      var userId = profileFallback.id;
    } else {
      var userId = profile.id;
    }

    // 3. Reset the PIN (Password) using Admin API
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPin }
    );

    if (updateError) {
      throw new Error(`Failed to reset password: ${updateError.message}`);
    }

    // 4. Clean up OTP
    await supabase.from('otp_verifications').delete().eq('phone', e164);

    return new Response(JSON.stringify({ success: true, message: 'PIN reset successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('[Klinflow PIN Reset] Error:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Returning 200 with error property is common in this codebase
    });
  }
});

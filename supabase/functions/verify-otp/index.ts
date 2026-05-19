import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getEnv, validateEnv } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PayloadSchema = z.object({
  phone: z.string().min(1),
  otp: z.string().min(1)
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
    
    const { phone, otp } = parseResult.data;

    // Normalize phone
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '254' + normalized.slice(1);
    if (!normalized.startsWith('254')) normalized = '254' + normalized;
    const e164 = '+' + normalized;

    const supabase = createClient(
      getEnv('SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Fetch stored OTP record
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('otp_code, expires_at')
      .eq('phone', e164)
      .single();

    if (error || !data) throw new Error('No OTP found for this number. Please request a new code.');

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      // Clean up expired record
      await supabase.from('otp_verifications').delete().eq('phone', e164);
      throw new Error('OTP has expired. Please request a new code.');
    }

    // Check OTP match
    if (data.otp_code !== otp) {
      throw new Error('Incorrect OTP. Please check your SMS and try again.');
    }

    // ✅ OTP valid — clean up and confirm
    await supabase.from('otp_verifications').delete().eq('phone', e164);

    return new Response(JSON.stringify({ success: true, message: 'Phone verified successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('[Klinflow OTP Verify] Error:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});

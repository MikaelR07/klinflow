import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getEnv, validateEnv } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PayloadSchema = z.object({
  phone: z.string().min(1)
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    validateEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'AT_API_KEY', 'AT_USERNAME']);

    const body = await req.json();
    const parseResult = PayloadSchema.safeParse(body);
    
    if (!parseResult.success) {
      throw new Error(`Invalid payload: ${parseResult.error.message}`);
    }
    
    const { phone } = parseResult.data;

    // Normalize to international format
    let normalized = phone.replace(/\D/g, '');
    if (normalized.startsWith('0')) normalized = '254' + normalized.slice(1);
    if (!normalized.startsWith('254')) normalized = '254' + normalized;
    const e164 = '+' + normalized;

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP hash in Supabase (expires in 10 minutes)
    const supabase = createClient(
      getEnv('SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Upsert OTP record (one per phone at a time)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: dbError } = await supabase
      .from('otp_verifications')
      .upsert({ phone: e164, otp_code: otp, expires_at: expiresAt }, { onConflict: 'phone' });

    if (dbError) throw new Error('Failed to store OTP: ' + dbError.message);

    // Send SMS via Africa's Talking
    const AT_API_KEY  = getEnv('AT_API_KEY');
    const AT_USERNAME = getEnv('AT_USERNAME'); // 'sandbox' for testing

    const body = new URLSearchParams({
      username: AT_USERNAME,
      to: e164,
      message: `Your Klinflow verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    });

    // Route to correct environment endpoint
    const endpoint = AT_USERNAME === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const atRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apiKey': AT_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const atText = await atRes.text();
    console.log('[Klinflow OTP] AT Raw Response:', atText);

    let atData;
    try {
      atData = JSON.parse(atText);
    } catch (e) {
      throw new Error(`Africa's Talking API Error: ${atText}`);
    }

    const status = atData?.SMSMessageData?.Recipients?.[0]?.status;
    if (status && status !== 'Success') {
      throw new Error(`SMS delivery failed: ${status}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('[Klinflow OTP] Error:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});

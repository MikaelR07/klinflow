// @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getEnv, validateEnv } from '../_shared/env.ts';

const PayloadSchema = z.object({
  type: z.string().min(1),
  userId: z.string().uuid(),
  payload: z.record(z.any()).optional()
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── MAIN HANDLER ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();

  try {
    validateEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY']);
    
    const supabase = createClient(
      getEnv('SUPABASE_URL'),
      getEnv('SUPABASE_SERVICE_ROLE_KEY')
    );

    const body = await req.json();
    const parseResult = PayloadSchema.safeParse(body);
    
    if (!parseResult.success) {
      throw new Error(`Invalid payload: ${parseResult.error.message}`);
    }
    
    const { type, userId, payload } = parseResult.data;
    console.log(`[AI Logic] Request Type: ${type} for User: ${userId}`);

    const apiKey = getEnv('GEMINI_API_KEY');

    // ── CASE A: VISION SCAN (IMAGE ANALYSIS) ──────────────────────────
    if (type === 'vision_scan') {
      const { imageBase64, materialHint, validMaterials } = payload;
      
      if (!imageBase64) {
        throw new Error('Missing image data for vision scan');
      }

      const visionPrompt = `
        You are the Klinflow AI Vision Lab. Analyze this image of recyclable waste.
        ${validMaterials && validMaterials.length > 0 ? 
          `STRICT OBJECTIVE: Identify the MATERIAL from this EXACT list: ${validMaterials.join(', ')}. If none match, return null.` : 
          `STRICT OBJECTIVE: Identify the MATERIAL.`
        }
        Additionally, assign a GRADE (A, B, or C).
        
        GRADING RULES:
        - Grade A: High purity, clean, uniform (e.g. clear PET bottles only).
        - Grade B: Mixed subtypes or minor contamination/dirt.
        - Grade C: High contamination, dirty, or low-value mix.
        
        CONTEXT: The user thinks this is ${materialHint || 'unknown'}.
        
        Return ONLY a JSON object:
        {
          "material": "${validMaterials && validMaterials.length > 0 ? `One of: ${validMaterials.join(', ')}` : 'recyclable|metal|ewaste|glass|paper|organic'}",
          "grade": "A|B|C",
          "purity": 0-100,
          "confidence": 0-100,
          "reason": "1 sentence explanation of why it got this grade"
        }
      `;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: visionPrompt },
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
            ]
          }],
          generationConfig: { 
            response_mime_type: "application/json"
          }
        })
      });

      if (!geminiRes.ok) throw new Error(`Gemini Vision Error: ${await geminiRes.text()}`);
      
      const geminiData = await geminiRes.json();
      const rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      console.log('[AI Logic] Raw Vision Output:', rawOutput);
      const analysis = JSON.parse(rawOutput);

      return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── CASE B: CHAT ADVISOR (EXISTING LOGIC) ─────────────────────────
    // 1. Build Context — fetch the user's data to give the AI "Memory"
    const [profileRes, bookingsRes, marketRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabase.from('marketplace_listings').select('*').eq('status', 'active').limit(5)
    ]);

    const user = profileRes.data;
    const recentBookings = bookingsRes.data || [];
    const marketListings = marketRes.data || [];

    // 2. Build the prompt with all context baked in
    const systemContext = `You are HygeneX, the Autonomous Operations Manager for Klinflow.
You are speaking to ${user?.name || 'a user'} (Role: ${user?.role || 'user'}).

LOCALE: Kenya (Country-wide platform). Warm, professional, efficient.
CORE DATA:
- User Stats: Wallet KSh ${user?.wallet_balance || 0}, Points ${user?.reward_points || 0}
- Recent Activity: ${recentBookings.length > 0 ? recentBookings.map(b => `${b.waste_type} (${b.status})`).join(', ') : 'No recent bookings.'}
- Market Trends (Live): ${marketListings.length > 0 ? marketListings.map(l => `${l.material} @ KSh ${l.price_per_kg}/kg`).join(', ') : 'Market data unavailable.'}

INTELLIGENCE RULES:
- If a user asks about rewards, explain how they can earn more by better segregation.
- If an agent asks about work, prioritize "pending" bookings near their location.
- If a business/weaver asks about selling, use the Live Market Trends above to suggest optimal pricing.
- Keep answers helpful and concise. Be actionable. Use Swahili greetings sparingly.
- BRANDING: ALWAYS refer to the company as "Klinflow". Never say "Cleanflow" or "CleanFlow".
- Respond in plain conversational text, like a helpful assistant. Do NOT wrap your reply in JSON.

ACTION PROTOCOL (EXCEPTION):
ONLY if the user explicitly wants to book a pickup, respond with a JSON object instead of plain text.
Format: { "text": "Sure, I've drafted a PET Plastic pickup for tomorrow...", "action": { "type": "BOOK_PICKUP", "payload": { "waste_type": "plastic", "scheduled_date": "2024-05-04" } } }
Available waste types: plastic, metal, ewaste, paper, glass, organic, mixed.
For all other requests, just reply in plain conversational text.`;

    const userMessage = payload?.message || payload?.userMessage || 'Hello';
    console.log('[AI Version] Running Engine V6 (Actions enabled)'); 
    // 3. Call Gemini REST API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemContext}\n\nUser: ${userMessage}` }] }],
        generationConfig: { 
          maxOutputTokens: 1500, 
          temperature: 0.7
        }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('[Gemini Error]', err);
      throw new Error(`AI Engine Failure: ${err}`);
    }

    const geminiData = await geminiRes.json();
    let rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help! Could you rephrase your question?";
    
    // Clean potential markdown code fences
    rawOutput = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();

    // Gemini might return JSON only when an action is triggered — handle both cases
    let aiResponse = rawOutput;
    let actionPayload = null;

    if (rawOutput.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawOutput);
        aiResponse = parsed.text || rawOutput;
        actionPayload = parsed.action || null;
      } catch (e) {
        // Not valid JSON — treat the whole thing as plain text
        console.warn('[HygeneX] Raw output looked like JSON but failed to parse, using as plain text.');
        aiResponse = rawOutput;
      }
    }

    // 4. Store AI response (Background)
    const aiMsgId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    // We don't await this to return to user faster
    supabase
      .from('hygenex_messages')
      .insert({ 
        id: aiMsgId,
        user_id: userId, 
        role: 'ai', 
        text: aiResponse,
        metadata: actionPayload ? { action: actionPayload } : null,
        created_at: createdAt
      })
      .then(({ error }) => {
        if (error) console.error('[AI Error] Background save failed:', error);
      });

    return new Response(JSON.stringify({ 
      id: aiMsgId, 
      role: 'ai', 
      text: aiResponse, 
      created_at: createdAt,
      metadata: actionPayload ? { action: actionPayload } : null 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[HygeneX Error]', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

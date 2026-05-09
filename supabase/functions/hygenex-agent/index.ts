// ═══════════════════════════════════════════════════════════════════
// CleanFlow KE — HygeneX AI Operations Manager (Gemini Edition)
// ═══════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── MAIN HANDLER ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { type, userId, payload } = body;
    console.log(`[AI Logic] Request Type: ${type} for User: ${userId}`);

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in Supabase Secrets');
    }

    // ── CASE A: VISION SCAN (IMAGE ANALYSIS) ──────────────────────────
    if (type === 'vision_scan') {
      const { imageBase64, materialHint } = payload;
      
      if (!imageBase64) {
        throw new Error('Missing image data for vision scan');
      }

      const visionPrompt = `
        You are the CleanFlow AI Vision Lab. Analyze this image of recyclable waste.
        STRICT OBJECTIVE: Identify the MATERIAL and assign a GRADE (A, B, or C).
        
        GRADING RULES:
        - Grade A: High purity, clean, uniform (e.g. clear PET bottles only).
        - Grade B: Mixed subtypes or minor contamination/dirt.
        - Grade C: High contamination, dirty, or low-value mix.
        
        CONTEXT: The user thinks this is ${materialHint || 'unknown'}.
        
        Return ONLY a JSON object:
        {
          "material": "recyclable|metal|ewaste|glass|paper|organic",
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
    const [profileRes, bookingsRes, iotRes, marketRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bookings').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabase.from('iot_devices').select('*').eq('owner_id', userId),
      supabase.from('marketplace_listings').select('*').eq('status', 'active').limit(5)
    ]);

    const user = profileRes.data;
    const recentBookings = bookingsRes.data || [];
    const devices = iotRes.data || [];
    const marketListings = marketRes.data || [];

    // 2. Build the prompt with all context baked in
    const systemContext = `You are HygeneX, the Autonomous Operations Manager for CleanFlow KE.
You are speaking to ${user?.name || 'a user'} (Role: ${user?.role || 'user'}).

LOCALE: Nairobi, Kenya. Warm, professional, efficient.
CORE DATA:
- User Stats: Wallet KSh ${user?.wallet_balance || 0}, Points ${user?.reward_points || 0}, Tier ${user?.subscription_tier || 'lite'}
- IoT Sensors: ${devices.length > 0 ? devices.map(d => `${d.name}: ${d.fill_level}%`).join(', ') : 'No active sensors.'}
- Recent Activity: ${recentBookings.length > 0 ? recentBookings.map(b => `${b.waste_type} (${b.status})`).join(', ') : 'No recent bookings.'}
- Market Trends (Live): ${marketListings.length > 0 ? marketListings.map(l => `${l.material} @ KSh ${l.price_per_kg}/kg`).join(', ') : 'Market data unavailable.'}

INTELLIGENCE RULES:
- If a user asks about rewards, explain how they can earn more by better segregation.
- If an agent asks about work, prioritize "pending" bookings near their location.
- If a business/weaver asks about selling, use the Live Market Trends above to suggest optimal pricing.
- If an IoT bin is >85%, insist they book a pickup NOW.
- Keep answers helpful and concise (under 500 words). Be actionable. Use Swahili greetings sparingly.

ACTION PROTOCOL:
If the user wants to book a pickup, include an "action" field in your response JSON.
Example: { "text": "Sure, I've drafted a PET Plastic pickup for tomorrow...", "action": { "type": "BOOK_PICKUP", "payload": { "waste_type": "plastic", "scheduled_date": "2024-05-04" } } }
Available waste types: plastic, metal, ewaste, paper, glass, organic, mixed.`;

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
          maxOutputTokens: 1000, 
          temperature: 0.7,
          response_mime_type: "application/json" 
        }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('[Gemini Error]', err);
      throw new Error(`AI Engine Failure: ${err}`);
    }

    const geminiData = await geminiRes.json();
    let rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{\"text\":\"I'm processing too much data.\"}";
    
    // Clean potential markdown blocks
    rawOutput = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (e) {
      console.error('[JSON Parse Error]', rawOutput);
      // Fallback if AI fails to give valid JSON
      parsed = { text: rawOutput.slice(0, 200) };
    }

    let aiResponse = parsed.text || "I understand. How else can I help?";
    
    // Safety check: if aiResponse itself is a stringified object, parse it again
    if (typeof aiResponse === 'string' && aiResponse.trim().startsWith('{')) {
      try {
        const nested = JSON.parse(aiResponse);
        if (nested.text) aiResponse = nested.text;
      } catch (e) {
        // Not JSON, keep as is
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
        metadata: parsed.action ? { action: parsed.action } : null,
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
      metadata: parsed.action ? { action: parsed.action } : null 
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

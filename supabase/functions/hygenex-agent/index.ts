import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getEnv, validateEnv } from '../_shared/env.ts';
import { getSystemPrompt } from './prompts.ts';

const PayloadSchema = z.object({
  type: z.string().min(1),
  userId: z.string().uuid(),
  payload: z.record(z.any()).optional()
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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

    // ── CASE A: VISION SCAN ───────────────────────────────────────────
    if (type === 'vision_scan') {
      const { imageBase64, materialHint, validMaterials } = payload;
      
      if (!imageBase64) throw new Error('Missing image data');

      const materialsConstraint = validMaterials && validMaterials.length > 0
        ? `ACCEPTED CATEGORIES: ${validMaterials.join(', ')}. Match the material to one of these categories. If none match, set matched_category to null.`
        : `Identify the broad category (e.g. recyclable, metal, ewaste, glass, paper, organic).`;

      const visionPrompt = `
You are the Klinflow Material Identification Lab. Analyze this image and identify the recyclable material.
OBJECTIVE: Identify the specific material in this image and provide helpful educational information for the field agent.
${materialsConstraint}
CONTEXT: The agent thinks this is "${materialHint || 'unknown'}".
Return ONLY a JSON object:
{
  "material_name": "Specific material",
  "matched_category": "Category slug",
  "grade": "Premium|Good|Mixed|Low",
  "grade_reason": "Reason",
  "description": "Description",
  "recyclability": "Recyclability details",
  "handling_tips": "Tips"
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: visionPrompt }, { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (!geminiRes.ok) throw new Error(`Gemini Vision Error: ${await geminiRes.text()}`);
      const geminiData = await geminiRes.json();
      const rawOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      return new Response(rawOutput, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── CASE B: CHAT ADVISOR ──────────────────────────────────────────
    
    // 1. Fetch User Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const user = profile || { role: 'user' };

    // 2. Pre-Fetch Live Context (Parallel)
    const [bookingsRes, marketRes, swarmsRes, pendingRes, historyRes] = await Promise.all([
      supabase.from('bookings').select('waste_type, status').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabase.from('marketplace_listings').select('material, price_per_kg, location').eq('status', 'active').limit(5),
      supabase.from('swarms').select('name, location, target_material').eq('status', 'active').limit(5),
      (user.role === 'agent' || user.role === 'company_owner') 
        ? supabase.from('bookings').select('waste_type, estate, weight_kg').eq('status', 'pending').limit(5)
        : Promise.resolve({ data: [] }),
      supabase.from('hygenex_messages').select('role, text').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
    ]);

    const context = {
      recentBookings: bookingsRes.data || [],
      marketPrices: marketRes.data || [],
      swarms: swarmsRes.data || [],
      pendingPickups: pendingRes.data || [],
      fleetCount: 0 // Simplified
    };

    // 3. Build Chat History
    const historyData = historyRes.data || [];
    let chatHistory = [];
    let lastRole = null;
    const userMessage = payload?.message || 'Hello';
    
    const allMessages = [...historyData.reverse(), { role: 'user', text: userMessage }];

    for (const m of allMessages) {
      const gRole = m.role === 'ai' ? 'model' : 'user';
      const text = m.text || " ";

      if (gRole === lastRole && chatHistory.length > 0) {
        chatHistory[chatHistory.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        chatHistory.push({ role: gRole, parts: [{ text }] });
        lastRole = gRole;
      }
    }

    // Ensure history starts with user
    if (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
      chatHistory.shift();
    }

    // 4. Generate Single Stream with Pre-fetched Context
    const systemInstruction = getSystemPrompt(user.role, user, context);
    
    const MODELS = ['gemini-3.6-flash', 'gemini-3.6-flash-lite', 'gemini-flash-latest'];
    const geminiPayload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: chatHistory,
      generationConfig: { temperature: 0.7 }
    };

    let streamRes: Response | null = null;
    for (const model of MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      console.log(`[AI] Trying model: ${model}`);
      
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
      });

      if (res.ok) {
        streamRes = res;
        console.log(`[AI] Success with model: ${model}`);
        break;
      }

      const errText = await res.text();
      console.warn(`[AI] Model ${model} failed (${res.status}): ${errText.slice(0, 200)}`);
      
      // Only retry on 503 (overloaded) or 429 (rate limit)
      if (res.status !== 503 && res.status !== 429) {
        throw new Error(errText);
      }
    }

    if (!streamRes) throw new Error('All Gemini models are currently unavailable. Please try again in a moment.');

    // Pipe the stream directly back to the client
    return new Response(streamRes.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });

  } catch (error) {
    console.error('[HygeneX Error]', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

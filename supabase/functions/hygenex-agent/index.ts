// @ts-nocheck

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getEnv, validateEnv } from '../_shared/env.ts';
import { getSystemPrompt } from './prompts.ts';
import { getToolsForRole, executeTool } from './tools.ts';

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
  "grade": "A|B|C",
  "grade_reason": "Reason",
  "description": "Description",
  "recyclability": "Recyclability details",
  "handling_tips": "Tips"
}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
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
    // 1. Fetch User & Context
    const [profileRes, bookingsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bookings').select('waste_type, status').eq('user_id', userId).order('created_at', { ascending: false }).limit(3)
    ]);

    const user = profileRes.data || { role: 'user' };
    const context = {
      recentBookings: bookingsRes.data || [],
      pendingCount: 0, // Simplified for MVP
      fleetCount: 0 // Simplified for MVP
    };

    // Fetch conversation history (last 10 messages)
    const { data: historyData } = await supabase
      .from('hygenex_messages')
      .select('role, text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    let chatHistory = [];
    let lastRole = null;
    const userMessage = payload?.message || 'Hello';
    const allMessages = [...(historyData ? historyData.reverse() : []), { role: 'user', text: userMessage }];

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

    if (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
      chatHistory.shift();
    }

    const systemInstruction = getSystemPrompt(user.role, user, context);
    const tools = getToolsForRole(user.role);

    const callGemini = async (history: any[], isStreaming: boolean = false, forceText: boolean = false) => {
      const geminiUrl = isStreaming
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse&key=${apiKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
      
      const payload: any = {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: history,
        tools: [{ function_declarations: tools }],
        generationConfig: { temperature: 0.7 }
      };

      if (forceText) {
        payload.tool_config = { function_calling_config: { mode: "NONE" } };
      }

      return await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };

    // Step 1: Call Gemini (non-streaming) to check for tool calls
    let res = await callGemini(chatHistory, false, false);
    if (!res.ok) throw new Error(await res.text());
    let data = await res.json();
    
    let parts = data.candidates?.[0]?.content?.parts || [];
    let functionCallPart = parts.find((p: any) => p.functionCall);
    let toolsUsed = [];
    let toolResultsMetadata = null;

    if (functionCallPart) {
      // Tool Calling Loop
      const fnCall = functionCallPart.functionCall;
      console.log(`[AI Tool Call] ${fnCall.name}`);
      toolsUsed.push(fnCall.name);
      
      const toolResult = await executeTool(supabase, fnCall.name, fnCall.args, userId);
      if (fnCall.name === 'query_marketplace') {
        toolResultsMetadata = toolResult.result; // Save for UI rendering
      }

      // Inject the tool result directly into the user's last message to avoid strict role issues
      chatHistory[chatHistory.length - 1].parts[0].text += `\n\n[System Tool Response for ${fnCall.name}]: ${JSON.stringify(toolResult)}\nPlease summarize this to the user.`;

      // Step 2: Stream final response back to client (Force Text)
      console.log(`[AI] Streaming final response after tool call`);
      const streamRes = await callGemini(chatHistory, true, true);
      
      // Save metadata header to stream so UI knows tools were used
      const metadataHeader = JSON.stringify({ tools_used: toolsUsed, marketplace_results: toolResultsMetadata });
      
      return new Response(streamRes.body, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'text/event-stream',
          'X-AI-Metadata': encodeURIComponent(metadataHeader) 
        }
      });
    }

    // If no tool call, re-request as stream (Force Text)
    console.log(`[AI] Streaming direct response`);
    const streamRes = await callGemini(chatHistory, true, true);
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

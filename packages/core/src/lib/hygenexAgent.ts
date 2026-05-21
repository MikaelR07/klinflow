import { supabase, isSupabaseConfigured } from '@klinflow/supabase';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hygenex-agent`;

async function invoke(body: any) {
  if (!isSupabaseConfigured) {
    console.warn('[HygeneX Agent] Supabase not configured — skipping agent call.');
    return null;
  }

  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token;

  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.error('[HygeneX Agent] Edge Function error:', err);
    return null;
  }

  return res.json();
}

interface UserMessagePayload {
  userMessage: string;
  userId: string;
  chatHistory?: any[];
  userRole?: string;
}

export const callHygeneXAgent = {
  userMessage: ({ userMessage, userId, chatHistory = [], userRole = 'user' }: UserMessagePayload) =>
    invoke({
      type: 'user_message',
      userId,
      payload: { userMessage, chatHistory, userRole },
    }),

  scheduled: (checkType: 'daily_report' | 'reward_audit' | 'agent_dispatch' = 'daily_report') =>
    invoke({
      type: 'scheduled',
      payload: { checkType },
    }),
};

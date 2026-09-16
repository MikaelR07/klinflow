import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hygenex-agent`;

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface HygenexStore {
  messages: Message[];
  isTyping: boolean;
  initChat: () => Promise<void>;
  stopChat: () => void;
  sendMessage: (text: string) => Promise<void>;
  resetChat: () => void;
}

const WELCOME_MESSAGE: Message = {
  id: 'initial-1',
  role: 'ai',
  text: "Hello! I'm HygeneX, your smart waste intelligence assistant. How can I help you today?",
  timestamp: new Date().toISOString(),
};

export const useHygenexStore = create<HygenexStore>((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,

  initChat: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const saveHistory = localStorage.getItem('saveAiChatHistory') === 'true';

    if (!saveHistory) {
      // Clear old messages from DB and start fresh
      await supabase.from('hygenex_messages').delete().eq('user_id', userId);
      set({ messages: [WELCOME_MESSAGE] });
    } else {
      // Load history from DB
      const { data: history, error } = await supabase
        .from('hygenex_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && history) {
        const mapped: Message[] = history.map((row: any) => ({
          id: row.id,
          role: row.role,
          text: row.text,
          timestamp: row.created_at,
        }));
        set({ messages: [WELCOME_MESSAGE, ...mapped] });
      }
    }
  },

  stopChat: () => {
    // No-op now — no realtime channel to clean up
  },

  sendMessage: async (text) => {
    const { userId } = useAuthStore.getState();
    if (!userId || !text.trim()) return;

    // Add user message to UI immediately
    const tempId = crypto.randomUUID();
    const userMsg: Message = { id: tempId, role: 'user', text, timestamp: new Date().toISOString() };
    set((s) => ({ messages: [...s.messages, userMsg], isTyping: true }));

    // Persist user message in background (fire-and-forget)
    supabase.from('hygenex_messages').insert({ user_id: userId, role: 'user', text }).then();

    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        },
        body: JSON.stringify({
          type: 'user_message',
          userId,
          payload: { message: text }
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('[HygeneX] Edge Function Error:', errText);
        throw new Error(`Server Error: ${errText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream returned');

      const decoder = new TextDecoder('utf-8');
      const aiMsgId = crypto.randomUUID();
      let accumulatedText = '';

      // Create AI message placeholder
      set((s) => ({
        messages: [...s.messages, { id: aiMsgId, role: 'ai', text: '', timestamp: new Date().toISOString(), isStreaming: true }],
        isTyping: false
      }));

      // Stream loop
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]' || !dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textPart) {
                accumulatedText += textPart;
                set((s) => ({
                  messages: s.messages.map(m => m.id === aiMsgId ? { ...m, text: accumulatedText } : m)
                }));
              }
            } catch (e) {
              // Skip malformed chunks silently
            }
          }
        }
      }

      // Mark stream as finished
      set((s) => ({
        messages: s.messages.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m)
      }));

      // Persist AI message in background (fire-and-forget)
      if (accumulatedText) {
        supabase.from('hygenex_messages').insert({ user_id: userId, role: 'ai', text: accumulatedText }).then();
      }

    } catch (err) {
      console.error('[HygeneX] AI Error:', err);
      set((s) => ({
        messages: [...s.messages, {
          id: crypto.randomUUID(),
          role: 'ai',
          text: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString()
        }],
        isTyping: false
      }));
    }
  },

  resetChat: () => set({ messages: [WELCOME_MESSAGE], isTyping: false }),
}));

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hygenex-agent`;

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  metadata?: any;
  isStreaming?: boolean;
}

interface HygenexStore {
  messages: Message[];
  isTyping: boolean;
  realtimeChannel: any | null;
  metrics: {
    estates: number;
    activeAgents: number;
    segregationRate: number;
  };
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
  realtimeChannel: null,
  metrics: {
    estates: 12,
    activeAgents: 24,
    segregationRate: 72
  },

  initChat: async () => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    const channelName = `hygenex_realtime_${userId}_${Date.now()}`;

    const oldChannel = get().realtimeChannel;
    if (oldChannel) {
      supabase.removeChannel(oldChannel);
    }

    const saveHistory = localStorage.getItem('saveAiChatHistory') === 'true';

    if (!saveHistory) {
      await supabase.from('hygenex_messages').delete().eq('user_id', userId);
      set({ messages: [WELCOME_MESSAGE] });
    } else {
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

    const channel = supabase.channel(channelName);
    
    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hygenex_messages', filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const row = payload.new;
          if (row.role === 'ai') {
            set((s) => {
              const exists = s.messages.find((m) => m.id === row.id);
              if (exists) return s;
              return {
                messages: [...s.messages, { id: row.id, role: row.role, text: row.text, timestamp: row.created_at }],
                isTyping: false
              };
            });
          }
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  stopChat: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      set({ realtimeChannel: null });
    }
  },

  sendMessage: async (text) => {
    const { userId } = useAuthStore.getState();
    if (!userId || !text.trim()) return;

    const tempId = crypto.randomUUID();
    const userMsg: Message = { id: tempId, role: 'user', text, timestamp: new Date().toISOString() };
    set((s) => ({ messages: [...s.messages, userMsg], isTyping: true }));

    // Persist user message in background
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
        console.error('[HygeneX] AI Edge Function HTTP Error:', errText);
        throw new Error(`Server Error: ${errText}`);
      }

      // Check metadata header
      let metadata = null;
      const metadataHeader = res.headers.get('X-AI-Metadata');
      if (metadataHeader) {
        try { metadata = JSON.parse(decodeURIComponent(metadataHeader)); } catch (e) {}
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream returned');

      const decoder = new TextDecoder('utf-8');
      const aiMsgId = crypto.randomUUID();
      let accumulatedText = '';

      // Initialize AI message placeholder
      set((s) => ({
        messages: [...s.messages, { id: aiMsgId, role: 'ai', text: '', timestamp: new Date().toISOString(), isStreaming: true, metadata }],
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
        buffer = lines.pop() || ''; // Keep the incomplete last line in buffer
        
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
              console.warn('[HygeneX] Failed to parse SSE chunk:', dataStr, e);
            }
          }
        }
      }

      // Finish stream
      set((s) => ({
        messages: s.messages.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m)
      }));

      // Persist AI message in background
      if (accumulatedText) {
        supabase.from('hygenex_messages').insert({ user_id: userId, role: 'ai', text: accumulatedText }).then();
      }

    } catch (err) {
      console.error('[HygeneX] AI Error:', err);
      set({ isTyping: false });
    }
  },

  resetChat: () => set({ messages: [WELCOME_MESSAGE], isTyping: false }),
}));

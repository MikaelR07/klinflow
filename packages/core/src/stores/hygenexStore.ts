import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './authStore';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hygenex-agent`;

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
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

    const sendMessagePromise = (async () => {
      const { userId } = useAuthStore.getState();
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
        const errorData = await res.text();
        console.error('[HygeneX] AI Edge Function Error:', errorData);
        throw new Error('AI Response Failed');
      }

      return res.json();
    })();

    const persistUserMsgPromise = supabase.from('hygenex_messages').insert({
      user_id: userId,
      role: 'user',
      text
    });

    try {
      const [aiMsg] = await Promise.all([sendMessagePromise, persistUserMsgPromise]);
      
      set((s) => {
        const exists = s.messages.find(m => m.id === aiMsg.id);
        if (exists) return { isTyping: false };
        return {
          messages: [...s.messages, { 
            id: aiMsg.id, 
            role: aiMsg.role, 
            text: aiMsg.text, 
            timestamp: aiMsg.created_at 
          }],
          isTyping: false
        };
      });

    } catch (err) {
      console.error('[HygeneX] AI Error:', err);
      set({ isTyping: false });
    }
  },

  resetChat: () => set({ messages: [WELCOME_MESSAGE], isTyping: false }),
}));

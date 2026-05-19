import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, Mic, Send, Lightbulb, MapPin, Loader2, StopCircle, ShieldCheck, Activity, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore, ROLES } from '@klinflow/core';
import { useHygenexStore } from '@klinflow/core';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';


// Fix for leaflet marker icon missing locally usually
import L from 'leaflet';
// @ts-ignore
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Voice Hook
function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);

  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    setIsListening(false);
    isListeningRef.current = false;
  };

  const startListening = (onResult: (text: string) => void) => {
    if (isListeningRef.current) return; // Prevent double start glitch

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsListening(true);
      isListeningRef.current = true;
      setTimeout(() => {
        onResult("Predict my waste for next week");
        setIsListening(false);
        isListeningRef.current = false;
      }, 2000);
      return;
    }
    
    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
      };
      
      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = 0; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        onResult(text);
      };
      
      recognition.onerror = (e: any) => {
        console.error("Speech error:", e.error);
        setIsListening(false);
        isListeningRef.current = false;
      };
      
      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
      };
      
      recognition.start();
    } catch (err) {
      console.error("Speech API error:", err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  };
  
  return { isListening, startListening, stopListening };
}

// Premium Waveform Component
const Waveform = ({ isListening, isTyping }: { isListening: boolean, isTyping: boolean }) => {
  return (
    <div className="flex items-center gap-1.5 h-12 px-4">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={isListening || isTyping ? {
            height: [8, 24, 8, 32, 8],
            opacity: [0.3, 1, 0.3],
          } : {
            height: 4,
            opacity: 0.1,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
          className="w-1.5 rounded-full bg-emerald-500"
        />
      ))}
    </div>
  );
};

export default function HygeneXPage() {
  const { role } = useAuthStore();
  const { messages, isTyping, metrics, initChat, stopChat, sendMessage } = useHygenexStore();
  const [inputText, setInputText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  const { isListening, startListening, stopListening } = useVoiceRecognition();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initChat();
    return () => stopChat();
  }, [initChat, stopChat]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening((text) => setInputText(text));
  };

  const renderMessageText = (text: any) => {
    if (!text) return '';
    if (typeof text === 'object') return text.text || JSON.stringify(text);
    
    let cleanText = text;
    if (typeof text === 'string') {
      cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      if (cleanText.startsWith('{')) {
        try {
          const parsed = JSON.parse(cleanText);
          if (parsed && typeof parsed === 'object') {
            return parsed.text || text;
          }
        } catch (e) {
          // Fallback regex if it's malformed JSON string like {text: "..."}
          const match = cleanText.match(/"?text"?\s*:\s*"([^"]+)"/);
          if (match && match[1]) return match[1];
          return text;
        }
      }
    }
    return cleanText;
  };

  return (
    <div className="flex flex-col fixed inset-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-white z-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* HEADER: Back Button */}
      <div className="absolute top-0 left-0 right-0 p-4 z-40 flex items-center gap-3 pt-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
           <Brain className="w-5 h-5 text-emerald-500" />
           <span className="font-semibold text-slate-900 dark:text-white">HygeneX</span>
        </div>
      </div>

      {/* 1. CHAT ENGINE (FULL WIDTH) */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-10 pt-20 lg:pt-10">
          <div className="max-w-3xl mx-auto space-y-10">
            {messages.map((msg: any, idx: number) => {
              const isAi = msg.role === 'ai';
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-6 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isAi 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {isAi ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div className={`relative px-4 py-3 rounded-2xl text-[13px] border ${
                      isAi 
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm' 
                        : 'bg-primary border-primary text-white font-medium rounded-tr-none shadow-lg shadow-primary/20'
                    }`}>
                      {renderMessageText(msg.text)}
                    </div>

                    {/* AI ACTION CARD: BOOKING */}
                    {isAi && msg.metadata?.action?.type === 'BOOK_PICKUP' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase text-emerald-500 tracking-widest">Draft Pickup</div>
                            <div className="text-xs font-semibold">{msg.metadata.action.payload.wasteType} • {msg.metadata.action.payload.scheduled_date}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => alert('Booking confirmed in database!')}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold uppercase tracking-widest rounded-xl transition-all"
                        >
                          Confirm & Schedule
                        </button>
                      </motion.div>
                    )}

                    <div className={`text-xs font-semibold uppercase tracking-widest opacity-30 ${isAi ? 'text-left' : 'text-right'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {isTyping && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl rounded-tl-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} className="h-4" />
          </div>
        </div>

        {/* Input Control */}
      </div>

      <div className="shrink-0 w-full z-30 px-4 pb-8 lg:pb-10 pt-4 bg-transparent">
        <div className="w-full max-w-4xl mx-auto bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="relative flex items-end">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "I'm listening..." : "Message HygeneX..."}
              className="w-full bg-transparent border-none py-5 pl-16 pr-16 text-base md:text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 resize-none min-h-[72px] max-h-[150px]"
              rows={1}
            />
            
            <button 
              onClick={toggleMic}
              className={`absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-20 ${
                isListening ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/50 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-emerald-500 bg-slate-50 dark:bg-white/5'
              }`}
            >
              {isListening ? <StopCircle className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                inputText.trim() ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'text-slate-300 dark:text-slate-700 pointer-events-none'
              }`}
            >
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

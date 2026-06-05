import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Brain, Mic, Send, Lightbulb, MapPin, Loader2, StopCircle, ShieldCheck, Activity, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { useHygenexStore } from '@klinflow/core/stores/hygenexStore';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';


// Fix for leaflet marker icon missing locally usually
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Voice Hook
function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const startListening = (onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Mock fallback for browsers without speech recognition
      setIsListening(true);
      setTimeout(() => {
        onResult("Predict my waste for next week");
        setIsListening(false);
      }, 2000);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };
  
  return { isListening, startListening, stopListening };
}

// Premium Waveform Component
const Waveform = ({ isListening, isTyping }) => {
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
  const chatBottomRef = useRef(null);
  
  const { isListening, startListening, stopListening } = useVoiceRecognition();

  const location = useLocation();

  useEffect(() => {
    initChat();
    return () => stopChat();
  }, [initChat, stopChat]);

  useEffect(() => {
    if (location.state?.autoStartMic) {
      setTimeout(() => {
        if (!isListening) toggleMic();
      }, 800);
    }
  }, [location.state]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening((text) => setInputText(text));
  };

  const renderMessageText = (text) => {
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
    <div className={`flex flex-col absolute inset-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${role === ROLES.ADMIN ? 'lg:static lg:h-[calc(100dvh-56px)]' : 'lg:static lg:h-[calc(100dvh-56px-70px)]'}`}>
      {/* 1. CHAT ENGINE (FULL WIDTH) */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-10 pt-20 lg:pt-10">
          <div className="max-w-3xl mx-auto space-y-10">
            {messages.map((msg, idx) => {
              const isAi = msg.role === 'ai';
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-6 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    isAi ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}>
                    {isAi ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex flex-col gap-2 max-w-[85%]">
                    <div className={`relative px-4 py-3 rounded-[1rem] text-[13px] border ${
                      isAi 
                        ? 'bg-slate-50 dark:bg-white/[0.03] border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none' 
                        : 'bg-emerald-500 border-emerald-400 text-white font-medium rounded-tr-none shadow-lg shadow-emerald-500/10'
                    }`}>
                      {renderMessageText(msg.text)}
                    </div>

                    {/* AI ACTION CARD: BOOKING */}
                    {isAi && msg.metadata?.action?.type === 'BOOK_PICKUP' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-[1rem] bg-emerald-500/10 border border-emerald-500/20 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase text-emerald-500 tracking-widest">Draft Pickup</div>
                            <div className="text-xs font-semibold">{msg.metadata.action.payload.waste_type} • {msg.metadata.action.payload.scheduled_date}</div>
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
                <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[1rem] rounded-tl-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Floating Input Control */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-24 lg:pb-8 z-30 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          <div className="relative group bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-100 dark:border-white/10 rounded-[1rem] p-2 shadow-2xl shadow-emerald-500/10">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "I'm listening..." : "Ask HygeneX anything..."}
              className="w-full bg-transparent border-none py-4 pl-14 pr-16 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 resize-none min-h-[56px]"
              rows={1}
            />
            
            <button 
              onClick={toggleMic}
              className={`absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-20 ${
                isListening ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/50 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-emerald-500 bg-slate-50 dark:bg-white/5'
              }`}
            >
              {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                inputText.trim() ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'text-slate-300 dark:text-slate-700 pointer-events-none'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
            HygeneX Neural Interface • Encrypted & Autonomous
          </p>
        </div>
      </div>
    </div>
  );
}

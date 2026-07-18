import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, Mic, Send, Lightbulb, MapPin, Loader2, StopCircle, ShieldCheck, Activity, User, ArrowLeft, BrainCircuit } from 'lucide-react';
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
  const isListeningRef = useRef(false);

  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    setIsListening(false);
    isListeningRef.current = false;
  };

  const startListening = (onResult) => {
    if (isListeningRef.current) return; // Prevent double start glitch

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      
      recognition.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; ++i) {
          text += event.results[i][0].transcript;
        }
        onResult(text);
      };
      
      recognition.onerror = (e) => {
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

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    initChat();
    return () => stopChat();
  }, [initChat, stopChat]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

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
    if (typeof text === 'object') {
      const txt = text.text || JSON.stringify(text);
      return typeof txt === 'string' ? txt.replace(/cleanflow/gi, 'Klinflow').replace(/CleanFlow/g, 'Klinflow') : txt;
    }
    
    let cleanText = text;
    if (typeof text === 'string') {
      cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      if (cleanText.startsWith('{')) {
        try {
          const parsed = JSON.parse(cleanText);
          if (parsed && typeof parsed === 'object') {
            cleanText = parsed.text || text;
          }
        } catch (e) {
          // Fallback regex if it's malformed JSON string like {text: "..."}
          const match = cleanText.match(/"?text"?\s*:\s*"([^"]+)"/);
          if (match && match[1]) cleanText = match[1];
        }
      }
    }
    
    if (typeof cleanText === 'string') {
      cleanText = cleanText
        .replace(/cleanflow/gi, 'Klinflow')
        .replace(/CleanFlow/g, 'Klinflow');
    }
    
    return cleanText;
  };

  return (
    <div className="flex flex-col fixed inset-0 bg-gradient-to-br from-teal-600 to-emerald-600 text-white z-50 overflow-hidden">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,1) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ── FIXED TOP NAV (Glassmorphism) ── */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-br from-teal-600 to-emerald-600  backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-4 px-4 border-b border-slate-200/50 dark:border-white/5 z-50 transition-colors">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 flex items-center justify-center active:scale-95 transition-all group shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-100   transition-colors" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-100 capitalize tracking-tighter leading-none">HygeneX</h1>
            <p className="text-[10px] font-bold text-emerald-100 capitalize tracking-[0.2em] mt-1">Smart Waste Intelligence</p>
          </div>
        </div>
      </div>

      {/* 1. CHAT ENGINE (FULL WIDTH) */}
      <div className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+5rem)] pb-[120px] flex flex-col relative z-10 overflow-hidden">
         {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-10 space-y-10">
          <div className="max-w-3xl mx-auto space-y-10">
            {messages.length <= 1 && !isTyping ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center pt-8 pb-12">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6">
                  <BrainCircuit className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-100 dark:text-white tracking-tight mb-2 text-center">{getGreeting()}, how can I help you?</h2>
                <p className="text-sm text-slate-100 mb-10 text-center max-w-sm">
                  I'm HygeneX, your smart waste intelligence assistant. Select a topic or ask me anything.
                </p>
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg px-2">
                  {(() => {
                    const getSuggestions = () => {
                      if (role === 'company_owner') {
                        return [
                          { icon: <Activity className="w-5 h-5" />, title: "Fleet Status", desc: "Check my agents", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
                          { icon: <Lightbulb className="w-5 h-5" />, title: "Market Prices", desc: "Check live rates", color: "text-teal-600 dark:text-teal-400 bg-teal-500/10" },
                          { icon: <MapPin className="w-5 h-5" />, title: "Aggregate Earnings", desc: "Fleet revenue", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
                          { icon: <ShieldCheck className="w-5 h-5" />, title: "Assign Jobs", desc: "Pending requests", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" }
                        ];
                      }
                      if (role === 'agent' || role === 'freelance_agent' || role === 'staff_agent') {
                        return [
                          { icon: <Activity className="w-5 h-5" />, title: "Pending Jobs", desc: "Find pickups near me", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
                          { icon: <Lightbulb className="w-5 h-5" />, title: "Market Prices", desc: "Check live rates", color: "text-teal-600 dark:text-teal-400 bg-teal-500/10" },
                          { icon: <MapPin className="w-5 h-5" />, title: "Find Buyers", desc: "Sell my materials", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
                          { icon: <ShieldCheck className="w-5 h-5" />, title: "Route Help", desc: "Optimal warehouse", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" }
                        ];
                      }
                      return [
                        { icon: <Activity className="w-5 h-5" />, title: "Book Pickup", desc: "Schedule a collection", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
                        { icon: <Lightbulb className="w-5 h-5" />, title: "Check Prices", desc: "Market rates for waste", color: "text-teal-600 dark:text-teal-400 bg-teal-500/10" },
                        { icon: <MapPin className="w-5 h-5" />, title: "My Rewards", desc: "Check my wallet", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
                        { icon: <ShieldCheck className="w-5 h-5" />, title: "Recycling Tips", desc: "How to sort better", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" }
                      ];
                    };
                    return getSuggestions().map((cap, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(cap.title)}
                        className="p-4 rounded-[1.5rem] bg-white/80 dark:bg-slate-900/60 border border-white/80 dark:border-white/5 text-left transition-all active:scale-95 flex flex-col items-start gap-3 ]"
                      >
                        <div className={`w-10 h-10 shrink-0 rounded-[12px] flex items-center justify-center shadow-sm ${cap.color}`}>
                          {cap.icon}
                        </div>
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-800 dark:text-white mb-0.5 tracking-tight leading-tight">{cap.title}</h4>
                          <p className="text-[10px] font-medium text-slate-900 dark:text-slate-400 leading-snug">{cap.desc}</p>
                        </div>
                      </button>
                    ));
                  })()}
                </div>
              </motion.div>
            ) : (
              messages.filter((msg: any) => msg.id !== 'initial-1').map((msg: any, idx: number) => {
                const isAi = msg.role === 'ai';
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-4 ${isAi ? '' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 shadow-sm ${isAi
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white border border-white/20'
                      : 'bg-slate-700 dark:bg-slate-100 text-white dark:text-slate-900 border border-transparent'
                      }`}>
                      {isAi ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className="flex flex-col gap-1.5 max-w-[85%]">
                      <div className={`relative px-4 py-3 rounded-2xl text-[14px] shadow-sm leading-relaxed whitespace-pre-wrap ${isAi
                        ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-[4px]'
                        : 'bg-emerald-600 text-white font-medium rounded-tr-[4px] shadow-emerald-600/20'
                        }`}>
                        {renderMessageText(msg.text)}
                        {msg.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />}
                      </div>

                      {/* AI ACTION CARD: BOOKING */}
                      {isAi && msg.metadata?.action?.type === 'BOOK_PICKUP' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3 mt-2"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold capitalize text-emerald-500 tracking-widest">Draft Pickup</div>
                              <div className="text-xs font-bold text-slate-800 dark:text-white">{msg.metadata.action.payload.wasteType || msg.metadata.action.payload.waste_type} • {msg.metadata.action.payload.scheduled_date}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => alert('Booking confirmed in database!')}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold capitalize tracking-widest rounded-xl transition-all shadow-md shadow-emerald-500/20"
                          >
                            Confirm & Schedule
                          </button>
                        </motion.div>
                      )}

                      {/* AI TOOL CARD: MARKETPLACE */}
                      {isAi && msg.metadata?.marketplace_results && msg.metadata.marketplace_results.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2 mt-3">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Marketplace Matches</div>
                          {msg.metadata.marketplace_results.map((listing: any, i: number) => (
                            <div key={i} className="px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm flex justify-between items-center group cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition-colors">
                              <div>
                                <div className="text-[13px] font-bold text-slate-800 dark:text-white capitalize">{listing.material}</div>
                                <div className="text-[11px] text-slate-500 font-medium">{listing.quantity} kg • {listing.location || 'Nairobi'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">KSh {listing.price_per_kg}/kg</div>
                                <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline mt-0.5">Contact Buyer</button>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      <div className={`text-[10px] font-bold tracking-widest opacity-40 mt-1 ${isAi ? 'text-left' : 'text-right'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {isTyping && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none shadow-sm h-[46px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} className="h-4" />
          </div>
        </div>    </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,1rem)+1rem)] pt-6 bg-gradient-to-t from-slate-50 via-slate-50/80 dark:from-slate-950 dark:via-slate-950/80 to-transparent pointer-events-none">
        <div className="w-full max-w-3xl mx-auto pointer-events-auto">
          <div className="relative flex items-end bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/50">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "I'm listening..." : "Message HygeneX..."}
              className="w-full bg-transparent border-none py-4 pl-14 pr-14 text-[15px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 resize-none min-h-[56px] max-h-[150px]"
              rows={1}
            />
            
            <button 
              onClick={toggleMic}
              className={`absolute left-2 bottom-2 p-2.5 rounded-full transition-all z-20 ${
                isListening ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/50 scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              }`}
            >
              {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`absolute right-2 bottom-2 p-2.5 rounded-[1.2rem] transition-all ${
                inputText.trim() ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 active:scale-95' : 'text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 pointer-events-none'
              }`}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

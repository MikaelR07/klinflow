import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopTabs from '../../components/TopTabs';
import { 
  Brain, 
  Mic, 
  Send, 
  Lightbulb, 
  MapPin, 
  Loader2, 
  StopCircle, 
  ShieldCheck, 
  Activity, 
  User, 
  TrendingUp, 
  Building2, 
  Package 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore, useHygenexStore, ROLES } from '@klinflow/core';

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

export default function HygeneXPage() {
  const role = useAuthStore(s => s.role);
  const messages = useHygenexStore(s => s.messages);
  const isTyping = useHygenexStore(s => s.isTyping);
  const initChat = useHygenexStore(s => s.initChat);
  const stopChat = useHygenexStore(s => s.stopChat);
  const sendMessage = useHygenexStore(s => s.sendMessage);

  const [inputText, setInputText] = useState("");
  const chatBottomRef = useRef(null);
  const { isListening, startListening, stopListening } = useVoiceRecognition();
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
    <div className={`flex flex-col absolute inset-0 bg-[#F4F4F4] dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300 ${role === ROLES.ADMIN ? 'lg:static lg:h-[calc(100dvh-56px)]' : 'lg:static lg:h-[calc(100dvh-56px-70px)]'}`}>
      
      {/* ── HEADER ── */}
      <div className="relative z-20 bg-[#F4F4F4]/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-black/5 dark:border-white/5 pt-2">
        <TopTabs active="/hygenex" />
      </div>

      {/* ── BACKDROP ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
          style={{ 
            backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px), radial-gradient(#3b82f6 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px'
          }} 
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] rounded-full opacity-50" />
      </div>

      {/* ── CHAT ENGINE ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-10 space-y-10 pt-24">
          <div className="w-full">
            
            {/* Top Label */}
            {messages.length <= 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 pl-1"
              >
                <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                  Smart sourcing in <span className="text-blue-600 dark:text-blue-400">AI mode</span>
                </span>
              </motion.div>
            )}

            {/* Hero Message Card (First in List) */}
            {messages.length <= 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl py-2.5 px-4 w-fit max-w-full"
              >
                <h1 className="text-[15px] font-black leading-tight text-slate-900 dark:text-transparent dark:bg-gradient-to-r dark:from-white dark:to-white/60 dark:bg-clip-text whitespace-nowrap overflow-hidden text-ellipsis">
                  Your Next Reliable Supplier Is Here
                </h1>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-widest">
                  Look no further for your custom inquiries
                </p>
              </motion.div>
            )}

            {/* Business Discovery Menu (Vertical List on the Left) */}
            {messages.length <= 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2 mb-10 max-w-[280px]"
              >
                {[
                  { title: 'Analyze Sellers', desc: 'Verify reputation', icon: ShieldCheck, color: 'text-blue-600 dark:text-blue-400', width: 'w-full' },
                  { title: 'Product Search', desc: 'Find bulk materials', icon: Package, color: 'text-emerald-600 dark:text-emerald-400', width: 'w-[90%]' },
                  { title: 'Verified Weavers', desc: 'Search certified', icon: Building2, color: 'text-indigo-600 dark:text-indigo-400', width: 'w-[95%]' },
                  { title: 'Search Prices', desc: 'Market analysis', icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', width: 'w-[85%]' }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => sendMessage(item.title)}
                    className={`flex items-center gap-3 py-1.5 px-3 bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm dark:shadow-none rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/10 transition-all group ${item.width}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider leading-none mb-0.5">{item.title}</div>
                      <div className="text-xs text-slate-500 font-medium leading-none">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            <div className="space-y-10">
              {messages.filter(m => !m.text?.includes("Hello! I'm HygeneX")).map((msg, idx) => {
                const isAi = msg.role === 'ai';
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isAi ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-white/5 border-black/5 dark:border-white/10 text-slate-500 dark:text-slate-400'
                    }`}>
                      {isAi ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex flex-col gap-2 max-w-[85%]">
                      <div className={`relative px-4 py-3 rounded-2xl text-[13px] border ${
                        isAi 
                          ? 'bg-white dark:bg-white/5 border-black/5 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-tl-none shadow-sm dark:shadow-none' 
                          : 'bg-blue-600 border-blue-500 text-white rounded-tr-none shadow-md'
                      }`}>
                        {renderMessageText(msg.text)}
                      </div>
                      <div className={`text-xs font-semibold uppercase tracking-widest opacity-30 ${isAi ? 'text-left' : 'text-right'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {isTyping && (
              <div className="flex gap-4 mt-10">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* ── FOOTER COCKPIT ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 z-30 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-1">
            {['Recent Arrivals', 'Price Trends', 'Specializations'].map((chip) => (
              <button 
                key={chip}
                onClick={() => sendMessage(chip)}
                className="whitespace-nowrap px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-blue-400 uppercase tracking-wider transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="relative group bg-white dark:bg-slate-800/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-3xl p-1.5 shadow-xl dark:shadow-2xl">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening..." : "Command HygeneX..."}
              className="w-full bg-transparent border-none py-3 pl-12 pr-16 text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-0 resize-none min-h-[50px] max-h-[150px]"
              rows={1}
            />
            
            <button 
              onClick={toggleMic}
              className={`absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-20 ${
                isListening ? 'bg-blue-500 text-white animate-pulse' : 'text-slate-400 dark:text-slate-500 hover:text-blue-500 bg-black/5 dark:bg-white/5'
              }`}
            >
              {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                inputText.trim() ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 dark:text-slate-700 pointer-events-none'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

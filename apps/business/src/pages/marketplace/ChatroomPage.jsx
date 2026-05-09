/**
 * Chatroom Page — Community Trading Floor
 * A place for weavers and aggregators to discuss market trends and coordinate.
 */
import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  MessageCircle, 
  Users, 
  Hash, 
  ShieldCheck,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import TopTabs from '../../components/TopTabs.jsx';

const MOCK_MESSAGES = [
  { id: 1, user: "Kamau (Bulk PET)", text: "Anyone looking for 5 tons of clear PET? Just landed in Industrial Area.", time: "09:15 AM", type: "text" },
  { id: 2, user: "Sarah Eco", text: "What's the current gate price for HDPE pellets?", time: "09:20 AM", type: "text" },
  { id: 3, user: "Maina Recyclers", text: "We are buying at KSh 45/kg for bulk quantities (> 2 tons).", time: "09:22 AM", type: "text" },
  { id: 4, user: "Kamau (Bulk PET)", text: "Sent you a DM Maina.", time: "09:25 AM", type: "text" },
];

export default function ChatroomPage() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now(),
      user: "You",
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text",
      isMe: true
    };
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="flex flex-col absolute inset-0 bg-[#F4F4F4] dark:bg-slate-900 overflow-hidden">
      {/* Header Area */}
      <div className="bg-[#F4F4F4]/80 dark:bg-slate-900/80 backdrop-blur-xl pt-2 pb-2 px-0 relative z-10 border-b border-slate-200 dark:border-slate-800">
        <TopTabs active="/chatroom" />
        <div className="px-3 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">42 Online</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-md">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-black text-emerald-600 uppercase">Market Active</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-28">
        <div className="flex flex-col gap-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                {!msg.isMe && <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{msg.user}</span>}
                <span className="text-xs text-slate-400 font-medium">{msg.time}</span>
              </div>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs font-medium ${
                msg.isMe 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10' 
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-24 z-20">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-3xl p-1.5 shadow-xl">
            <button className="p-2.5 text-slate-400 hover:text-indigo-500 transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Broadcast to trade floor..."
              className="flex-1 bg-transparent border-none py-2 px-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`p-2.5 rounded-full transition-all ${
                inputText.trim() 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' 
                  : 'text-slate-300 pointer-events-none'
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

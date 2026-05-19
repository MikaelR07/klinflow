/**
 * Create RFQ — Industrial Broadcast Terminal
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Send, Scale, TrendingUp, 
  FileText, ShieldCheck, Info, MapPin,
  Package, Calendar, CheckCircle2, Plus
} from 'lucide-react';
import { toast } from 'sonner';

export default function CreateRFQ() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    material: '',
    quantity: '',
    targetPrice: '',
    location: '',
    deadline: '',
    description: ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.material || !formData.quantity || !formData.targetPrice) {
      toast.error("Please fill in the core requirements");
      return;
    }

    setIsSubmitting(true);
    // Simulate API Broadcast
    setTimeout(() => {
      toast.success("Broadcast Sent! 🚀", {
        description: "Your sourcing request is now live in the Global Hub."
      });
      navigate('/procurement');
    }, 1500);
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
      <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 min-h-screen relative animate-fade-in flex flex-col">
        
        {/* ── HEADER ── */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-800 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Broadcast Request</h1>
          <div className="w-10" />
        </div>

        {/* ── FORM CONTENT ── */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-8 p-6 pb-32">
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Create Sourcing Request</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Broadcast your requirements to verified suppliers</p>
          </div>

          {/* Core Details */}
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Material Category</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="text"
                  placeholder="e.g. PET Plastic Grade A"
                  value={formData.material}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Target Volume (KG)</label>
                <div className="relative">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                  <input 
                    type="number"
                    placeholder="5,000"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="relative">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Target Price /KG</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input 
                    type="number"
                    placeholder="45"
                    value={formData.targetPrice}
                    onChange={(e) => setFormData({...formData, targetPrice: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Material Visualization Upload */}
          <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" /> Material Visualization
            </h3>
            
            <div className="relative group">
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {image ? (
                <div className="relative h-48 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner bg-slate-50 dark:bg-slate-800">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-black text-white uppercase tracking-widest">Change Image</p>
                  </div>
                </div>
              ) : (
                <div className="h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Upload Material Photo</p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">High-quality images increase bid rates</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logistics */}
          <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" /> Logistics & Timeline
            </h3>
            
            <div className="relative">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Loading Location</label>
              <input 
                type="text"
                placeholder="e.g. Mombasa Port, KE"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            <div className="relative">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Closing Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input 
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Brief */}
          <div className="space-y-2 pt-6 border-t border-slate-50 dark:border-slate-800">
            <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> Technical Brief
            </label>
            <textarea 
              rows={4}
              placeholder="Detail your quality requirements, packaging needs, and specific material grades..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Trusted Badge */}
          <div className="bg-blue-600/5 border border-blue-600/10 p-4 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-xs font-bold text-blue-600/80 leading-relaxed uppercase tracking-wider">
              Klinflow Verified Broadcast: All sourcing requests are screened for industrial legitimacy. Suppliers are notified instantly upon publication.
            </p>
          </div>

        </form>

        {/* ── ACTION TERMINAL ── */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl z-50">
          <div className="max-w-lg mx-auto">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.2em] transition-all ${
                isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Info className="w-5 h-5" /></motion.div>
              ) : (
                <>Broadcast Request <Send className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

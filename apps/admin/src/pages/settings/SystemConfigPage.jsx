import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, Settings2, Phone, 
  MessageCircle, Clock, Calendar, Check, X, Shield 
} from 'lucide-react';
import { useSystemStore } from '@cleanflow/core';
import { toast } from 'sonner';

export default function SystemConfigPage() {
  const navigate = useNavigate();
  const { 
    supportPhone, whatsappNumber, operatingHours, 
    updateSupportContacts, updateOperatingHours, fetchConfig 
  } = useSystemStore();
  
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    hours: operatingHours
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    setForm({
      hours: operatingHours
    });
  }, [operatingHours]);

  const toggleDay = (day) => {
    const newHours = { ...form.hours };
    newHours[day].active = !newHours[day].active;
    setForm({ ...form, hours: newHours });
  };

  const updateTime = (day, field, value) => {
    const newHours = { ...form.hours };
    newHours[day][field] = value;
    setForm({ ...form, hours: newHours });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateOperatingHours(form.hours);
      toast.success('Operating Hours Updated', { description: 'Schedule updated globally.' });
      navigate('/settings');
    } catch (err) {
      toast.error('Failed to save', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="animate-slide-up pb-20 px-4 max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-8 pt-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold dark:text-white tracking-tight">System Configuration</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Global Fleet & Support Controls</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: INFO & SAVE */}
        <div className="space-y-6">
          <div className="card p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl">
             <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-widest">Pricing & Hours Policy</h3>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
               Operating hours affect all live apps immediately. Ensure your team is available during the active slots to maintain service quality.
             </p>
             <button onClick={handleSave} disabled={isLoading} className="w-full mt-8 py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-primary/20">
               {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
               SAVE OPERATING HOURS
             </button>
          </div>
        </div>

        {/* RIGHT COLUMN: OPERATING HOURS */}
        <div className="card p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider">Operating Hours</h2>
           </div>

           <div className="space-y-4">
              {!form.hours ? (
                <div className="py-10 text-center">
                   <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" />
                   <p className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-widest">Loading Schedule...</p>
                </div>
              ) : days.map(day => (
                <div key={day} className={`p-4 rounded-2xl border transition-all ${form.hours[day]?.active ? 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/5' : 'bg-white dark:bg-slate-950 border-dashed border-slate-200 opacity-50'}`}>
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-900 dark:text-white">{day}</span>
                      <button 
                        onClick={() => toggleDay(day)}
                        className={`w-10 h-6 rounded-full relative transition-colors ${form.hours[day]?.active ? 'bg-primary' : 'bg-slate-300'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.hours[day]?.active ? 'right-1' : 'left-1'}`} />
                      </button>
                   </div>
                   
                   {form.hours[day]?.active && (
                     <div className="flex items-center gap-3">
                        <div className="flex-1">
                           <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Start Time</p>
                           <input 
                             type="time" 
                             value={form.hours[day]?.start || '08:00'} 
                             onChange={(e) => updateTime(day, 'start', e.target.value)}
                             className="w-full bg-white dark:bg-slate-900 p-2 rounded-lg text-xs font-semibold border border-slate-100 outline-none"
                           />
                        </div>
                        <div className="flex-1">
                           <p className="text-xs font-semibold text-slate-400 uppercase mb-1">End Time</p>
                           <input 
                             type="time" 
                             value={form.hours[day]?.end || '18:00'} 
                             onChange={(e) => updateTime(day, 'end', e.target.value)}
                             className="w-full bg-white dark:bg-slate-900 p-2 rounded-lg text-xs font-semibold border border-slate-100 outline-none"
                           />
                        </div>
                     </div>
                   )}
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}

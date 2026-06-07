import { OptimizedImage } from "@klinflow/ui";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Scale, Coins, Truck, CheckCircle2, XCircle, MapPin, Package, MessageSquare, Pencil, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@klinflow/core/lib/supabaseClient';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { getSubcategoryLabel } from '@klinflow/core/data/wasteDefinitions';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { LoadingScreen } from '@klinflow/ui/components/Loading';

export default function SubmittedQuoteDetailsPage() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories } = useServiceStore();

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterialPrices();
    fetchCategories();
  }, [fetchMaterialPrices, fetchCategories]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuoteDetails = async () => {
      if (!quoteId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('rfq_offers')
        .select(`
          id, rfq_id, offered_price, offered_weight, status, created_at, images, notes,
          rfq:rfqs(
            material_grade, category, pickup_area, target_price,
            buyer:profiles!buyer_id(company_name, name)
          ),
          fulfillment_orders(status)
        `)
        .eq('id', quoteId)
        .single();

      if (data) {
        let computedStatus = data.status;
        if (computedStatus === 'accepted' && data.fulfillment_orders?.[0]) {
          const fulfillmentStatus = data.fulfillment_orders[0].status;
          if (['completed', 'pickup_completed', 'delivered'].includes(fulfillmentStatus)) {
            computedStatus = 'completed';
          }
        }
        
        setQuote({
          id: data.id,
          rfqId: data.rfq_id,
          company: data.rfq?.buyer?.company_name || data.rfq?.buyer?.name || 'Unknown Buyer',
          materialId: data.rfq?.material_grade,
          categoryId: data.rfq?.category,
          location: data.rfq?.pickup_area || '',
          quantity: `${data.offered_weight}kg`,
          rawWeight: data.offered_weight,
          quotedPrice: data.offered_price,
          status: computedStatus,
          submittedAt: new Date(data.created_at).toLocaleString(),
          clientTargetPrice: data.rfq?.target_price || 0,
          message: data.notes || '',
          imageUrls: data.images || []
        });
      }
      setLoading(false);
    };

    fetchQuoteDetails();

    // Realtime updates for status
    const channel = supabase.channel(`quote_detail_${quoteId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rfq_offers',
        filter: `id=eq.${quoteId}`
      }, () => {
        fetchQuoteDetails();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [quoteId]);

  if (loading) return <LoadingScreen message="Loading Quote Details..." />;
  if (!quote) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeImageIndex) {
      setActiveImageIndex(newIndex);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', label: 'Pending Review' },
    accepted: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Offer Accepted' },
    completed: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', label: 'Completed' },
    declined: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Offer Declined' },
  }[quote.status as 'pending' | 'accepted' | 'completed' | 'declined'];
  const StatusIcon = statusConfig.icon;

  const openEditModal = () => {
    setEditPrice(quote.quotedPrice.toString());
    setEditWeight(quote.rawWeight.toString());
    setEditNotes(quote.message);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const price = parseFloat(editPrice);
    const weight = parseFloat(editWeight);

    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (isNaN(weight) || weight <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('rfq_offers')
      .update({
        offered_price: price,
        offered_weight: weight,
        notes: editNotes || null,
      })
      .eq('id', quoteId);

    setSaving(false);

    if (error) {
      toast.error('Failed to update quote');
      return;
    }

    // Update local state
    setQuote((prev: any) => ({
      ...prev,
      quotedPrice: price,
      rawWeight: weight,
      quantity: `${weight}kg`,
      message: editNotes,
    }));
    setIsEditing(false);
    toast.success('Quote updated successfully!');
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('rfq_offers')
      .delete()
      .eq('id', quoteId);

    if (error) {
      toast.error('Failed to delete quote');
      return;
    }

    toast.success('Quote deleted successfully');
    navigate(-1);
  };

  return (
    <div className="flex flex-col max-w-lg mx-auto bg-slate-50 dark:bg-slate-800 pb-8 transition-colors">
      {/* ── IMAGE PREVIEW AT THE TOP (EDGE-TO-EDGE & TOP-COVERED) ── */}
      <div
        className="relative h-[350px] w-full overflow-hidden border-b border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900"
      >
        {quote.imageUrls && quote.imageUrls.length > 0 ? (
          <div
            onScroll={handleScroll}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
          >
            {quote.imageUrls.map((url: string, index: number) => (
              <div key={index} className="w-full h-full shrink-0 snap-center">
                <OptimizedImage
                  src={url}
                  alt={`${materialPrices?.find(m => m.id === quote.materialId)?.material_name || getSubcategoryLabel(quote.categoryId, quote.materialId) || quote.materialId} view ${index + 1}`}
                  className="w-full h-full object-cover"
                  wrapperClassName="w-full h-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
            <Package className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-xs font-bold tracking-wider uppercase">No Images Provided</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-[calc(env(safe-area-inset-top,1rem)+0.6rem)] left-4 w-10 h-10 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md active:scale-95 transition-all z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {quote.imageUrls && quote.imageUrls.length > 1 && (
          <div className="absolute top-[calc(env(safe-area-inset-top,1rem)+0.6rem)] right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
            <span>{activeImageIndex + 1} / {quote.imageUrls.length}</span>
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
          </div>
        )}

        {quote.imageUrls && quote.imageUrls.length > 1 && (
          <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5 z-10">
            {quote.imageUrls.map((_: any, index: number) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === activeImageIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/40'
                  }`}
              />
            ))}
          </div>
        )}

      </div>

      <div className="space-y-4 px-1.5 mt-2">
        {/* ── DETAIL CARD BELOW ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          {/* Material & Status */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Submitted Quote</p>
              <h2 className="text-[17px] font-black text-slate-900 dark:text-white capitalize leading-tight">
                {materialPrices?.find(m => m.id === quote.materialId)?.material_name || getSubcategoryLabel(quote.categoryId, quote.materialId) || quote.materialId}
              </h2>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
              <StatusIcon className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">{statusConfig.label}</span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Client Info */}
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Client Name</p>
            <h3 className="text-sm font-black text-slate-900 dark:text-white capitalize leading-none">{quote.company}</h3>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-2">
              <MapPin className="w-3.5 h-3.5" /> {quote.location}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Coins className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Your Quoted Price</p>
                <p className="text-xs font-black text-emerald-600 leading-none">KSh {quote.quotedPrice}/kg</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Client Target</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">KSh {quote.clientTargetPrice}/kg</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Requested Weight</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{quote.quantity}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Submitted On</p>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{quote.submittedAt}</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {quote.message && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Attached Message</p>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-px" />
                <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">{quote.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="mb-2">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Actions</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">Manage your quote submission</p>
          </div>

          {['accepted', 'completed'].includes(quote.status) && (
            <button
              onClick={async () => {
                const { data } = await supabase
                  .from('fulfillment_orders')
                  .select('id')
                  .eq('proposal_id', quoteId)
                  .maybeSingle();

                if (data?.id) {
                  navigate(`/fulfillment/${data.id}`);
                } else {
                  toast.error("Delivery schedule is still being generated.");
                }
              }}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {quote.status === 'completed' ? 'View Completed Progress' : 'View Delivery Schedule'}
            </button>
          )}

          {quote.status === 'declined' && (
            <button className="w-full py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-sm active:scale-[0.98] transition-all">
              Find Similar RFQs
            </button>
          )}

          {quote.status === 'pending' && (
            <div className="flex flex-row gap-3">
              <button
                onClick={openEditModal}
                className="flex-1 py-4 bg-primary hover:bg-primary/95 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Edit Quote
              </button>
              <button
                onClick={handleDelete}
                className="flex-[0.6] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── EDIT QUOTE MODAL ── */}
      {isEditing && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">Edit Quote</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Update your offer details</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-95 transition-all">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Offered Price (KSh/kg)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="e.g. 45"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Offered Weight (kg)</label>
                <input
                  type="number"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="e.g. 100"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Notes (Optional)</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                  placeholder="Any additional details..."
                />
              </div>
            </div>

            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="w-full py-4 bg-primary hover:bg-primary/95 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

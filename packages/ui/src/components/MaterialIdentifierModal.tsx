/**
 * MaterialIdentifierModal — AI-powered material identification tool for agents.
 * Purely informational: camera → scan → educational info card.
 * Does NOT handle payments or pricing.
 */
import React, { useState, useRef } from 'react';
import {
  Camera,
  X,
  Sparkles,
  Leaf,
  HandMetal,
  Info,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Brain,
  Image
} from 'lucide-react';
import { supabase, useServiceStore, useAgentStore, useAuthStore } from '@klinflow/core';

interface MaterialIdentifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToPayment: (prefillCategory: string | null) => void;
  materialHint?: string;
}

interface AIResult {
  material_name: string;
  matched_category: string | null;
  grade: string;
  grade_reason: string;
  description: string;
  recyclability: string;
  handling_tips: string;
}

type Step = 'camera' | 'scanning' | 'result';

export default function MaterialIdentifierModal({ isOpen, onClose, onProceedToPayment, materialHint }: MaterialIdentifierModalProps) {
  const { categories } = useServiceStore();
  const { agentConfig } = useAgentStore();
  const { profile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('camera');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Build valid materials from agent's configured categories
  const validMaterials = React.useMemo(() => {
    let acceptedSlugs: string[] = [];

    if (agentConfig?.accepted_materials && Array.isArray(agentConfig.accepted_materials) && agentConfig.accepted_materials.length > 0) {
      acceptedSlugs = agentConfig.accepted_materials.map((m: string) => m.toLowerCase());
    } else {
      const targetProfile = profile;
      const serviceProfile = (targetProfile as any)?.service_profile;
      if (serviceProfile?.categories && Array.isArray(serviceProfile.categories)) {
        acceptedSlugs = serviceProfile.categories.filter((c: any) => c.enabled).map((c: any) => c.name.toLowerCase());
      }
    }

    if (acceptedSlugs.length === 0) {
      return categories.map((c: any) => c.label);
    }

    return categories
      .filter((cat: any) => acceptedSlugs.includes(cat.slug) || acceptedSlugs.includes(cat.id))
      .map((cat: any) => cat.label);
  }, [categories, agentConfig, profile]);

  // Map category labels back to slugs/ids for pre-fill
  const getCategorySlug = (label: string | null): string | null => {
    if (!label) return null;
    const match = categories.find((c: any) =>
      c.label.toLowerCase() === label.toLowerCase() ||
      c.slug === label.toLowerCase() ||
      c.id === label.toLowerCase()
    );
    return match ? (match.slug || match.id) : null;
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startScan = async () => {
    if (!photoFile) return;
    setStep('scanning');
    setError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(photoFile);
      });
      const imageBase64 = await base64Promise;

      // Call HygeneX Vision
      const { data: { session } } = await supabase.auth.getSession();
      const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hygenex-agent`;

      const response = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          type: 'vision_scan',
          userId: profile?.id,
          payload: {
            imageBase64,
            materialHint: materialHint || 'unknown',
            validMaterials
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MaterialID] Server Error:', errorText);
        throw new Error('AI scan failed. Please try again.');
      }

      const analysis: AIResult = await response.json();
      setAiResult(analysis);
      setStep('result');
    } catch (err) {
      console.error('[MaterialID] Error:', err);
      setError((err as Error).message || 'Something went wrong. Please try again.');
      setStep('camera');
    }
  };

  const handleRetake = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setAiResult(null);
    setError(null);
    setStep('camera');
  };

  const handleClose = () => {
    handleRetake();
    onClose();
  };

  const isAccepted = aiResult?.matched_category && aiResult.matched_category !== 'null';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[1rem] md:rounded-[1rem] shadow-2xl overflow-hidden animate-slide-up pb-[env(safe-area-inset-bottom)]">

        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-none">Material Identifier</h3>
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">HygeneX Vision Engine</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 active:scale-95 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">

          {/* ── CAMERA STEP ── */}
          {step === 'camera' && (
            <div className="p-5 space-y-4">
              {/* Photo Preview / Capture Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer active:scale-[0.99] transition-all ${
                  photoPreview
                    ? 'border-blue-500/30'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Camera className="w-7 h-7 text-blue-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Tap to take a photo</p>
                    <p className="text-[10px] font-semibold text-slate-400 max-w-[200px] text-center leading-relaxed">
                      Point your camera at the recyclable material for identification
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {!photoPreview && (
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full py-4 bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    <Image className="w-4 h-4" />
                    Upload from Gallery
                  </button>
                )}
                
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />

                <button
                  onClick={startScan}
                  disabled={!photoFile}
                  className="w-full py-4 bg-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none uppercase tracking-widest"
                >
                  <Sparkles className="w-4 h-4" />
                  Identify Material
                </button>
                
                {photoPreview && (
                  <button
                    onClick={handleRetake}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs rounded-xl active:scale-95 transition-all uppercase tracking-widest"
                  >
                    Retake Photo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── SCANNING STEP ── */}
          {step === 'scanning' && (
            <div className="py-20 flex flex-col items-center text-center px-6">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <Brain className="absolute inset-0 m-auto w-8 h-8 text-blue-500" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Analyzing Material...</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">HygeneX Vision Engine Active</p>
            </div>
          )}

          {/* ── RESULT STEP ── */}
          {step === 'result' && aiResult && (
            <div className="space-y-0">
              {/* Photo thumbnail */}
              {photoPreview && (
                <div className="h-32 overflow-hidden relative">
                  <img src={photoPreview} alt="Scanned" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
                </div>
              )}

              {/* Material Name & Category */}
              <div className="px-5 pt-4 pb-3">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Identified Material</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{aiResult.material_name}</h3>
                {isAccepted ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                    <Leaf className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Category: {aiResult.matched_category}
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      Not in your accepted materials
                    </span>
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="px-5 pb-4 space-y-2.5">
                {/* Grade */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                      aiResult.grade === 'A' ? 'bg-emerald-500' : aiResult.grade === 'B' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}>
                      {aiResult.grade}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality Grade</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{aiResult.grade_reason}</p>
                </div>

                {/* Description */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">About This Material</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{aiResult.description}</p>
                </div>

                {/* Recyclability */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Leaf className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recyclability</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{aiResult.recyclability}</p>
                </div>

                {/* Handling Tips */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-1.5">
                    <HandMetal className="w-4 h-4 text-violet-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Handling Tips</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{aiResult.handling_tips}</p>
                </div>
              </div>

              {/* Not Accepted Warning */}
              {!isAccepted && (
                <div className="mx-5 mb-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Cannot Purchase This Material</p>
                      <p className="text-[11px] font-medium text-amber-700/70 dark:text-amber-400/70 leading-relaxed">
                        Your system is not configured to accept this material. Please update your accepted materials in Settings to enable purchasing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-5 pb-5 space-y-2">
                {isAccepted ? (
                  <button
                    onClick={() => {
                      const slug = getCategorySlug(aiResult.matched_category);
                      handleRetake();
                      onClose();
                      onProceedToPayment(slug);
                    }}
                    className="w-full py-4 bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    Proceed to Payment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleClose}
                    className="w-full py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={handleRetake}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Scan Another Material
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

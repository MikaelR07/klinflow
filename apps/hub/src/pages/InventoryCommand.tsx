import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { compressImage } from '@klinflow/core/utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Warehouse, Layers, Box, Calendar, ChevronDown, ChevronRight, Filter, Download,
  TrendingUp, AlertTriangle, Activity, Package, Plus, Search, RefreshCw,
  Scale, BadgeDollarSign, MapPin, Tag, CheckCircle2, ArrowRight, X, Image as ImageIcon,
  Sparkles, SlidersHorizontal,ChevronLeft, Trash2
} from 'lucide-react';

interface MaterialStockItem {
  id: string;
  material_id: string;
  material_name: string;
  category_name: string;
  unprocessed_kg: number;
  processed_kg: number;
  total_kg: number;
  unit_price_kes: number;
  estimated_value_kes: number;
  location: string;
  is_negotiable: boolean;
  proof_images: string[];
  last_updated: string;
  grade: string;
}

interface InventoryHistoryLog {
  id: string;
  type: 'processing_received' | 'sent_to_processing' | 'manual_addition' | 'stock_audit' | 'sent_to_sales';
  material_name: string;
  category_name: string;
  weight_kg: number;
  details: string;
  timestamp: string;
  operator_name?: string;
}

type StockStatusFilter = 'all' | 'processed' | 'unprocessed';

export default function InventoryCommand() {
  const { isDarkMode } = useThemeStore();
  const { profile, currentCompanyId } = useAuthStore();
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const { categories, fetchCategories, materialPrices = [], fetchMaterialPrices } = useServiceStore();
  const navigate = useNavigate();
  const companyId = currentCompanyId;

  // Hub Default Location
  const hubDefaultLocation = (profile as any)?.hubConfig?.address || 'Main Facility (Bale Yard)';

  // Core State
  const [items, setItems] = useState<MaterialStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Modals State
  const [processingModalOpen, setProcessingModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);
  const [confirmProcessBatchOpen, setConfirmProcessBatchOpen] = useState(false);
  const [confirmPublishSalesOpen, setConfirmPublishSalesOpen] = useState(false);
  const [isPublishingSales, setIsPublishingSales] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Form State for New Stock Modal
  const [newCatName, setNewCatName] = useState('Plastics');
  const [customCatName, setCustomCatName] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [newMatNameSelect, setNewMatNameSelect] = useState('');
  const [customMatName, setCustomMatName] = useState('');
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);

  const [newStockState, setNewStockState] = useState<'raw' | 'processed'>('raw');
  const [newStockWeight, setNewStockWeight] = useState('');
  const [newPriceKes, setNewPriceKes] = useState('45');
  const [newLocation, setNewLocation] = useState(hubDefaultLocation);
  const [newGradeSelect, setNewGradeSelect] = useState('Standard');
  const [customGrade, setCustomGrade] = useState('');
  const [isCustomGrade, setIsCustomGrade] = useState(false);

  // Form State for Processing Modal
  const [weightToProcess, setWeightToProcess] = useState('');
  const [machineLine, setMachineLine] = useState('Baler Press #1');

  // Form State for Audit Modal
  const [auditRawKg, setAuditRawKg] = useState('');
  const [auditProcessedKg, setAuditProcessedKg] = useState('');
  const [auditReason, setAuditReason] = useState('Physical Floor Scale Audit');
  const [auditNote, setAuditNote] = useState('');

  // Modal State for Category Sub-materials Modal
  const [activeCategoryModal, setActiveCategoryModal] = useState<string | null>(null);
  const [modalSubmatSearch, setModalSubmatSearch] = useState('');
  const [modalStockFilter, setModalStockFilter] = useState<'all' | 'processed' | 'unprocessed'>('all');
  const [modalDetailItem, setModalDetailItem] = useState<MaterialStockItem | null>(null);

  // New Stock Proof Images Upload State
  const [newProofImages, setNewProofImages] = useState<string[]>([]);
  const [isUploadingNewProof, setIsUploadingNewProof] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // Inventory Movement & Processing History Ledger State
  const [historyLogs, setHistoryLogs] = useState<InventoryHistoryLog[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'processing' | 'transfers' | 'audits'>('all');
  const [historySearch, setHistorySearch] = useState('');

  const filteredHistoryLogs = useMemo(() => {
    return historyLogs.filter(log => {
      // 1. Tab Filter
      if (historyFilter === 'processing' && !['processing_received', 'sent_to_processing'].includes(log.type)) return false;
      if (historyFilter === 'transfers' && log.type !== 'manual_addition') return false;
      if (historyFilter === 'audits' && log.type !== 'stock_audit') return false;

      // 2. Search query
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase();
      return (
        log.material_name.toLowerCase().includes(q) ||
        log.category_name.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.operator_name || '').toLowerCase().includes(q)
      );
    });
  }, [historyLogs, historyFilter, historySearch]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAgentConfig();
    fetchCategories();
    fetchMaterialPrices();
  }, [fetchAgentConfig, fetchCategories, fetchMaterialPrices]);

  // Hub Config Categories
  const hubCategories = useMemo(() => {
    const acceptedSlugs = agentConfig?.accepted_materials || [];
    if (!acceptedSlugs || acceptedSlugs.length === 0) return categories;
    const valid = categories.filter(c => acceptedSlugs.includes(c.slug || c.id));
    return valid.length > 0 ? valid : categories;
  }, [categories, agentConfig]);

  // Current active category label for modal
  const activeModalCatLabel = isCustomCategory ? customCatName : newCatName;

  // Dynamically compute subcategories for the selected category
  const availableSubcategories = useMemo(() => {
    if (!activeModalCatLabel) return [];
    
    // 1. Try matching from materialPrices (waste_categories DB subcategories)
    const matched = (materialPrices || []).filter(m => 
      m.category && m.category.toLowerCase().trim() === activeModalCatLabel.toLowerCase().trim()
    );

    if (matched.length > 0) {
      return matched.map(m => ({ name: m.material_name, price: m.price_per_kg || 45 }));
    }

    // 2. Fallbacks by category family
    const catLower = activeModalCatLabel.toLowerCase();
    if (catLower.includes('plastic')) {
      return [
        { name: 'PET Clear Bottles', price: 45 },
        { name: 'HDPE Rigid (Crates/Drums)', price: 55 },
        { name: 'LDPE Film / Nylon', price: 35 },
        { name: 'PP Containers / Caps', price: 40 },
        { name: 'PVC Rigid Pipes', price: 30 }
      ];
    }
    if (catLower.includes('metal')) {
      return [
        { name: 'Heavy Scrap Iron (HMS)', price: 38 },
        { name: 'Clean Copper Wire', price: 420 },
        { name: 'Scrap Aluminum Cans/Profiles', price: 180 },
        { name: 'Brass / Bronze', price: 310 }
      ];
    }
    if (catLower.includes('paper') || catLower.includes('cardboard')) {
      return [
        { name: 'Loose OCC Cardboard', price: 22 },
        { name: 'White Office Paper', price: 30 },
        { name: 'Newsprint / Magazines', price: 18 }
      ];
    }
    if (catLower.includes('glass') || catLower.includes('waste')) {
      return [
        { name: 'Cullet Clear Glass', price: 12 },
        { name: 'Amber Beer Bottles', price: 15 },
        { name: 'E-Waste Circuit Boards', price: 250 }
      ];
    }

    return [];
  }, [activeModalCatLabel, materialPrices]);

  // Fetch Inventory Data
  const fetchInventoryData = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // 1. Fetch Master Inventory
      const { data: invData, error: invErr } = await (supabase.from('hub_inventory') as any)
        .select(`
          id, quantity, last_updated, material_id,
          materials (id, name, category)
        `)
        .eq('company_id', companyId);

      if (invErr) throw invErr;

      // 2. Fetch Processed Batches for this Hub
      const { data: batches } = await (supabase.from('processing_batches') as any)
        .select('material_id, quantity_out, grade, estimated_value, location, is_negotiable, image_url, completed_at')
        .eq('company_id', companyId);

      // Aggregate by Material
      const processedMap: Record<string, { weight: number; value: number; grade: string; loc: string; nego: boolean; images: string[] }> = {};
      (batches || []).forEach((b: any) => {
        const matId = b.material_id;
        if (!processedMap[matId]) {
          processedMap[matId] = {
            weight: 0,
            value: 0,
            grade: b.grade || 'Premium Baled',
            loc: b.location || hubDefaultLocation,
            nego: !!b.is_negotiable,
            images: b.image_url ? [b.image_url] : []
          };
        }
        processedMap[matId].weight += Number(b.quantity_out || 0);
        processedMap[matId].value += Number(b.estimated_value || 0);
      });

      // Real Inventory dataset from DB (returns [] if fresh)
      const formattedItems: MaterialStockItem[] = (invData && invData.length > 0)
        ? invData.map((inv: any) => {
            const matName = inv.materials?.name || 'Recyclable Material';
            const catName = inv.materials?.category || 'General';
            const unitPrice = Number(inv.materials?.price_per_kg || 45);
            const rawTotalIntake = Number(inv.quantity || 0);
            const procInfo = processedMap[inv.material_id] || { weight: 0, value: 0, grade: 'Standard Baled', loc: hubDefaultLocation, nego: false, images: [] };
            const procKg = procInfo.weight;
            // Subtract processed weight from raw intake total so raw and processed are distinct
            const rawKg = Math.max(0, rawTotalIntake - procKg);
            const totalKg = rawKg + procKg;
            const estVal = totalKg * unitPrice;

            return {
              id: inv.id,
              material_id: inv.material_id,
              material_name: matName,
              category_name: catName,
              unprocessed_kg: rawKg,
              processed_kg: procKg,
              total_kg: totalKg,
              unit_price_kes: unitPrice,
              estimated_value_kes: estVal,
              location: procInfo.loc || hubDefaultLocation,
              is_negotiable: procInfo.nego,
              proof_images: procInfo.images,
              last_updated: inv.last_updated || new Date().toISOString(),
              grade: procInfo.grade
            };
          })
        : [];

      setItems(formattedItems);

      // Fetch Real Processing Batches for History Logs
      const { data: bLogs } = await (supabase.from('processing_batches') as any)
        .select(`
          id, quantity_in, quantity_out, completed_at, grade, location, notes,
          materials (name, category)
        `)
        .eq('company_id', companyId)
        .order('completed_at', { ascending: false })
        .limit(50);

      if (bLogs && bLogs.length > 0) {
        const realHistory: InventoryHistoryLog[] = bLogs.map((b: any) => ({
          id: b.id,
          type: 'processing_received',
          material_name: b.materials?.name || 'Recyclable Material',
          category_name: b.materials?.category || 'General',
          weight_kg: Number(b.quantity_out || 0),
          details: `Completed batch run (${b.quantity_in || 0} KG Input → ${b.quantity_out || 0} KG Baled Output)`,
          timestamp: b.completed_at || new Date().toISOString()
        }));
        setHistoryLogs(realHistory);
      } else {
        setHistoryLogs([]);
      }

      // Expand all categories by default
      const catMap: Record<string, boolean> = {};
      formattedItems.forEach(i => { catMap[i.category_name] = true; });
      setExpandedCategories(catMap);

      // Select first item if none selected
      if (formattedItems.length > 0 && !selectedItemId) {
        setSelectedItemId(formattedItems[0].id);
      }
    } catch (err) {
      console.error('[InventoryCommand] Fetch error:', err);
      toast.error('Failed to load inventory ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, [companyId]);

  // Selected Item Reference
  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || items[0] || null;
  }, [items, selectedItemId]);

  // Filtered Items (Status + Category + Search)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Stock Status Filter
      if (stockStatusFilter === 'processed' && item.processed_kg <= 0) return false;
      if (stockStatusFilter === 'unprocessed' && item.unprocessed_kg <= 0) return false;

      // 2. Hub Config Category Filter
      if (selectedCategoryFilter !== 'all') {
        const selCat = selectedCategoryFilter.toLowerCase();
        const itemCat = item.category_name.toLowerCase();
        if (!itemCat.includes(selCat) && !selCat.includes(itemCat)) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.material_name.toLowerCase().includes(q);
        const matchesCat = item.category_name.toLowerCase().includes(q);
        const matchesLoc = item.location.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesLoc) return false;
      }
      return true;
    });
  }, [items, stockStatusFilter, selectedCategoryFilter, searchQuery]);

  // Grouped by Category
  const groupedCategories = useMemo(() => {
    const groups: Record<string, MaterialStockItem[]> = {};
    filteredItems.forEach(item => {
      const cat = item.category_name || 'General Materials';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);

  // 6 KPI Calculations
  const kpis = useMemo(() => {
    const totalUnprocessedKg = filteredItems.reduce((acc, i) => acc + i.unprocessed_kg, 0);
    const totalProcessedKg = filteredItems.reduce((acc, i) => acc + i.processed_kg, 0);
    const totalStockKg = totalUnprocessedKg + totalProcessedKg;

    const unprocessedValueKes = filteredItems.reduce((acc, i) => acc + (i.unprocessed_kg * i.unit_price_kes), 0);
    const processedValueKes = filteredItems.reduce((acc, i) => acc + (i.processed_kg * i.unit_price_kes), 0);

    return {
      totalStockKg,
      totalStockTons: (totalStockKg / 1000).toFixed(2),
      processedKg: totalProcessedKg,
      processedTons: (totalProcessedKg / 1000).toFixed(2),
      processedValueKes,
      unprocessedKg: totalUnprocessedKg,
      unprocessedTons: (totalUnprocessedKg / 1000).toFixed(2),
      unprocessedValueKes,
      totalSubcategories: filteredItems.length
    };
  }, [filteredItems]);

  // Handlers
  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleOpenSendToProcessing = () => {
    if (!selectedItem) return;
    setWeightToProcess(selectedItem.unprocessed_kg > 0 ? selectedItem.unprocessed_kg.toString() : '100');
    setProcessingModalOpen(true);
  };

  const handleInitiateSendToProcessing = () => {
    if (!selectedItem) return;
    const processAmount = parseFloat(weightToProcess);
    if (!processAmount || processAmount <= 0) {
      toast.error('Please enter a valid weight amount to process');
      return;
    }

    if (processAmount > selectedItem.unprocessed_kg) {
      toast.error(`Cannot send more than the available raw weight (${selectedItem.unprocessed_kg.toLocaleString()} KG)`);
      return;
    }
    setConfirmProcessBatchOpen(true);
  };

  const executeConfirmSendToProcessing = () => {
    if (!selectedItem) return;
    const processAmount = parseFloat(weightToProcess);

    // Deduct processAmount from Raw Inventory in state to keep yard intact
    setItems(prev => prev.map(i => {
      if (i.id === selectedItem.id) {
        const newUnprocessed = Math.max(0, i.unprocessed_kg - processAmount);
        const newTotal = newUnprocessed + i.processed_kg;
        return {
          ...i,
          unprocessed_kg: newUnprocessed,
          total_kg: newTotal,
          estimated_value_kes: newTotal * i.unit_price_kes,
          last_updated: new Date().toISOString()
        };
      }
      return i;
    }));

    setConfirmProcessBatchOpen(false);
    setProcessingModalOpen(false);
    toast.success(`Dispatched ${processAmount.toLocaleString()} KG of ${selectedItem.material_name} to Processing Floor!`);

    // Prepend Real Sent to Processing History Log
    const procLog: InventoryHistoryLog = {
      id: `log-proc-${Date.now()}`,
      type: 'sent_to_processing',
      material_name: selectedItem.material_name,
      category_name: selectedItem.category_name,
      weight_kg: -processAmount,
      details: `Drawn from ${selectedItem.location || hubDefaultLocation} → Sent to Floor Processing`,
      timestamp: new Date().toISOString(),
      operator_name: (profile as any)?.full_name || 'Yard Operator'
    };
    setHistoryLogs(prev => [procLog, ...prev]);

    // Redirect to Processing Tracker with pre-filled state
    navigate('/operations/batch', {
      state: {
        prefillBatch: {
          rawWeightKg: processAmount,
          materialName: selectedItem.material_name,
          categoryName: selectedItem.category_name
        }
      }
    });
  };

  const handleInitiateSendToSales = () => {
    if (!selectedItem) return;
    if (selectedItem.processed_kg <= 0) {
      toast.error('No processed baled material available to list on Sales');
      return;
    }
    setConfirmPublishSalesOpen(true);
  };

  const executeSendToSales = async () => {
    if (!selectedItem) return;
    
    setConfirmPublishSalesOpen(false);
    setIsPublishingSales(true);
    try {
      // Publish to sales_inventory database table
      const { error } = await (supabase.from('sales_inventory') as any).insert({
        company_id: companyId,
        material_id: selectedItem.material_id,
        material_name: selectedItem.material_name,
        category: selectedItem.category_name,
        available_weight_kg: selectedItem.processed_kg,
        asking_price_per_kg: selectedItem.unit_price_kes,
        is_negotiable: selectedItem.is_negotiable,
        location: selectedItem.location,
        image_url: selectedItem.proof_images.length > 0 ? selectedItem.proof_images[0] : null,
        status: 'active'
      });

      if (error && error.code !== 'PGRST116') {
        console.warn('Sales publish insert note:', error);
      }

      // Prepend Real Published to Sales History Log
      const salesLog: InventoryHistoryLog = {
        id: `log-sales-${Date.now()}`,
        type: 'sent_to_sales',
        material_name: selectedItem.material_name,
        category_name: selectedItem.category_name,
        weight_kg: selectedItem.processed_kg,
        details: `Published listing to Marketplace Sales Inbox (${selectedItem.location || hubDefaultLocation})`,
        timestamp: new Date().toISOString(),
        operator_name: (profile as any)?.full_name || 'Sales Desk'
      };
      setHistoryLogs(prev => [salesLog, ...prev]);

      toast.success(`🚀 ${selectedItem.processed_kg.toLocaleString()} KG of ${selectedItem.material_name} published to Marketplace Sales Inbox!`);
    } catch (err) {
      console.error('Error publishing to sales:', err);
      toast.success(`Published ${selectedItem.material_name} to Sales Inbox`);
    } finally {
      setIsPublishingSales(false);
    }
  };

  const handleUpdateLocationAndNegotiable = (newLoc: string, isNego: boolean) => {
    if (!selectedItem) return;
    setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, location: newLoc, is_negotiable: isNego } : i));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem) return;
    if (selectedItem.proof_images.length >= 3) {
      toast.error('Maximum 3 proof photos allowed per material');
      return;
    }

    setIsUploadingProof(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1000, maxHeight: 1000, quality: 0.7 });
      const fileExt = compressed.name.split('.').pop() || 'jpg';
      const fileName = `inventory_proofs/${selectedItem.id}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('inventory_images')
        .upload(fileName, compressed, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('inventory_images')
        .getPublicUrl(fileName);

      setItems(prev => prev.map(i => {
        if (i.id === selectedItem.id) {
          return { ...i, proof_images: [...i.proof_images, publicUrl] };
        }
        return i;
      }));

      toast.success('Proof image uploaded successfully');
    } catch (err) {
      console.error('Error uploading proof image:', err);
      const localUrl = URL.createObjectURL(file);
      setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, proof_images: [...i.proof_images, localUrl] } : i));
      toast.success('Proof photo added');
    } finally {
      setIsUploadingProof(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadNewStockProofImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (newProofImages.length >= 3) {
      toast.error('Maximum 3 proof images allowed');
      return;
    }
    setIsUploadingNewProof(true);
    try {
      const compressed = await compressImage(file, 1024, 0.7);
      const fileExt = file.name.split('.').pop() || 'jpeg';
      const filePath = `stock-proofs/${companyId || 'general'}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('hub-documents')
        .upload(filePath, compressed, { upsert: true });

      if (uploadError) {
        const localUrl = URL.createObjectURL(compressed);
        setNewProofImages(prev => [...prev, localUrl]);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('hub-documents')
          .getPublicUrl(filePath);
        setNewProofImages(prev => [...prev, publicUrlData.publicUrl]);
      }
      toast.success('Proof photo added');
    } catch (err) {
      const localUrl = URL.createObjectURL(file);
      setNewProofImages(prev => [...prev, localUrl]);
      toast.success('Proof photo added');
    } finally {
      setIsUploadingNewProof(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveAudit = () => {
    if (!selectedItem) return;
    const rawVal = auditRawKg ? parseFloat(auditRawKg) : selectedItem.unprocessed_kg;
    const procVal = auditProcessedKg ? parseFloat(auditProcessedKg) : selectedItem.processed_kg;
    const diff = (rawVal + procVal) - selectedItem.total_kg;

    setItems(prev => prev.map(i => {
      if (i.id === selectedItem.id) {
        const tot = rawVal + procVal;
        return {
          ...i,
          unprocessed_kg: rawVal,
          processed_kg: procVal,
          total_kg: tot,
          estimated_value_kes: tot * i.unit_price_kes,
          last_updated: new Date().toISOString()
        };
      }
      return i;
    }));

    // Prepend Real Audit History Log
    const auditLog: InventoryHistoryLog = {
      id: `log-audit-${Date.now()}`,
      type: 'stock_audit',
      material_name: selectedItem.material_name,
      category_name: selectedItem.category_name,
      weight_kg: diff,
      details: `${auditReason || 'Physical Floor Scale Calibration'}${auditNote ? ` - ${auditNote}` : ''}`,
      timestamp: new Date().toISOString(),
      operator_name: (profile as any)?.full_name || 'Yard Auditor'
    };
    setHistoryLogs(prev => [auditLog, ...prev]);

    setAuditModalOpen(false);
    toast.success(`Inventory audit updated for ${selectedItem.material_name}`);
  };

  const handleAddStock = () => {
    const finalCategory = (isCustomCategory ? customCatName : newCatName).trim();
    const finalMaterial = (isCustomMaterial ? customMatName : newMatNameSelect).trim();

    if (!finalCategory) {
      toast.error('Please select or type a material category');
      return;
    }

    if (!finalMaterial) {
      toast.error('Please select or type a material name');
      return;
    }

    const weightVal = newStockWeight ? parseFloat(newStockWeight) : 0;
    const rawVal = newStockState === 'raw' ? weightVal : 0;
    const procVal = newStockState === 'processed' ? weightVal : 0;
    const priceVal = newPriceKes ? parseFloat(newPriceKes) : 45;
    const totVal = rawVal + procVal;

    const finalGrade = (isCustomGrade ? customGrade : newGradeSelect).trim() || 'Standard';

    const newItem: MaterialStockItem = {
      id: `manual-stock-${Date.now()}`,
      material_id: `mat-${Date.now()}`,
      material_name: finalMaterial,
      category_name: finalCategory,
      unprocessed_kg: rawVal,
      processed_kg: procVal,
      total_kg: totVal,
      unit_price_kes: priceVal,
      estimated_value_kes: totVal * priceVal,
      location: newLocation || hubDefaultLocation,
      is_negotiable: false,
      proof_images: newProofImages,
      last_updated: new Date().toISOString(),
      grade: finalGrade
    };

    setItems(prev => [newItem, ...prev]);
    setSelectedItemId(newItem.id);
    setExpandedCategories(prev => ({ ...prev, [finalCategory]: true }));

    // Prepend Real Yard Addition History Log
    const newLog: InventoryHistoryLog = {
      id: `log-add-${Date.now()}`,
      type: newStockState === 'processed' ? 'processing_received' : 'manual_addition',
      material_name: finalMaterial,
      category_name: finalCategory,
      weight_kg: totVal,
      details: `${newLocation || hubDefaultLocation} • Manual Lot Intake (${finalGrade})`,
      timestamp: new Date().toISOString(),
      operator_name: (profile as any)?.full_name || 'Hub Manager'
    };
    setHistoryLogs(prev => [newLog, ...prev]);

    setAddStockModalOpen(false);

    // Reset Form
    setCustomCatName('');
    setIsCustomCategory(false);
    setNewMatNameSelect('');
    setCustomMatName('');
    setIsCustomMaterial(false);
    setCustomGrade('');
    setIsCustomGrade(false);
    setNewStockWeight('');
    setNewProofImages([]);
    toast.success(`New material "${newItem.material_name}" added to inventory ledger!`);
  };

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const dateFormatted = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateFormatted} • ${timeFormatted}`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1700px] mx-auto space-y-6 animate-fade-in pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <Warehouse className="w-6 h-6 text-emerald-500" /> Master Inventory Ledger
          </h1>
          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Live physical yard stock balances, material breakdown, and sales dispatch control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInventoryData}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
              isDarkMode 
                ? 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Refresh Stock Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAddStockModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Material Stock
          </button>

        </div>
      </div>

      {/* ── 6 TOP KPI HEADER CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* 1. Total Stock */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Stock</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-lg font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {kpis.totalStockKg >= 1000 ? `${kpis.totalStockTons} MT` : `${kpis.totalStockKg.toLocaleString()} KG`}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Facility total mass</p>
        </div>

        {/* 2. Processed Weight */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Processed Weight</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-lg font-black font-mono text-emerald-600 dark:text-emerald-400`}>
            {kpis.processedKg.toLocaleString()} KG
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Baled & ready for sale</p>
        </div>

        {/* 3. Processed Value */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Processed Value</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <BadgeDollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-base font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            KES {kpis.processedValueKes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-emerald-500 font-semibold mt-1">Ready cash potential</p>
        </div>

        {/* 4. Unprocessed Weight */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unprocessed Weight</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-lg font-black font-mono text-amber-600 dark:text-amber-400`}>
            {kpis.unprocessedKg.toLocaleString()} KG
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Raw pile in yard</p>
        </div>

        {/* 5. Unprocessed Value */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unprocessed Value</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <BadgeDollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-base font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            KES {kpis.unprocessedValueKes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-amber-500 font-semibold mt-1">Raw material assets</p>
        </div>

        {/* 6. Total Material Types */}
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Material Types</span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-lg font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            {kpis.totalSubcategories} Subcategories
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Active inventory items</p>
        </div>
      </div>

      {/* ── DYNAMIC HUB CONFIG CATEGORIES FILTER PILLS & SEARCH INPUT (SAME ROW) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filter Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-500" /> Filter:
          </span>
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-950 shadow-sm'
                : (isDarkMode ? 'bg-slate-900 text-slate-400 border border-white/5 hover:bg-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50')
            }`}
          >
            All Categories
          </button>
          {hubCategories.map(cat => (
            <button
              key={cat.id || cat.slug || cat.label}
              onClick={() => setSelectedCategoryFilter(cat.label || cat.name || cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategoryFilter.toLowerCase() === (cat.label || cat.name || cat.id).toLowerCase()
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : (isDarkMode ? 'bg-slate-900 text-slate-400 border border-white/5 hover:bg-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50')
              }`}
            >
              {cat.label || cat.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search material name, category, or bay..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border outline-none transition-colors ${
              isDarkMode 
                ? 'bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500' 
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* ── MAIN MASTER-DETAIL LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        
        {/* LEFT COLUMN: HIERARCHICAL COLLAPSIBLE CATEGORY TABLE (7 COLUMNS) */}
        <div className={`lg:col-span-7 rounded-2xl border overflow-hidden shadow-sm flex flex-col ${
          isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'
        }`}>
          <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Layers className="w-4 h-4 text-emerald-500" /> Material Stock Hierarchy
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">
              Click row to view details & actions
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <div className="py-16 text-center text-xs font-medium text-slate-400">
                Loading physical yard ledger...
              </div>
            ) : Object.keys(groupedCategories).length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Box className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p className={`font-semibold text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  No inventory items match selected filters
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try switching stock status tabs or resetting category filters.
                </p>
              </div>
            ) : (
              Object.entries(groupedCategories).map(([catName, catItems]) => {
                const catUnprocessed = catItems.reduce((acc, i) => acc + i.unprocessed_kg, 0);
                const catProcessed = catItems.reduce((acc, i) => acc + i.processed_kg, 0);
                const catTotalKg = catUnprocessed + catProcessed;
                const catTotalVal = catItems.reduce((acc, i) => acc + i.estimated_value_kes, 0);

                return (
                  <div 
                    key={catName} 
                    onClick={() => {
                      setActiveCategoryModal(catName);
                      setModalSubmatSearch('');
                    }}
                    className={`p-4 flex items-center justify-between cursor-pointer select-none transition-all ${
                      isDarkMode ? 'hover:bg-slate-800/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {catName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-400" /> {catItems.length} Sub-materials in inventory
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Total Yard Mass</p>
                        <p className={`text-xs font-mono font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {catTotalKg.toLocaleString()} KG
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Est. Value</p>
                        <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          KES {catTotalVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="pl-1">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          View Items <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: INVENTORY MOVEMENT & PROCESSING HISTORY LEDGER (5 COLUMNS) */}
        <div className={`lg:col-span-5 rounded-2xl border overflow-hidden shadow-sm flex flex-col ${
          isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'
        }`}>
          {/* Header */}
          <div className="p-4 border-b flex flex-col gap-2.5 bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Activity className="w-4 h-4 text-emerald-500" /> Stock Movement History
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border dark:border-white/10">
                  {filteredHistoryLogs.length} Events
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Log
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'all', label: 'All History' },
                { id: 'processing', label: '⚡ Processing' },
                { id: 'transfers', label: '📦 Yard Additions' },
                { id: 'audits', label: '⚖️ Audits' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setHistoryFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                    historyFilter === tab.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* History Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search history (e.g. PET, Baler #1, Audit)..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none font-medium ${
                  isDarkMode 
                    ? 'bg-slate-800 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500' 
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          {/* History Logs Feed: Scrollable container showing ~5 items by default */}
          <div className="flex-1 overflow-y-auto max-h-[450px] divide-y divide-slate-100 dark:divide-white/5 p-3 space-y-2.5 custom-scrollbar">
            {filteredHistoryLogs.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Activity className="w-8 h-8 mx-auto opacity-30 text-slate-400" />
                <p className={`font-bold text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  No movement logs found
                </p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  Stock movements from processing runs, scale audits, and manual entries will appear here automatically.
                </p>
              </div>
            ) : (
              filteredHistoryLogs.map(log => (
                <div 
                  key={log.id}
                  className={`p-3 rounded-xl border transition-all space-y-1.5 ${
                    isDarkMode ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/70' : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.type === 'processing_received' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          ⚡ Received from Processing
                        </span>
                      )}
                      {log.type === 'sent_to_processing' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          📦 Sent to Floor
                        </span>
                      )}
                      {log.type === 'manual_addition' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          ➕ Yard Addition
                        </span>
                      )}
                      {log.type === 'stock_audit' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          ⚖️ Scale Audit
                        </span>
                      )}
                      {log.type === 'sent_to_sales' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          🚀 Published Sales
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">{log.category_name}</span>
                    </div>

                    <span className={`text-xs font-mono font-black ${
                      log.weight_kg > 0 ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {log.weight_kg > 0 ? `+${log.weight_kg.toLocaleString()}` : log.weight_kg.toLocaleString()} KG
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {log.material_name}
                    </h4>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {formatTxDate(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL 1: SEND TO PROCESSING WEIGHT SELECTION MODAL ── */}
      {processingModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-10 md:pt-16 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-5 ${
            isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Send to Processing Floor</h3>
                  <p className="text-[10px] text-slate-400">{selectedItem.material_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setProcessingModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total Available Raw Weight Badge */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-100'
            }`}>
              <span className="text-xs font-bold text-slate-400">Total Raw Pile in Yard:</span>
              <span className="text-sm font-black font-mono text-amber-500">
                {selectedItem.unprocessed_kg.toLocaleString()} KG
              </span>
            </div>

            {/* Weight Input Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Enter Weight Amount to Process (KG) *
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem.unprocessed_kg}
                value={weightToProcess}
                onChange={e => setWeightToProcess(e.target.value)}
                placeholder="e.g. 1500"
                className={`w-full px-4 py-3 text-sm font-mono font-bold rounded-xl border outline-none ${
                  isDarkMode 
                    ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Live Subtraction Preview Box */}
            {weightToProcess && parseFloat(weightToProcess) > 0 && (
              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Inventory Subtraction Math Preview
                </p>
                <div className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 flex justify-between">
                  <span>Initial Raw Stock:</span>
                  <span>{selectedItem.unprocessed_kg.toLocaleString()} KG</span>
                </div>
                <div className="text-xs font-mono font-semibold text-rose-500 flex justify-between">
                  <span>Dispatched to Processing:</span>
                  <span>- {parseFloat(weightToProcess).toLocaleString()} KG</span>
                </div>
                <hr className="border-amber-500/20" />
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex justify-between">
                  <span>Remaining Intact Yard Stock:</span>
                  <span>{Math.max(0, selectedItem.unprocessed_kg - parseFloat(weightToProcess)).toLocaleString()} KG</span>
                </div>
              </div>
            )}

            {/* Target Machine Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Processing Line / Baler Machine
              </label>
              <select
                value={machineLine}
                onChange={e => setMachineLine(e.target.value)}
                className={`w-full px-3 py-2.5 text-xs rounded-xl border outline-none font-medium ${
                  isDarkMode 
                    ? 'bg-slate-800 border-white/10 text-white' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <option value="Baler Press #1">Baler Press #1 (High Capacity)</option>
                <option value="Shredder Line B">Shredder Line B (Flakes)</option>
                <option value="Manual Sorting Table 02">Manual Sorting Table 02</option>
              </select>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setProcessingModalOpen(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                  isDarkMode ? 'border-white/10 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateSendToProcessing}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all"
              >
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: STOCK TAKE AUDIT & ADJUSTMENT MODAL ── */}
      {auditModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-10 md:pt-16 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-5 ${
            isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm">Physical Yard Stock Audit</h3>
              </div>
              <button 
                onClick={() => setAuditModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/10 text-xs space-y-1">
              <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> What is Physical Yard Stock Audit?
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Use this tool when you physically re-weigh your floor piles. Enter the updated weights to adjust your ledger balances after moisture drying shrinkage, sorting waste, or manual floor scale recalibrations.
              </p>
            </div>

            <div className="space-y-4">
              {/* Only show Raw Input if it exists or if both are zero (prevent empty form) */}
              {(selectedItem.unprocessed_kg > 0 || selectedItem.processed_kg === 0) && (
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Raw Pile</span>
                    <span className="text-sm font-bold font-mono text-amber-500">{selectedItem.unprocessed_kg.toLocaleString()} KG</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      New Audited Raw Weight (KG)
                    </label>
                    <input
                      type="number"
                      value={auditRawKg}
                      onChange={e => setAuditRawKg(e.target.value)}
                      className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border outline-none ${
                        isDarkMode ? 'bg-slate-900 border-white/10 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Only show Baled Input if it exists or if both are zero */}
              {(selectedItem.processed_kg > 0 || selectedItem.unprocessed_kg === 0) && (
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Baled Pile</span>
                    <span className="text-sm font-bold font-mono text-emerald-500">{selectedItem.processed_kg.toLocaleString()} KG</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      New Audited Baled Weight (KG)
                    </label>
                    <input
                      type="number"
                      value={auditProcessedKg}
                      onChange={e => setAuditProcessedKg(e.target.value)}
                      className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border outline-none ${
                        isDarkMode ? 'bg-slate-900 border-white/10 text-white focus:border-emerald-500' : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Audit Reason
                  </label>
                  <select
                    value={auditReason}
                    onChange={e => setAuditReason(e.target.value)}
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border outline-none font-medium ${
                      isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Physical Floor Scale Audit">Physical Floor Scale Audit</option>
                    <option value="Moisture Drying Shrinkage">Moisture Drying Shrinkage</option>
                    <option value="Intake Correction">Intake Correction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Optional Note
                  </label>
                  <input
                    type="text"
                    value={auditNote}
                    onChange={e => setAuditNote(e.target.value)}
                    placeholder="e.g. Broken pallet, moisture"
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border outline-none font-medium ${
                      isDarkMode ? 'bg-slate-800 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setAuditModalOpen(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                  isDarkMode ? 'border-white/10 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAudit}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ADD NEW MATERIAL STOCK MODAL ── */}
      {addStockModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-10 md:pt-16 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-5 ${
            isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm">Add New Material Stock</h3>
              </div>
              <button 
                onClick={() => setAddStockModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Material Category Dropdown with Hub Config & Custom Option */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Material Category *
                </label>
                <select
                  value={isCustomCategory ? 'OTHER_CUSTOM' : newCatName}
                  onChange={e => {
                    if (e.target.value === 'OTHER_CUSTOM') {
                      setIsCustomCategory(true);
                      setCustomCatName('');
                    } else {
                      setIsCustomCategory(false);
                      setNewCatName(e.target.value);
                      setNewMatNameSelect('');
                      setIsCustomMaterial(false);
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {hubCategories.map(cat => (
                    <option key={cat.id || cat.slug || cat.label} value={cat.label || cat.name || cat.id}>
                      {cat.label || cat.name}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">➕ Other (Type Custom Category)...</option>
                </select>

                {isCustomCategory && (
                  <input
                    type="text"
                    placeholder="Type custom category name (e.g. Textiles, E-Waste)..."
                    value={customCatName}
                    onChange={e => setCustomCatName(e.target.value)}
                    className={`w-full mt-2 px-3 py-2 text-xs font-medium rounded-xl border outline-none ${
                      isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                )}
              </div>

              {/* Material Subcategory Dropdown with Dynamic Options & Custom Write-in */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Material Subcategory Name *
                </label>
                <select
                  value={isCustomMaterial ? 'OTHER_CUSTOM' : newMatNameSelect}
                  onChange={e => {
                    if (e.target.value === 'OTHER_CUSTOM') {
                      setIsCustomMaterial(true);
                      setCustomMatName('');
                    } else {
                      setIsCustomMaterial(false);
                      setNewMatNameSelect(e.target.value);
                      const matched = availableSubcategories.find(s => s.name === e.target.value);
                      if (matched && matched.price) {
                        setNewPriceKes(matched.price.toString());
                      }
                    }
                  }}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="">-- Select Material Subcategory --</option>
                  {availableSubcategories.map(sub => (
                    <option key={sub.name} value={sub.name}>
                      {sub.name} {sub.price ? `(Est. KES ${sub.price}/KG)` : ''}
                    </option>
                  ))}
                  <option value="OTHER_CUSTOM">➕ Other (Type Custom Material Name)...</option>
                </select>

                {isCustomMaterial && (
                  <input
                    type="text"
                    placeholder="Type custom material name (e.g. Copper Cable Grade 1)..."
                    value={customMatName}
                    onChange={e => setCustomMatName(e.target.value)}
                    className={`w-full mt-2 px-3 py-2 text-xs font-medium rounded-xl border outline-none ${
                      isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                )}
              </div>

              {/* Stock Type Segmented Control (Raw vs Baled) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Stock Type / Processing State *
                </label>
                <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-xl border ${
                  isDarkMode ? 'bg-slate-800/80 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setNewStockState('raw')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      newStockState === 'raw'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    📦 Raw Unprocessed
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStockState('processed')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      newStockState === 'processed'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    ⚡ Baled Processed
                  </button>
                </div>
              </div>

              {/* Single Weight Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {newStockState === 'raw' ? 'Raw Unprocessed Mass (KG) *' : 'Baled Processed Mass (KG) *'}
                </label>
                <input
                  type="number"
                  placeholder={newStockState === 'raw' ? 'e.g. 2500 (Loose Yard Pile)' : 'e.g. 1200 (Finished Bales)'}
                  value={newStockWeight}
                  onChange={e => setNewStockWeight(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Selling Price (KES/KG)
                  </label>
                  <input
                    type="number"
                    placeholder="45"
                    value={newPriceKes}
                    onChange={e => setNewPriceKes(e.target.value)}
                    className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border outline-none ${
                      isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Quality Grade
                  </label>
                  <select
                    value={isCustomGrade ? 'OTHER_CUSTOM' : newGradeSelect}
                    onChange={e => {
                      if (e.target.value === 'OTHER_CUSTOM') {
                        setIsCustomGrade(true);
                        setCustomGrade('');
                      } else {
                        setIsCustomGrade(false);
                        setNewGradeSelect(e.target.value);
                      }
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium Baled">Premium Baled</option>
                    <option value="A-Grade">A-Grade</option>
                    <option value="B-Grade">B-Grade</option>
                    <option value="OTHER_CUSTOM">➕ Other (Type Custom Grade)...</option>
                  </select>

                  {isCustomGrade && (
                    <input
                      type="text"
                      placeholder="Type custom grade (e.g. HMS 1 Steel, OCC Grade 11)..."
                      value={customGrade}
                      onChange={e => setCustomGrade(e.target.value)}
                      className={`w-full mt-2 px-3 py-2 text-xs font-medium rounded-xl border outline-none ${
                        isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Yard Storage Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bay 01, Zone B, Container 04"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className={`w-full px-3 py-2 text-xs font-medium rounded-xl border outline-none ${
                    isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* 3-Photo Proof Upload Section */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Proof of Stock Photos (Max 3)
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    {newProofImages.length} / 3 Uploaded
                  </span>
                </div>

                <input
                  type="file"
                  ref={newFileInputRef}
                  onChange={handleUploadNewStockProofImage}
                  accept="image/*"
                  className="hidden"
                />

                <div className="grid grid-cols-3 gap-2 mt-1">
                  {newProofImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group">
                      <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewProofImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                        title="Remove Photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {newProofImages.length < 3 && (
                    <button
                      type="button"
                      onClick={() => newFileInputRef.current?.click()}
                      disabled={isUploadingNewProof}
                      className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center transition-all ${
                        isDarkMode 
                          ? 'border-white/10 hover:border-emerald-500/50 bg-slate-800/30' 
                          : 'border-slate-200 hover:border-emerald-500 bg-slate-50'
                      }`}
                    >
                      <Plus className="w-4 h-4 text-emerald-500 mb-1" />
                      <span className="text-[9px] font-bold text-slate-400">
                        {isUploadingNewProof ? 'Uploading...' : 'Add Photo'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setAddStockModalOpen(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                  isDarkMode ? 'border-white/10 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddStock}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
              >
                Save Material Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: CATEGORY SUB-MATERIALS MODAL WITH INTERNAL MASTER-DETAIL ── */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 md:pt-12 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {modalDetailItem ? (
              /* ── SCREEN 2: RICH MATERIAL DETAILS VIEW INSIDE MODAL ── */
              <div className="space-y-4">
                {/* Modal Detail Header Bar */}
                <div className="flex items-center justify-between border-b pb-3 dark:border-white/10">
                  <button
                    onClick={() => setModalDetailItem(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back to {activeCategoryModal} List
                  </button>
                  <button 
                    onClick={() => {
                      setActiveCategoryModal(null);
                      setModalDetailItem(null);
                      setModalSubmatSearch('');
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Material Header Info */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border dark:border-white/10">
                        {modalDetailItem.category_name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        {modalDetailItem.grade}
                      </span>
                    </div>
                    <h2 className={`text-xl font-extrabold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {modalDetailItem.material_name}
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Last Updated: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatTxDate(modalDetailItem.last_updated)}</span>
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border uppercase tracking-wider ${
                    modalDetailItem.processed_kg > 0 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {modalDetailItem.processed_kg > 0 ? '⚡ Ready for Sale' : '📦 Raw Pile Only'}
                  </span>
                </div>

                {/* Proof Images Gallery Banner at Top of Modal */}
                <div className={`p-3 rounded-xl border space-y-2 ${
                  isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Yard Proof Photos ({modalDetailItem.proof_images.length}/3)
                    </span>
                  </div>

                  {modalDetailItem.proof_images && modalDetailItem.proof_images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {modalDetailItem.proof_images.map((img, idx) => (
                        <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 group">
                          <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-2 px-3 rounded-lg border border-dashed border-slate-200 dark:border-white/10 text-center text-xs font-medium text-slate-400 flex items-center justify-center gap-1.5">
                      <ImageIcon className="w-4 h-4 opacity-40" /> No proof images provided for this stock item
                    </div>
                  )}
                </div>

                {/* Dynamic Mass & Est Cash Valuation in 1 Line */}
                {modalDetailItem.unprocessed_kg > 0 && modalDetailItem.processed_kg > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Raw Unprocessed</p>
                      <p className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                        {modalDetailItem.unprocessed_kg.toLocaleString()} KG
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Baled Processed</p>
                      <p className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {modalDetailItem.processed_kg.toLocaleString()} KG
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Cash Value</p>
                      <p className={`text-xs font-black font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'} mt-0.5`}>
                        KES {modalDetailItem.estimated_value_kes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                      modalDetailItem.processed_kg > 0 
                        ? (isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-emerald-500/5 border-emerald-500/20')
                        : (isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-amber-500/5 border-amber-500/20')
                    }`}>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${modalDetailItem.processed_kg > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {modalDetailItem.processed_kg > 0 ? 'Finished Baled Mass' : 'Raw Unprocessed Mass'}
                      </p>
                      <p className={`text-sm font-black font-mono mt-0.5 ${modalDetailItem.processed_kg > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {(modalDetailItem.processed_kg > 0 ? modalDetailItem.processed_kg : modalDetailItem.unprocessed_kg).toLocaleString()} KG
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                      isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Est. Cash Value</p>
                        <span className="text-[9px] font-mono font-bold text-emerald-500">
                          KES {modalDetailItem.unit_price_kes}/KG
                        </span>
                      </div>
                      <p className={`text-sm font-black font-mono mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        KES {modalDetailItem.estimated_value_kes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Storage Location Field */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'
                }`}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Yard Storage Location
                  </label>
                  <input
                    type="text"
                    value={modalDetailItem.location}
                    onChange={e => {
                      const updatedLoc = e.target.value;
                      setModalDetailItem(prev => prev ? ({ ...prev, location: updatedLoc }) : null);
                      handleUpdateLocationAndNegotiable(updatedLoc, modalDetailItem.is_negotiable);
                    }}
                    placeholder="e.g. Bay 01, Zone B, Container 04"
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDarkMode 
                        ? 'bg-slate-900 border-white/10 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-200 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* Negotiable Bids Toggle */}
                {modalDetailItem.processed_kg > 0 && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-800/40 border-white/5' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-500" /> Open to Negotiable Bids
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Allows buyers to submit custom price offers</p>
                    </div>
                    <button
                      onClick={() => {
                        const newNego = !modalDetailItem.is_negotiable;
                        setModalDetailItem(prev => prev ? ({ ...prev, is_negotiable: newNego }) : null);
                        handleUpdateLocationAndNegotiable(modalDetailItem.location, newNego);
                      }}
                      className={`w-11 h-6 rounded-full p-1 transition-colors ${
                        modalDetailItem.is_negotiable ? 'bg-blue-500' : (isDarkMode ? 'bg-slate-700' : 'bg-slate-300')
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        modalDetailItem.is_negotiable ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setProcessingModalOpen(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm"
                  >
                    ⚡ Process Batch
                  </button>
                  <button
                    onClick={() => {
                      setAuditRawKg(modalDetailItem.unprocessed_kg.toString());
                      setAuditProcessedKg(modalDetailItem.processed_kg.toString());
                      setAuditNote('');
                      setAuditModalOpen(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    ⚖️ Audit Stock
                  </button>
                  <button
                    onClick={handleInitiateSendToSales}
                    disabled={isPublishingSales}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm disabled:opacity-50"
                  >
                    {isPublishingSales ? '🚀 Publishing...' : '🚀 Publish Sales'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── SCREEN 1: SUB-MATERIALS LIST VIEW ── */
              <div className="space-y-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b pb-3 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{activeCategoryModal} Sub-materials</h3>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {(groupedCategories[activeCategoryModal] || []).length} material items in inventory
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveCategoryModal(null);
                      setModalSubmatSearch('');
                      setModalDetailItem(null);
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Stock Status Filter Tabs & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className={`p-1 rounded-xl border flex items-center gap-1 w-full sm:w-auto ${
                    isDarkMode ? 'bg-slate-800/80 border-white/10' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {[
                      { id: 'all', label: 'All Items' },
                      { id: 'processed', label: '⚡ Processed Bales' },
                      { id: 'unprocessed', label: '📦 Raw Piles' },
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setModalStockFilter(tab.id as 'all' | 'processed' | 'unprocessed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          modalStockFilter === tab.id
                            ? (tab.id === 'processed' 
                                ? 'bg-emerald-600 text-white shadow-sm' 
                                : (tab.id === 'unprocessed' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-sm'))
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Modal Search Input */}
                  <div className="relative w-full sm:w-60">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Search ${activeCategoryModal}...`}
                      value={modalSubmatSearch}
                      onChange={e => setModalSubmatSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none font-medium ${
                        isDarkMode 
                          ? 'bg-slate-800 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Sub-materials List */}
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                  {(groupedCategories[activeCategoryModal] || []).length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 font-medium">
                      No sub-materials recorded for this category yet.
                    </div>
                  ) : (
                    (groupedCategories[activeCategoryModal] || [])
                      .filter(item => {
                        // 1. Stock Status Filter inside modal
                        if (modalStockFilter === 'processed' && item.processed_kg <= 0) return false;
                        if (modalStockFilter === 'unprocessed' && item.unprocessed_kg <= 0) return false;

                        // 2. Search query inside modal
                        if (!modalSubmatSearch.trim()) return true;
                        const q = modalSubmatSearch.toLowerCase();
                        return item.material_name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
                      })
                      .map(item => {
                        const isSelected = selectedItemId === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedItemId(item.id);
                              setModalDetailItem(item); // Open Screen 2 inside Modal!
                            }}
                            className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500' 
                                : (isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50')
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {item.material_name}
                                </p>
                                {item.processed_kg > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    ⚡ Baled
                                  </span>
                                )}
                                {item.unprocessed_kg > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    📦 Raw
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                                <MapPin className="w-3 h-3 text-slate-400" /> {item.location}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                              {item.processed_kg > 0 && (
                                <div>
                                  <p className="text-[8px] text-slate-400 uppercase font-bold">Baled Stock</p>
                                  <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    {item.processed_kg.toLocaleString()} KG
                                  </p>
                                </div>
                              )}
                              {item.unprocessed_kg > 0 && (
                                <div>
                                  <p className="text-[8px] text-slate-400 uppercase font-bold">Raw Stock</p>
                                  <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                                    {item.unprocessed_kg.toLocaleString()} KG
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-[8px] text-slate-400 uppercase font-bold">Value</p>
                                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  KES {item.estimated_value_kes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── MODAL 5: CONFIRM PROCESS BATCH ── */}
      {confirmProcessBatchOpen && selectedItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl space-y-5 text-center ${
            isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Confirm Batch Processing</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Are you sure you want to dispatch <strong>{weightToProcess} KG</strong> of <strong>{selectedItem.material_name}</strong> to the processing floor?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmProcessBatchOpen(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                  isDarkMode ? 'border-white/10 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmSendToProcessing}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg transition-all"
              >
                Yes, Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 6: CONFIRM PUBLISH SALES ── */}
      {confirmPublishSalesOpen && selectedItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl space-y-5 text-center ${
            isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <BadgeDollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Confirm Publish Sales</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Are you sure you want to publish <strong>{selectedItem.processed_kg.toLocaleString()} KG</strong> of <strong>{selectedItem.material_name}</strong> to the Marketplace?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmPublishSalesOpen(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                  isDarkMode ? 'border-white/10 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={executeSendToSales}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all"
              >
                Yes, Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

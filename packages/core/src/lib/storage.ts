import { supabase } from './supabaseClient';

/**
 * Klinflow Centralized Storage Utility
 * Handles image uploads with an industry-standard "Retry on RLS" pattern.
 */
export const uploadFile = async (bucket: string, file: File | Blob, folder: string = '', retryCount: number = 0): Promise<string | null> => {
  try {
    if (!file) return null;

    // 1. Generate unique filename
    const fileExt = (file as File).name ? (file as File).name.split('.').pop() : 'jpg';
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // 2. Attempt Upload Immediately
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    // 3. Smart Error Handling
    if (error) {
      if (error.message?.includes('row-level security') && retryCount < 1) {
        console.warn('[Storage] Upload blocked by RLS. Attempting session recovery...');
        
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session) {
          console.error('[Storage] Session recovery failed. User must log in.');
          throw new Error('Authentication required for upload. Please log in again.');
        }

        console.log('[Storage] Session recovered. Retrying upload...');
        return uploadFile(bucket, file, folder, retryCount + 1);
      }
      throw error;
    }

    // 4. Return the Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error(`[Storage Utility] Upload to ${bucket} failed:`, err);
    throw err;
  }
};

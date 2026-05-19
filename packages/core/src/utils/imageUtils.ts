/**
 * imageUtils.js — Client-side image processing for Klinflow
 */

/**
 * Compresses an image file using Canvas.
 * Outputs WebP when supported (30-40% smaller than JPEG), falls back to JPEG.
 * @param {File} file - The original image file
 * @param {Object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<File>} - Compressed file
 */
export async function compressImage(
  file: File, 
  { maxWidth = 1200, maxHeight = 1200, quality = 0.7 } = {}
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Try WebP first (much smaller), fall back to JPEG
        const supportsWebP = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';
        const ext = supportsWebP ? '.webp' : '.jpg';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            const newFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, "") + ext, 
              { type: mimeType, lastModified: Date.now() }
            );
            resolve(newFile);
          },
          mimeType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Generates a Supabase Storage thumbnail URL.
 * @param {string} url - The original Supabase public URL
 * @param {Object} options - { width, height, quality }
 * @returns {string} - Transformed URL for the thumbnail
 */
export function getThumbnailUrl(url: string, { width = 400, height, quality = 75 }: { width?: number; height?: number; quality?: number } = {}) {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    params.set('resize', 'contain');
    
    if (parsed.pathname.includes('/object/public/')) {
      parsed.pathname = parsed.pathname.replace('/object/public/', '/render/image/public/');
      parsed.search = params.toString();
      return parsed.toString();
    }
    
    return url;
  } catch {
    return url;
  }
}

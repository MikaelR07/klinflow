/**
 * imageUtils.js — Client-side image processing for CleanFlow
 */

/**
 * Compresses an image file using Canvas.
 * Outputs WebP when supported (30-40% smaller than JPEG), falls back to JPEG.
 * @param {File} file - The original image file
 * @param {Object} options - { maxWidth, maxHeight, quality }
 * @returns {Promise<File>} - Compressed file
 */
export async function compressImage(file, { maxWidth = 1200, maxHeight = 1200, quality = 0.7 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
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
        ctx.drawImage(img, 0, 0, width, height);

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
 * Uses Supabase's built-in image transformation to serve smaller images
 * for listing cards and thumbnails without re-downloading the full image.
 * 
 * @param {string} url - The original Supabase public URL
 * @param {Object} options - { width, height, quality }
 * @returns {string} - Transformed URL for the thumbnail
 * 
 * Usage:
 *   <img src={getThumbnailUrl(listing.photo, { width: 400 })} />
 */
export function getThumbnailUrl(url, { width = 400, height, quality = 75 } = {}) {
  if (!url) return '';
  
  // Supabase Storage image transformation via render/image/public
  // Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
  try {
    const parsed = new URL(url);
    
    // Build transformation params
    const params = new URLSearchParams();
    if (width) params.set('width', width);
    if (height) params.set('height', height);
    params.set('quality', quality);
    params.set('resize', 'contain');
    
    // Replace /object/public/ with /render/image/public/ for transformations
    if (parsed.pathname.includes('/object/public/')) {
      parsed.pathname = parsed.pathname.replace('/object/public/', '/render/image/public/');
      parsed.search = params.toString();
      return parsed.toString();
    }
    
    // If URL doesn't match Supabase pattern, return original
    return url;
  } catch {
    return url;
  }
}

/**
 * Safe localStorage wrapper with QuotaExceededError prevention and image compressor.
 */

// Helper to safely read from localStorage
export function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[SafeStorage] Error reading key "${key}":`, error);
    return defaultValue;
  }
}

// Helper to safely write to localStorage without crashing on QuotaExceededError
export function safeSet(key: string, value: any): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error: any) {
    console.warn(`[SafeStorage] Quota exceeded or write error on key "${key}":`, error);
    
    // Attempt emergency cleanup of heavy cached items to free space
    try {
      const nonCriticalKeys = [
        'campusbloom_notifications',
        'campusbloom_active_spotify_playlist',
        'campusbloom_custom_spotify_url',
      ];
      nonCriticalKeys.forEach((k) => {
        if (k !== key) {
          try {
            localStorage.removeItem(k);
          } catch {
            // ignore
          }
        }
      });

      // Retry save once
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (retryError) {
      console.error(`[SafeStorage] Fatal storage error on "${key}":`, retryError);
      return false;
    }
  }
}

// Helper to safely set raw string
export function safeSetRaw(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[SafeStorage] Quota exceeded or write error on raw key "${key}":`, error);
    try {
      localStorage.removeItem('campusbloom_notifications');
      localStorage.setItem(key, value);
      return true;
    } catch (retryError) {
      console.error(`[SafeStorage] Failed raw set on "${key}":`, retryError);
      return false;
    }
  }
}

// Helper to safely remove key
export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[SafeStorage] Error removing key "${key}":`, error);
  }
}

/**
 * Compresses an image file or base64 data URL using an HTML Canvas.
 * Resizes the image to a maximum dimension of 800px (preserving aspect ratio)
 * and compresses it using JPEG format with 0.7 quality.
 * This guarantees images remain lightweight (<50-100KB), avoiding QuotaExceededError and white screen crashes.
 */
export async function compressImage(
  fileOrUrl: File | string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Scale maintaining aspect ratio, capping max dimension at maxWidth/maxHeight (default 800px)
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original string if canvas context is unavailable
            resolve(typeof fileOrUrl === 'string' ? fileOrUrl : '');
            return;
          }

          // Fill white background for transparent PNG conversion to JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG 0.7 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          console.warn('[compressImage] Canvas processing error:', canvasErr);
          resolve(typeof fileOrUrl === 'string' ? fileOrUrl : '');
        }
      };

      img.onerror = (err) => {
        console.warn('[compressImage] Image load error:', err);
        if (typeof fileOrUrl === 'string') {
          resolve(fileOrUrl);
        } else {
          reject(err);
        }
      };

      if (typeof fileOrUrl === 'string') {
        img.src = fileOrUrl;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            img.src = e.target.result as string;
          } else {
            reject(new Error('FileReader returned empty result'));
          }
        };
        reader.onerror = (readErr) => {
          console.warn('[compressImage] FileReader error:', readErr);
          reject(readErr);
        };
        reader.readAsDataURL(fileOrUrl);
      }
    } catch (globalErr) {
      console.error('[compressImage] Unexpected error during image compression:', globalErr);
      resolve(typeof fileOrUrl === 'string' ? fileOrUrl : '');
    }
  });
}


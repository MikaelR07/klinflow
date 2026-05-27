/**
 * OptimizedImage — Drop-in <img> replacement with skeleton loading,
 * smooth fade-in, lazy loading, and error fallback.
 */
import { useState, useCallback, type ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Extra classes for the wrapper div (sizing, rounding, etc.) */
  wrapperClassName?: string;
  /** Skeleton background color — defaults to slate-200 / slate-700 */
  skeletonClass?: string;
  /** Disable the skeleton placeholder */
  noSkeleton?: boolean;
}

export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  skeletonClass,
  noSkeleton = false,
  style,
  ...rest
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => setLoaded(true), []);
  const handleError = useCallback(() => {
    setError(true);
    setLoaded(true); // stop skeleton
  }, []);

  // If there's no src at all, just render the fallback
  if (!src) {
    return (
      <div className={`bg-slate-200 dark:bg-slate-700 flex items-center justify-center ${wrapperClassName}`}>
        <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`} style={style}>
      {/* Skeleton pulse — visible until image loads */}
      {!noSkeleton && !loaded && (
        <div
          className={`absolute inset-0 animate-pulse ${skeletonClass || 'bg-slate-200 dark:bg-slate-700'}`}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}

      {/* Actual image — fades in on load */}
      {!error && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          {...rest}
        />
      )}
    </div>
  );
}

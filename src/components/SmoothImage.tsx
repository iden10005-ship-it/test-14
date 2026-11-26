import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

export interface SmoothImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonTone?: 'light' | 'dark';
  skeletonClassName?: string;
  minSkeletonHeightClass?: string;
  fallback?: React.ReactNode;
}

const loadedSrcCache = new Set<string>();

interface SmoothImageInnerProps extends Omit<SmoothImageProps, 'src'> {
  src: string;
}

const SmoothImageInner: React.FC<SmoothImageInnerProps> = ({
  src,
  alt,
  className = '',
  wrapperClassName = 'relative w-full h-full overflow-hidden',
  skeletonTone = 'light',
  skeletonClassName = '',
  minSkeletonHeightClass = '',
  fallback,
  onLoad,
  onError,
  referrerPolicy = 'no-referrer',
  ...rest
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState<boolean>(() => loadedSrcCache.has(src));
  const [failed, setFailed] = useState<boolean>(false);

  const markLoaded = useCallback(() => {
    loadedSrcCache.add(src);
    setLoaded(true);
  }, [src]);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      markLoaded();
    }
  }, [markLoaded]);

  useEffect(() => {
    if (loaded || failed) return;
    const checkComplete = () => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        markLoaded();
        return true;
      }
      return false;
    };

    if (checkComplete()) return;

    const rafId = window.requestAnimationFrame(() => {
      checkComplete();
    });
    const t1 = window.setTimeout(checkComplete, 120);
    const t2 = window.setTimeout(checkComplete, 450);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [loaded, failed, markLoaded]);

  if (failed) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div className={`${wrapperClassName} ${minSkeletonHeightClass}`.trim()}>
        <div
          className={`w-full h-full flex flex-col items-center justify-center gap-1.5 p-4 ${
            minSkeletonHeightClass || 'min-h-[160px]'
          } ${
            skeletonTone === 'dark'
              ? 'bg-slate-800 text-slate-300'
              : 'bg-slate-100 text-slate-400'
          } ${skeletonClassName}`}
        >
          <ImageIcon className="w-6 h-6 opacity-70" />
          <span className="text-xs font-medium">이미지를 불러오는 중입니다</span>
        </div>
      </div>
    );
  }

  const pendingHeightClass = !loaded && minSkeletonHeightClass ? minSkeletonHeightClass : '';

  return (
    <div className={`${wrapperClassName} ${pendingHeightClass}`.trim()}>
      {!loaded && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 pointer-events-none ${
            skeletonTone === 'dark' ? 'cw-skeleton-dark' : 'cw-skeleton'
          } ${skeletonClassName}`}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        referrerPolicy={referrerPolicy}
        onLoad={(e) => {
          markLoaded();
          onLoad?.(e);
        }}
        onError={(e) => {
          setFailed(true);
          onError?.(e);
        }}
        className={`${className} ${
          loaded ? 'opacity-100' : 'cw-img-fade'
        }`.trim()}
        {...rest}
      />
    </div>
  );
};

export const SmoothImage: React.FC<SmoothImageProps> = ({
  src,
  wrapperClassName = 'relative w-full h-full overflow-hidden',
  skeletonTone = 'light',
  skeletonClassName = '',
  minSkeletonHeightClass = '',
  fallback,
  ...rest
}) => {
  if (!src) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div className={`${wrapperClassName} ${minSkeletonHeightClass}`.trim()}>
        <div
          aria-hidden="true"
          className={`w-full h-full ${minSkeletonHeightClass} ${
            skeletonTone === 'dark' ? 'cw-skeleton-dark' : 'cw-skeleton'
          } ${skeletonClassName}`}
        />
      </div>
    );
  }

  return (
    <SmoothImageInner
      key={src}
      src={src}
      wrapperClassName={wrapperClassName}
      skeletonTone={skeletonTone}
      skeletonClassName={skeletonClassName}
      minSkeletonHeightClass={minSkeletonHeightClass}
      fallback={fallback}
      {...rest}
    />
  );
};

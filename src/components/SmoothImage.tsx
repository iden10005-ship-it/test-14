import React, { useLayoutEffect, useRef, useState } from 'react';

export interface SmoothImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
  skeletonTone?: 'light' | 'dark';
  skeletonClassName?: string;
  minSkeletonHeightClass?: string;
  fallback?: React.ReactNode;
}

export const SmoothImage: React.FC<SmoothImageProps> = ({
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
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useLayoutEffect(() => {
    setFailed(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  if (!src || failed) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div className={wrapperClassName}>
        <div
          aria-hidden="true"
          className={`w-full h-full ${
            skeletonTone === 'dark' ? 'cw-skeleton-dark' : 'cw-skeleton'
          } ${skeletonClassName}`}
        />
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
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setFailed(true);
          onError?.(e);
        }}
        className={`${className} cw-img-fade ${loaded ? 'cw-img-loaded' : ''}`.trim()}
        {...rest}
      />
    </div>
  );
};

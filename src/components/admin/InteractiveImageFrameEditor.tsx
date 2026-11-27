import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  Crop,
  Maximize2,
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export interface ImageFrameTransform {
  /** Zoom factor: 1.0 = cover fit, up to 3.0 */
  zoom: number;
  /** Normalized horizontal pan in [-1, 1]: +1 shows left edge, 0 center, -1 shows right edge */
  panX: number;
  /** Normalized vertical pan in [-1, 1]: +1 shows top edge, 0 center, -1 shows bottom edge */
  panY: number;
  /** 'crop' = interactive pan/zoom crop to aspectRatio, 'original' = keep uncropped original */
  mode: 'crop' | 'original';
}

export const DEFAULT_IMAGE_FRAME_TRANSFORM: ImageFrameTransform = {
  zoom: 1,
  panX: 0,
  panY: 0,
  mode: 'crop',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isSameOriginOrLocal =
      src.startsWith('data:') ||
      src.startsWith('blob:') ||
      src.startsWith('/') ||
      (typeof window !== 'undefined' && src.startsWith(window.location.origin));
    if (!isSameOriginOrLocal) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
    img.src = src;
  });
}

/**
 * Renders the exact visible region of the interactive cropper onto an offscreen canvas
 * and returns a high-quality JPEG data URL.
 */
export async function renderFramedImageToDataUrl(
  src: string,
  aspectRatio: number,
  transform: ImageFrameTransform,
  maxOutputWidth = 1440
): Promise<string> {
  const img = await loadImageElement(src);
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  if (!natW || !natH) {
    throw new Error('이미지 크기를 확인할 수 없습니다.');
  }

  // Original uncropped mode (still resize if huge)
  if (transform.mode === 'original') {
    const scale = natW > maxOutputWidth ? maxOutputWidth / natW : 1;
    const outW = Math.max(1, Math.round(natW * scale));
    const outH = Math.max(1, Math.round(natH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('캔버스를 초기화할 수 없습니다.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, outW, outH);
    return canvas.toDataURL('image/jpeg', 0.88);
  }

  // Reference viewport dimensions sharing the exact aspect ratio
  const refW = 1000;
  const refH = refW / aspectRatio;

  const baseScale = Math.max(refW / natW, refH / natH);
  const zoom = clamp(transform.zoom, 1, 3);
  const totalScale = baseScale * zoom;

  const dispW = natW * totalScale;
  const dispH = natH * totalScale;

  const maxOffsetX = Math.max(0, (dispW - refW) / 2);
  const maxOffsetY = Math.max(0, (dispH - refH) / 2);

  const imgLeft = (refW - dispW) / 2 + clamp(transform.panX, -1, 1) * maxOffsetX;
  const imgTop = (refH - dispH) / 2 + clamp(transform.panY, -1, 1) * maxOffsetY;

  let srcX = (0 - imgLeft) / totalScale;
  let srcY = (0 - imgTop) / totalScale;
  let srcW = refW / totalScale;
  let srcH = refH / totalScale;

  // Defensive subpixel clamping within [0, natW] x [0, natH]
  srcX = clamp(srcX, 0, Math.max(0, natW - 1));
  srcY = clamp(srcY, 0, Math.max(0, natH - 1));
  srcW = clamp(srcW, 1, natW - srcX);
  srcH = clamp(srcH, 1, natH - srcY);

  const outW = Math.min(maxOutputWidth, Math.max(800, Math.round(srcW)));
  const outH = Math.max(1, Math.round(outW / aspectRatio));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('캔버스를 초기화할 수 없습니다.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

  return canvas.toDataURL('image/jpeg', 0.88);
}

interface InteractiveImageFrameEditorProps {
  src: string;
  aspectRatio: number;
  aspectLabel?: string;
  transform: ImageFrameTransform;
  onChange: (next: ImageFrameTransform) => void;
  allowOriginalMode?: boolean;
  compact?: boolean;
}

export const InteractiveImageFrameEditor: React.FC<InteractiveImageFrameEditorProps> = ({
  src,
  aspectRatio,
  aspectLabel = '카드 비율 맞춤',
  transform,
  onChange,
  allowOriginalMode = true,
  compact = false,
}) => {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [loadFailed, setLoadFailed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const transformRef = useRef(transform);
  transformRef.current = transform;

  useEffect(() => {
    setLoadFailed(false);
    setNaturalSize({ width: 0, height: 0 });
  }, [src]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setFrameSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [src, aspectRatio, transform.mode]);

  // Non-passive mouse wheel zoom inside crop viewport
  useEffect(() => {
    const el = frameRef.current;
    if (!el || transform.mode !== 'crop' || !src) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cur = transformRef.current;
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const nextZoom = clamp(Number((cur.zoom + delta).toFixed(2)), 1, 3);
      if (nextZoom !== cur.zoom) {
        onChange({ ...cur, zoom: nextZoom });
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [src, transform.mode, onChange]);

  const computeLayout = useCallback(() => {
    const { width: fw, height: fh } = frameSize;
    const { width: nw, height: nh } = naturalSize;
    if (!fw || !fh || !nw || !nh) {
      return null;
    }
    const baseScale = Math.max(fw / nw, fh / nh);
    const dispW = nw * baseScale * transform.zoom;
    const dispH = nh * baseScale * transform.zoom;
    const maxOffsetX = Math.max(0, (dispW - fw) / 2);
    const maxOffsetY = Math.max(0, (dispH - fh) / 2);
    const left = (fw - dispW) / 2 + clamp(transform.panX, -1, 1) * maxOffsetX;
    const top = (fh - dispH) / 2 + clamp(transform.panY, -1, 1) * maxOffsetY;
    return { dispW, dispH, maxOffsetX, maxOffsetY, left, top };
  }, [frameSize, naturalSize, transform.zoom, transform.panX, transform.panY]);

  const layout = computeLayout();
  const canPanX = (layout?.maxOffsetX ?? 0) > 1;
  const canPanY = (layout?.maxOffsetY ?? 0) > 1;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (transform.mode !== 'crop' || !layout) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: transform.panX,
      startPanY: transform.panY,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !layout) return;
    e.preventDefault();

    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;

    const nextPanX =
      layout.maxOffsetX > 0.5
        ? clamp(drag.startPanX + dx / layout.maxOffsetX, -1, 1)
        : 0;
    const nextPanY =
      layout.maxOffsetY > 0.5
        ? clamp(drag.startPanY + dy / layout.maxOffsetY, -1, 1)
        : 0;

    onChange({
      ...transform,
      panX: Number(nextPanX.toFixed(4)),
      panY: Number(nextPanY.toFixed(4)),
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current && dragStateRef.current.pointerId === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      dragStateRef.current = null;
      setIsDragging(false);
    }
  };

  const handleZoomStep = (step: number) => {
    const nextZoom = clamp(Number((transform.zoom + step).toFixed(2)), 1, 3);
    onChange({ ...transform, zoom: nextZoom });
  };

  const handleReset = () => {
    onChange({ ...transform, zoom: 1, panX: 0, panY: 0 });
  };

  const zoomPercent = Math.round(transform.zoom * 100);
  const isModified =
    transform.zoom > 1.001 ||
    Math.abs(transform.panX) > 0.001 ||
    Math.abs(transform.panY) > 0.001;

  return (
    <div className="space-y-2.5">
      {/* Mode bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {allowOriginalMode ? (
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/80">
              <button
                type="button"
                onClick={() => onChange({ ...transform, mode: 'crop' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  transform.mode === 'crop'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crop className="w-3 h-3" />
                <span>위치·확대 조정 ({aspectLabel})</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...transform, mode: 'original' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  transform.mode === 'original'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                <span>원본 전체</span>
              </button>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Crop className="w-3.5 h-3.5 text-blue-600" />
              <span>위치·확대 조정 ({aspectLabel})</span>
            </span>
          )}
        </div>

        {transform.mode === 'crop' && isModified && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>위치 초기화</span>
          </button>
        )}
      </div>

      {/* Interactive Preview Frame */}
      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ aspectRatio: String(aspectRatio) }}
        className={`relative w-full ${
          compact ? 'max-h-52' : 'max-h-64'
        } mx-auto rounded-2xl bg-slate-950 border-2 ${
          isDragging ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
        } overflow-hidden select-none ${
          transform.mode === 'crop' && src && !loadFailed
            ? isDragging
              ? 'cursor-grabbing touch-none'
              : 'cursor-grab touch-none'
            : ''
        } flex items-center justify-center`}
      >
        {!src ? (
          <span className="text-xs text-slate-400">사진을 선택하면 여기서 위치와 크기를 조정할 수 있습니다.</span>
        ) : loadFailed ? (
          <span className="text-xs text-red-400">미리보기를 불러올 수 없습니다. URL 또는 파일을 확인해 주세요.</span>
        ) : transform.mode === 'original' ? (
          <img
            src={src}
            alt="원본 미리보기"
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              if (el.naturalWidth && el.naturalHeight) {
                setNaturalSize({ width: el.naturalWidth, height: el.naturalHeight });
              }
            }}
            onError={() => setLoadFailed(true)}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <>
            <img
              src={src}
              alt="위치 조정 미리보기"
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalWidth && el.naturalHeight) {
                  setNaturalSize({ width: el.naturalWidth, height: el.naturalHeight });
                }
              }}
              onError={() => setLoadFailed(true)}
              style={
                layout
                  ? {
                      position: 'absolute',
                      left: `${layout.left}px`,
                      top: `${layout.top}px`,
                      width: `${layout.dispW}px`,
                      height: `${layout.dispH}px`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                    }
                  : {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }
              }
              className="pointer-events-none select-none"
            />

            {/* Subtle 3x3 alignment grid while dragging */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-150 ${
                isDragging ? 'opacity-90' : 'opacity-0 hover:opacity-50'
              }`}
            >
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/45 shadow-2xs" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/45 shadow-2xs" />
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/45 shadow-2xs" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/45 shadow-2xs" />
            </div>

            {/* Drag hint badge */}
            {!isDragging && (
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-xs text-white text-[10.5px] font-semibold whitespace-nowrap flex items-center gap-1 shadow-sm">
                <Move className="w-3 h-3 text-sky-300" />
                <span>마우스로 드래그해 위치 이동 · 휠로 확대/축소</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Zoom Slider & Quick Alignment Controls */}
      {transform.mode === 'crop' && src && !loadFailed && (
        <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-2.5 sm:p-3 space-y-2.5">
          {/* Zoom row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleZoomStep(-0.1)}
              disabled={transform.zoom <= 1}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 flex items-center justify-center text-slate-700 cursor-pointer shrink-0 transition-colors"
              title="축소"
              aria-label="사진 축소"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={transform.zoom}
              onChange={(e) =>
                onChange({ ...transform, zoom: clamp(Number(e.target.value), 1, 3) })
              }
              aria-label="사진 확대 축소 배율"
              className="flex-1 h-1.5 accent-blue-600 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => handleZoomStep(0.1)}
              disabled={transform.zoom >= 3}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 flex items-center justify-center text-slate-700 cursor-pointer shrink-0 transition-colors"
              title="확대"
              aria-label="사진 확대"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <span className="w-11 text-right text-[11px] font-extrabold text-slate-700 tabular-nums shrink-0">
              {zoomPercent}%
            </span>
          </div>

          {/* Quick position presets */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[10.5px] font-bold text-slate-500">빠른 위치 맞춤</span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => onChange({ ...transform, panY: 1 })}
                disabled={!canPanY}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  canPanY && transform.panY > 0.9
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
                title="사진 위쪽(상단) 보여주기"
              >
                <AlignVerticalJustifyStart className="w-3 h-3" />
                <span>상단</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...transform, panX: 0, panY: 0 })}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                  Math.abs(transform.panX) < 0.05 && Math.abs(transform.panY) < 0.05
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
                title="정중앙 맞추기"
              >
                <AlignCenter className="w-3 h-3" />
                <span>중앙</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...transform, panY: -1 })}
                disabled={!canPanY}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  canPanY && transform.panY < -0.9
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
                title="사진 아래쪽(하단) 보여주기"
              >
                <AlignVerticalJustifyEnd className="w-3 h-3" />
                <span>하단</span>
              </button>
              {canPanX && (
                <>
                  <button
                    type="button"
                    onClick={() => onChange({ ...transform, panX: 1 })}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                      transform.panX > 0.9
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                    title="사진 왼쪽 보여주기"
                  >
                    <AlignHorizontalJustifyStart className="w-3 h-3" />
                    <span>좌측</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...transform, panX: -1 })}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                      transform.panX < -0.9
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                    title="사진 오른쪽 보여주기"
                  >
                    <AlignHorizontalJustifyEnd className="w-3 h-3" />
                    <span>우측</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

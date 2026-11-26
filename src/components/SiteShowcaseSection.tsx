import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
  ZoomIn,
} from 'lucide-react';
import { SmoothImage } from '@/src/components/SmoothImage';
import { EditableText } from '@/src/components/admin/EditableText';
import type { SiteShowcaseData, SiteShowcaseItem } from '@/src/types/clearworks';
import {
  formatRegionLabel,
  getAvailableGalleryRegions,
  groupGalleryRegions,
  normalizeRegionToDetailKey,
} from '@/src/utils/galleryRegions';

interface SiteShowcaseSectionProps {
  showcase: SiteShowcaseData;
  regions?: string[];
  isEditMode: boolean;
  onUpdateShowcase: (updater: (prev: SiteShowcaseData) => SiteShowcaseData) => void;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
}

const DEFAULT_TAG_SUGGESTIONS = [
  '아파트 외창',
  '창틀 청소',
  '유리창 세정',
  '초순수 린스',
  '스퀴지 마감',
  '상가 어닝',
  '상가 유리창',
  '카페 통유리',
  '사무실 유리',
  '시트지 제거',
  '간판 세척',
  '프레임 세정',
];

async function resizeImageFileToDataUrl(file: File, maxWidth = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 형식을 불러올 수 없습니다.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface MarqueeRowProps {
  items: SiteShowcaseItem[];
  direction: 'left' | 'right';
  speedPxPerSec: number;
  paused: boolean;
  onSelectItem: (itemId: string) => void;
}

const ShowcaseMarqueeRow: React.FC<MarqueeRowProps> = ({
  items,
  direction,
  speedPxPerSec,
  paused,
  onSelectItem,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const trackARef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);
  const isUserTouchingRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef<boolean>(false);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      const container = scrollRef.current;
      const trackA = trackARef.current;
      if (container && trackA) {
        const halfWidth = trackA.offsetWidth;
        if (halfWidth > 0) {
          const normalized = ((container.scrollLeft % halfWidth) + halfWidth) % halfWidth;
          if (Math.abs(container.scrollLeft - normalized) > 1) {
            container.scrollLeft = normalized;
          }
          posRef.current = normalized;
        }
      }
      isUserTouchingRef.current = false;
    }, 950);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const container = scrollRef.current;
      const trackA = trackARef.current;

      if (container && trackA) {
        const halfWidth = trackA.offsetWidth;
        if (halfWidth > 0) {
          if (!initializedRef.current) {
            initializedRef.current = true;
            posRef.current = direction === 'right' ? halfWidth * 0.5 : 0;
            container.scrollLeft = posRef.current;
          } else if (!paused && !isUserTouchingRef.current) {
            if (direction === 'left') {
              posRef.current += speedPxPerSec * dt;
              if (posRef.current >= halfWidth) {
                posRef.current -= halfWidth;
              }
            } else {
              posRef.current -= speedPxPerSec * dt;
              if (posRef.current <= 0) {
                posRef.current += halfWidth;
              }
            }
            container.scrollLeft = posRef.current;
          }
        }
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, [items.length, direction, speedPxPerSec, paused]);

  const renderCard = (item: SiteShowcaseItem, idx: number, trackKey: string) => (
    <div
      key={`${trackKey}-${item.id}-${idx}`}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (didSwipeRef.current) return;
        onSelectItem(item.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectItem(item.id);
        }
      }}
      aria-label={`${item.title} 현장 사진 크게 보기`}
      className="group relative shrink-0 w-[286px] h-[238px] sm:w-[328px] sm:h-[264px] md:w-[356px] md:h-[282px] rounded-2xl overflow-hidden bg-slate-200 border border-slate-300/70 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 select-none"
    >
      <SmoothImage
        src={item.image}
        alt={item.title}
        loading={trackKey === 'a' && idx < 4 ? 'eager' : 'lazy'}
        decoding="async"
        wrapperClassName="w-full h-full"
        skeletonTone="light"
        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
        fallback={
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
            <Camera className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-semibold">현장 시공 사진</span>
          </div>
        }
      />

      {/* 상단 좌/우 태그 */}
      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 pointer-events-none">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-600/95 text-white text-[11.5px] font-bold tracking-tight shadow-xs backdrop-blur-[2px] truncate max-w-[46%]">
          {item.tag || '현장 시공'}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-950/75 text-white text-[11.5px] font-semibold tracking-tight backdrop-blur-[2px] truncate max-w-[52%]">
          <MapPin className="w-3 h-3 text-blue-300 shrink-0" />
          <span className="truncate">{formatRegionLabel(item.region || '수도권 현장')}</span>
        </span>
      </div>

      {/* 하단 그라데이션 캡션 + 확대 아이콘 */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/92 via-slate-950/55 to-transparent pt-10 pb-3 px-3.5 flex items-end justify-between gap-2.5 pointer-events-none">
        <p className="text-[13.5px] sm:text-[14px] font-bold text-white leading-snug line-clamp-1 drop-shadow-xs">
          {item.title}
        </p>
        <span
          aria-hidden="true"
          className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs text-white flex items-center justify-center shrink-0 group-hover:bg-blue-600 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );

  return (
    <div
      ref={scrollRef}
      onTouchStart={(e) => {
        isUserTouchingRef.current = true;
        didSwipeRef.current = false;
        if (resumeTimerRef.current !== null) {
          window.clearTimeout(resumeTimerRef.current);
        }
        const t = e.touches[0];
        if (t) {
          touchStartRef.current = { x: t.clientX, y: t.clientY };
        }
        if (scrollRef.current && trackARef.current) {
          const halfWidth = trackARef.current.offsetWidth;
          if (halfWidth > 0 && scrollRef.current.scrollLeft < 24) {
            scrollRef.current.scrollLeft += halfWidth;
          }
          posRef.current = scrollRef.current.scrollLeft;
        }
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        const start = touchStartRef.current;
        if (t && start && Math.abs(t.clientX - start.x) > 8) {
          didSwipeRef.current = true;
        }
      }}
      onTouchEnd={() => {
        touchStartRef.current = null;
        scheduleResume();
        window.setTimeout(() => {
          didSwipeRef.current = false;
        }, 70);
      }}
      onTouchCancel={() => {
        touchStartRef.current = null;
        scheduleResume();
        didSwipeRef.current = false;
      }}
      onScroll={() => {
        if (isUserTouchingRef.current && scrollRef.current) {
          posRef.current = scrollRef.current.scrollLeft;
          scheduleResume();
        }
      }}
      style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
      className="w-full overflow-x-auto cw-no-scrollbar cw-marquee-gpu py-1"
    >
      <div className="flex items-stretch w-max">
        <div ref={trackARef} className="flex items-stretch gap-3.5 sm:gap-4 pr-3.5 sm:pr-4">
          {items.map((item, idx) => renderCard(item, idx, 'a'))}
        </div>
        <div className="flex items-stretch gap-3.5 sm:gap-4 pr-3.5 sm:pr-4" aria-hidden="true">
          {items.map((item, idx) => renderCard(item, idx, 'b'))}
        </div>
      </div>
    </div>
  );
};

export const SiteShowcaseSection: React.FC<SiteShowcaseSectionProps> = ({
  showcase,
  regions,
  isEditMode,
  onUpdateShowcase,
  onUploadImage,
}) => {
  const items = showcase.items || [];
  const availableRegions = useMemo(
    () => getAvailableGalleryRegions(regions),
    [regions]
  );
  const regionGroups = useMemo(
    () => groupGalleryRegions(availableRegions),
    [availableRegions]
  );
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isPopupEditing, setIsPopupEditing] = useState(false);
  const [draft, setDraft] = useState<SiteShowcaseItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [pendingOpenNewId, setPendingOpenNewId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 팝업: 모바일/데스크톱 네이티브 scroll-snap 좌우 스와이프 (고객후기 팝업과 동일한 부드러운 전환)
  const popupScrollRef = useRef<HTMLDivElement | null>(null);
  const wasPopupTrackOpenRef = useRef<boolean>(false);
  const currentPopupSlotRef = useRef<number>(1);
  const popupScrollSettleTimerRef = useRef<number | null>(null);
  const popupAnimRafRef = useRef<number | null>(null);

  // 안드로이드/모바일 뒤로가기 시 페이지 이탈 없이 팝업만 닫고 직전 스크롤 위치 유지
  const hasShowcaseHistoryRef = useRef<boolean>(false);
  const ignorePopstateCountRef = useRef<number>(0);
  const savedScrollYRef = useRef<number>(0);
  const activeItemIdRef = useRef<string | null>(activeItemId);
  activeItemIdRef.current = activeItemId;

  const openShowcasePopup = useCallback((id: string) => {
    if (typeof window !== 'undefined' && activeItemIdRef.current === null) {
      savedScrollYRef.current = window.scrollY;
      if (!hasShowcaseHistoryRef.current) {
        hasShowcaseHistoryRef.current = true;
        window.history.pushState(
          { ...(window.history.state || {}), cwModalStage: 'showcase' },
          '',
          window.location.href
        );
      }
    }
    setActiveItemId(id);
  }, []);

  const closeShowcasePopup = useCallback(() => {
    setActiveItemId(null);
    if (typeof window !== 'undefined' && hasShowcaseHistoryRef.current) {
      hasShowcaseHistoryRef.current = false;
      ignorePopstateCountRef.current += 1;
      window.history.back();
    }
  }, []);

  const activeIndex = useMemo(() => {
    if (!activeItemId) return -1;
    return items.findIndex((it) => it.id === activeItemId);
  }, [activeItemId, items]);

  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;
  const isModalOpen = activeItem !== null;

  const [row1Items, row2Items] = useMemo(() => {
    if (items.length <= 1) return [items, []];
    const mid = Math.ceil(items.length / 2);
    return [items.slice(0, mid), items.slice(mid)];
  }, [items]);

  // 새로 추가된 슬라이드 즉시 팝업 + 편집 모드로 열기
  useEffect(() => {
    if (!pendingOpenNewId) return;
    const found = items.find((it) => it.id === pendingOpenNewId);
    if (found) {
      openShowcasePopup(found.id);
      setDraft({ ...found });
      setIsPopupEditing(true);
      setUploadError(null);
      setPendingOpenNewId(null);
    }
  }, [pendingOpenNewId, items, openShowcasePopup]);

  // 팝업 닫힘 시 편집 상태 초기화
  useEffect(() => {
    if (!activeItemId) {
      setIsPopupEditing(false);
      setDraft(null);
      setUploadError(null);
    }
  }, [activeItemId]);

  // 관리자 편집 모드가 해제되면 즉시 편집 상태 종료
  useEffect(() => {
    if (!isEditMode) {
      setIsPopupEditing(false);
      setDraft(null);
      setUploadError(null);
    }
  }, [isEditMode]);

  // 안드로이드/모바일 뒤로가기(<) 누르면 팝업만 닫고 팝업 열기 직전 위치로 복원
  useEffect(() => {
    const handlePopState = () => {
      if (ignorePopstateCountRef.current > 0) {
        ignorePopstateCountRef.current -= 1;
        return;
      }

      if (activeItemIdRef.current !== null) {
        hasShowcaseHistoryRef.current = false;
        setIsPopupEditing(false);
        setDraft(null);
        setUploadError(null);
        setActiveItemId(null);
        const targetScrollY = savedScrollYRef.current;
        window.requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - targetScrollY) > 12) {
            window.scrollTo(0, targetScrollY);
          }
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 모달 열림 시 배경 스크롤 잠금
  useEffect(() => {
    if (!isModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen]);

  // 팝업이 열리거나 편집 종료 후 복귀할 때만 초기 슬라이드 위치 즉시 정렬
  useLayoutEffect(() => {
    const isTrackVisible = isModalOpen && !(isEditMode && isPopupEditing && draft);
    if (isTrackVisible && !wasPopupTrackOpenRef.current) {
      const el = popupScrollRef.current;
      if (el && activeIndex >= 0) {
        const width = el.clientWidth;
        const targetSlot = items.length > 1 ? activeIndex + 1 : 0;
        currentPopupSlotRef.current = targetSlot;
        if (width > 0) {
          el.scrollLeft = targetSlot * width;
        }
      }
    }
    wasPopupTrackOpenRef.current = isTrackVisible;
  }, [isModalOpen, isEditMode, isPopupEditing, draft, activeIndex, items.length]);

  // 기기 회전/리사이즈 시 현재 슬라이드 위치 유지
  useEffect(() => {
    const isTrackVisible = isModalOpen && !(isEditMode && isPopupEditing && draft);
    if (!isTrackVisible) return;
    const el = popupScrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      const width = el.clientWidth;
      if (width > 0) {
        el.scrollLeft = currentPopupSlotRef.current * width;
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isModalOpen, isEditMode, isPopupEditing, draft]);

  useEffect(() => {
    return () => {
      if (popupScrollSettleTimerRef.current !== null) {
        window.clearTimeout(popupScrollSettleTimerRef.current);
      }
      if (popupAnimRafRef.current !== null) {
        window.cancelAnimationFrame(popupAnimRafRef.current);
      }
    };
  }, []);

  const normalizeCloneBoundary = useCallback(() => {
    const target = popupScrollRef.current;
    if (!target || items.length <= 1) return;
    const w = target.clientWidth;
    if (w <= 0) return;

    const settledSlot = Math.round(target.scrollLeft / w);
    if (Math.abs(target.scrollLeft - settledSlot * w) <= Math.max(6, w * 0.03)) {
      if (settledSlot <= 0) {
        currentPopupSlotRef.current = items.length;
        target.scrollLeft = items.length * w;
      } else if (settledSlot >= items.length + 1) {
        currentPopupSlotRef.current = 1;
        target.scrollLeft = w;
      }
    }
  }, [items.length]);

  useEffect(() => {
    const isTrackVisible = isModalOpen && !(isEditMode && isPopupEditing && draft);
    if (!isTrackVisible || items.length <= 1) return;
    const el = popupScrollRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      normalizeCloneBoundary();
    };
    el.addEventListener('scrollend', onScrollEnd);
    return () => {
      el.removeEventListener('scrollend', onScrollEnd);
    };
  }, [isModalOpen, isEditMode, isPopupEditing, draft, items.length, normalizeCloneBoundary]);

  const animatePopupToDirection = useCallback(
    (dir: 'prev' | 'next') => {
      if (items.length <= 1 || isPopupEditing) return;
      const el = popupScrollRef.current;
      if (!el) return;
      const width = el.clientWidth;
      if (width <= 0) return;

      if (popupAnimRafRef.current !== null) {
        window.cancelAnimationFrame(popupAnimRafRef.current);
        popupAnimRafRef.current = null;
      }

      let currentSlot = Math.round(el.scrollLeft / width);
      if (currentSlot <= 0) {
        currentSlot = items.length;
        el.scrollLeft = currentSlot * width;
      } else if (currentSlot >= items.length + 1) {
        currentSlot = 1;
        el.scrollLeft = currentSlot * width;
      }

      const nextSlot = dir === 'next' ? currentSlot + 1 : currentSlot - 1;
      currentPopupSlotRef.current = nextSlot;

      const startLeft = el.scrollLeft;
      const targetLeft = nextSlot * width;
      const distance = targetLeft - startLeft;
      const durationMs = 220;
      const startTime = performance.now();

      el.style.scrollSnapType = 'none';

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.scrollLeft = startLeft + distance * eased;

        if (progress < 1) {
          popupAnimRafRef.current = window.requestAnimationFrame(tick);
        } else {
          popupAnimRafRef.current = null;
          el.scrollLeft = targetLeft;
          el.style.scrollSnapType = '';
          normalizeCloneBoundary();
        }
      };

      popupAnimRafRef.current = window.requestAnimationFrame(tick);
    },
    [items.length, isPopupEditing, normalizeCloneBoundary]
  );

  const goToPrev = useCallback(() => {
    if (items.length <= 1 || activeIndex < 0 || isPopupEditing) return;
    animatePopupToDirection('prev');
  }, [items.length, activeIndex, isPopupEditing, animatePopupToDirection]);

  const goToNext = useCallback(() => {
    if (items.length <= 1 || activeIndex < 0 || isPopupEditing) return;
    animatePopupToDirection('next');
  }, [items.length, activeIndex, isPopupEditing, animatePopupToDirection]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPopupEditing) {
          setIsPopupEditing(false);
          setDraft(null);
          setUploadError(null);
        } else {
          closeShowcasePopup();
        }
        return;
      }
      if (isPopupEditing) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isPopupEditing, goToPrev, goToNext, closeShowcasePopup]);

  const handleOpenEditInPopup = () => {
    if (!isEditMode || !activeItem) return;
    const normalizedRegion = normalizeRegionToDetailKey(
      activeItem.region,
      availableRegions
    );
    setDraft({
      ...activeItem,
      region: normalizedRegion || availableRegions[0] || '강남구',
    });
    setUploadError(null);
    setIsPopupEditing(true);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!isEditMode || !file || !draft) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await resizeImageFileToDataUrl(file, 1600);
      const savedUrl = onUploadImage
        ? await onUploadImage(dataUrl, `showcase-${draft.id}`)
        : dataUrl;
      setDraft((prev) => (prev ? { ...prev, image: savedUrl } : null));
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!isEditMode || !draft) return;
    const cleaned: SiteShowcaseItem = {
      ...draft,
      title: draft.title.trim() || '현장 시공 사진',
      description: draft.description.trim(),
      tag: draft.tag.trim() || '현장 시공',
      region: formatRegionLabel(draft.region.trim()) || '수도권 현장',
      image: draft.image.trim() || activeItem?.image || '',
    };

    onUpdateShowcase((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === cleaned.id ? cleaned : it)),
    }));
    setIsPopupEditing(false);
    setDraft(null);
    setUploadError(null);
    setSavedToast(true);
    window.setTimeout(() => setSavedToast(false), 2200);
  };

  const handleAddNewSlide = () => {
    if (!isEditMode) return;
    const newId = `showcase-${Date.now()}`;
    const fallbackImage = items[0]?.image || '/images/gallery/induce_dongtan_apt_living_after.jpg';
    const newItem: SiteShowcaseItem = {
      id: newId,
      image: fallbackImage,
      title: '새 현장 시공 사진 제목을 입력하세요',
      description: '시공 과정과 전후 변화 포인트를 고객이 이해하기 쉽게 작성해 주세요.',
      tag: '유리창 세정',
      region: formatRegionLabel(availableRegions[0] || '강남구'),
    };
    onUpdateShowcase((prev) => ({
      ...prev,
      items: [newItem, ...prev.items],
    }));
    setPendingOpenNewId(newId);
  };

  const handleDeleteCurrent = () => {
    if (!isEditMode || !activeItem || items.length <= 2) return;
    const remaining = items.filter((it) => it.id !== activeItem.id);
    onUpdateShowcase((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== activeItem.id),
    }));
    setIsPopupEditing(false);
    setDraft(null);
    if (remaining[0]?.id) {
      setActiveItemId(remaining[0].id);
    } else {
      closeShowcasePopup();
    }
  };

  if (items.length === 0 && !isEditMode) return null;

  return (
    <section
      id="field-showcase"
      data-has-modal="true"
      className="py-11 md:py-16 bg-slate-100/80 border-b border-slate-300/75 relative overflow-x-clip"
    >
      <div className="cw-section-optimize">
      {/* 섹션 헤더 */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-7 sm:mb-9">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-blue-200/80 text-blue-700 text-xs font-bold tracking-tight shadow-2xs mb-3.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <EditableText
              value={showcase.eyebrow || 'Real Site Gallery & Workflow'}
              onSave={(val) =>
                onUpdateShowcase((prev) => ({ ...prev, eyebrow: val }))
              }
              isEditMode={isEditMode}
              label="현장 슬라이드 상단 라벨 수정"
            />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            <EditableText
              value={showcase.sectionTitle}
              onSave={(val) =>
                onUpdateShowcase((prev) => ({ ...prev, sectionTitle: val }))
              }
              isEditMode={isEditMode}
              label="현장 슬라이드 제목 수정"
            />
          </h2>

          <p className="text-[15px] sm:text-base md:text-[17px] text-slate-600 leading-relaxed break-keep whitespace-pre-line">
            <EditableText
              value={showcase.sectionSubtitle}
              onSave={(val) =>
                onUpdateShowcase((prev) => ({ ...prev, sectionSubtitle: val }))
              }
              isEditMode={isEditMode}
              label="현장 슬라이드 부제목 수정"
              multiline
            />
          </p>

          {isEditMode && (
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                사진을 클릭하면 팝업에서 <strong>사진 교체 · 설명 수정</strong>이 바로 가능합니다
              </span>
              <button
                type="button"
                onClick={handleAddNewSlide}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>현장 사진 추가 ({items.length}장)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2단 교차 무한 슬라이드 */}
      <div className="relative w-full space-y-3.5 sm:space-y-4">
        <div
          aria-hidden="true"
          className="pointer-events-none hidden sm:block absolute inset-y-0 left-0 w-16 md:w-28 bg-gradient-to-r from-slate-100 via-slate-100/80 to-transparent z-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none hidden sm:block absolute inset-y-0 right-0 w-16 md:w-28 bg-gradient-to-l from-slate-100 via-slate-100/80 to-transparent z-10"
        />

        {row1Items.length > 0 && (
          <ShowcaseMarqueeRow
            items={row1Items}
            direction="left"
            speedPxPerSec={42}
            paused={isModalOpen}
            onSelectItem={openShowcasePopup}
          />
        )}

        {row2Items.length > 0 && (
          <ShowcaseMarqueeRow
            items={row2Items}
            direction="right"
            speedPxPerSec={42}
            paused={isModalOpen}
            onSelectItem={openShowcasePopup}
          />
        )}
      </div>
      </div>

      {/* 현장 사진 확대 + 사진교체·설명수정 팝업 모달 (고정 크기) */}
      {activeItem && (
        <div
          className="fixed inset-0 z-[105] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="현장 시공 사진 상세 보기"
          onClick={() => {
            if (!isPopupEditing) closeShowcasePopup();
          }}
        >
          <div
            className="relative w-[calc(100vw-1.25rem)] max-w-[440px] sm:max-w-[700px] h-[min(86dvh,640px)] sm:h-[min(86dvh,690px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 데스크톱 좌우 화살표 */}
            {!isPopupEditing && items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="이전 현장 사진"
                  className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-xl border border-slate-200 absolute top-1/2 -translate-y-1/2 -left-16 cursor-pointer transition-transform active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="다음 현장 사진"
                  className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-xl border border-slate-200 absolute top-1/2 -translate-y-1/2 -right-16 cursor-pointer transition-transform active:scale-95"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              {/* 모달 상단 헤더 */}
              <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-white">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-bold shrink-0">
                    {isPopupEditing && draft ? draft.tag || '작업 구분' : activeItem.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold truncate">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">
                      {formatRegionLabel(
                        isPopupEditing && draft ? draft.region || '지역' : activeItem.region
                      )}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isEditMode && savedToast && !isPopupEditing && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      저장됨
                    </span>
                  )}

                  {isEditMode && !isPopupEditing && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenEditInPopup}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>편집하기</span>
                      </button>
                      {items.length > 2 && (
                        <button
                          type="button"
                          onClick={handleDeleteCurrent}
                          aria-label="이 현장 사진 삭제"
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  {isEditMode && isPopupEditing && (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        disabled={isUploading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>저장</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPopupEditing(false);
                          setDraft(null);
                          setUploadError(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                      >
                        취소
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={closeShowcasePopup}
                    aria-label="팝업 닫기"
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">닫기</span>
                  </button>
                </div>
              </div>

              {/* 모달 본문 (고객후기 팝업과 동일한 네이티브 scroll-snap 좌우 슬라이드) */}
              {!(isEditMode && isPopupEditing && draft) ? (
                (() => {
                  const hasMultiple = items.length > 1;
                  const slides = hasMultiple
                    ? [
                        {
                          slotKey: `clone-prev-${items[items.length - 1].id}`,
                          item: items[items.length - 1],
                        },
                        ...items.map((it) => ({
                          slotKey: `slide-${it.id}`,
                          item: it,
                        })),
                        {
                          slotKey: `clone-next-${items[0].id}`,
                          item: items[0],
                        },
                      ]
                    : [{ slotKey: `slide-${activeItem.id}`, item: activeItem }];

                  return (
                    <div
                      ref={popupScrollRef}
                      onTouchStart={() => {
                        if (popupAnimRafRef.current !== null) {
                          window.cancelAnimationFrame(popupAnimRafRef.current);
                          popupAnimRafRef.current = null;
                          if (popupScrollRef.current) {
                            popupScrollRef.current.style.scrollSnapType = '';
                          }
                        }
                        if (!hasMultiple) return;
                        const el = popupScrollRef.current;
                        if (!el) return;
                        const w = el.clientWidth;
                        if (w <= 0) return;

                        if (el.scrollLeft <= 0.5 * w) {
                          const targetLeft = el.scrollLeft + items.length * w;
                          currentPopupSlotRef.current = Math.round(targetLeft / w);
                          el.scrollLeft = targetLeft;
                        } else if (el.scrollLeft >= (items.length + 0.5) * w) {
                          const targetLeft = el.scrollLeft - items.length * w;
                          currentPopupSlotRef.current = Math.round(targetLeft / w);
                          el.scrollLeft = targetLeft;
                        }
                      }}
                      onScroll={(e) => {
                        if (!hasMultiple) return;
                        const el = e.currentTarget;
                        const width = el.clientWidth;
                        if (width <= 0) return;

                        const rawSlot = Math.round(el.scrollLeft / width);
                        currentPopupSlotRef.current = rawSlot;

                        const mappedIdx =
                          rawSlot <= 0
                            ? items.length - 1
                            : rawSlot >= items.length + 1
                            ? 0
                            : rawSlot - 1;

                        const nextId = items[mappedIdx]?.id;
                        if (nextId) {
                          setActiveItemId((prev) => (prev === nextId ? prev : nextId));
                        }

                        if (popupScrollSettleTimerRef.current !== null) {
                          window.clearTimeout(popupScrollSettleTimerRef.current);
                        }
                        popupScrollSettleTimerRef.current = window.setTimeout(() => {
                          normalizeCloneBoundary();
                        }, 90);
                      }}
                      style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
                      className="flex-1 min-h-0 flex w-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory cw-no-scrollbar cw-marquee-gpu"
                    >
                      {slides.map(({ slotKey, item: slideItem }) => (
                        <div
                          key={slotKey}
                          className="w-full h-full shrink-0 snap-start snap-always flex flex-col overflow-hidden"
                        >
                          {/* 고정 높이 대형 이미지 뷰어 */}
                          <div className="relative shrink-0 h-[330px] sm:h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden select-none">
                            <img
                              src={slideItem.image}
                              alt={slideItem.title}
                              loading="eager"
                              decoding="async"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {/* 현장 캡션 및 설명 (스크롤 없음 · 모바일 최대 3줄) */}
                          <div className="flex-1 min-h-0 overflow-hidden px-4 py-3 sm:px-6 sm:py-3.5 bg-white flex flex-col justify-center space-y-1.5">
                            <h3 className="text-[16px] sm:text-[18px] font-extrabold text-slate-900 leading-snug break-keep line-clamp-2 sm:line-clamp-1">
                              {slideItem.title}
                            </h3>

                            <p className="text-[13.5px] sm:text-[14.5px] text-slate-600 leading-[1.55] break-keep line-clamp-3">
                              {slideItem.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4">

                    {/* 사진 교체 영역 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <ImagePlus className="w-4 h-4 text-blue-600" />
                          사진 교체
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-colors"
                        >
                          {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploading ? '업로드 중...' : '새 사진 파일 선택'}</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelected}
                          className="hidden"
                        />
                      </div>

                      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 h-44 sm:h-52 flex items-center justify-center">
                        {draft.image ? (
                          <img
                            src={draft.image}
                            alt="교체 미리보기"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">이미지 미리보기 없음</span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5 text-slate-400" />
                          또는 이미지 경로 / URL 직접 입력
                        </label>
                        <input
                          type="text"
                          value={draft.image}
                          onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                          placeholder="/images/gallery/..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {uploadError && (
                        <p className="text-xs font-semibold text-red-600">{uploadError}</p>
                      )}
                    </div>

                    {/* 태그 & 지역 수정 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          작업 구분 태그 (좌측 상단)
                        </label>
                        <input
                          type="text"
                          value={draft.tag}
                          onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                          placeholder="예: 아파트 외창, 스퀴지 마감"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {DEFAULT_TAG_SUGGESTIONS.slice(0, 6).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setDraft({ ...draft, tag: preset })}
                              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-semibold text-slate-600 cursor-pointer transition-colors"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          시공 지역 (우측 상단){' '}
                          <span className="font-normal text-blue-600">(상세페이지 연동)</span>
                        </label>
                        <select
                          value={draft.region}
                          onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                          {draft.region && !availableRegions.includes(draft.region) && (
                            <optgroup label="기존 입력값">
                              <option value={draft.region}>
                                {formatRegionLabel(draft.region)}
                              </option>
                            </optgroup>
                          )}
                          {regionGroups.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.items.map((reg) => (
                                <option key={reg} value={reg}>
                                  {formatRegionLabel(reg)}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          상세페이지로 등록된 서울·경기·인천 지역구 중에서 바로 선택할 수 있습니다.
                        </p>
                      </div>
                    </div>

                    {/* 제목 & 상세 설명 수정 */}
                    <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          현장 사진 제목 (슬라이드 하단 캡션)
                        </label>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                          placeholder="예: 동탄 아파트 거실 유리창 전/후 세척 완료"
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          현장 상세 설명 (팝업 본문)
                        </label>
                        <textarea
                          rows={3}
                          value={draft.description}
                          onChange={(e) =>
                            setDraft({ ...draft, description: e.target.value })
                          }
                          placeholder="현장 오염 상태, 사용 장비, 작업 포인트 등을 입력해 주세요."
                          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        />
                      </div>
                    </div>
                  </div>
              )}

              {/* 하단 고정 이전/다음 화살표 네비게이션 (고객후기 팝업과 동일 스타일) */}
              {!isPopupEditing && items.length > 1 && (
                <div className="shrink-0 px-3.5 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={goToPrev}
                    className="inline-flex items-center gap-1 px-3 min-h-[42px] rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>이전 사진</span>
                  </button>

                  <div className="text-center">
                    <div className="text-xs font-medium text-slate-400 leading-tight">
                      좌우로 밀어 넘기기
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={goToNext}
                    className="inline-flex items-center gap-1 px-3 min-h-[42px] rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition-colors"
                  >
                    <span>다음 사진</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

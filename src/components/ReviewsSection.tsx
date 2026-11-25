import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { SmoothImage } from '@/src/components/SmoothImage';
import { EditableText } from '@/src/components/admin/EditableText';
import type {
  ReviewChatMessage,
  ReviewItem,
  ReviewPlatform,
} from '@/src/types/clearworks';

interface ReviewsSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  reviews: ReviewItem[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdateReview: (id: string, field: 'content' | 'author' | 'tag', val: string) => void;
  onSaveReview?: (updated: ReviewItem) => void;
  onAddReview: () => void;
  onDeleteReview: (id: string) => void;
}

const DEFAULT_KAKAO_PHONES = [
  '010-4821-7392',
  '010-6203-8419',
  '010-9135-4802',
  '010-7640-2915',
];

const DAANGN_VERIFY_COUNTS = [3, 4, 2, 5, 3, 2];

const AVATAR_TONES = [
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-amber-100 text-amber-800 border-amber-200',
];

const DEFAULT_SOOMGO_HIGHLIGHTS = [
  '결과물 완성도가 높아요',
  '요청사항을 정확히 반영해요',
  '응대가 친절해요',
  '진행 현황을 수시로 공유해요',
];

function getPlatform(review: ReviewItem, index: number): ReviewPlatform {
  if (review.platform) return review.platform;
  const cycle: ReviewPlatform[] = ['kakao', 'soomgo', 'daangn'];
  return cycle[index % cycle.length];
}

function getKakaoPhone(review: ReviewItem, index: number): string {
  if (review.contactPhone) return review.contactPhone;
  return DEFAULT_KAKAO_PHONES[index % DEFAULT_KAKAO_PHONES.length];
}

/**
 * 성(첫 글자)만 선명하게 노출하고 나머지 이름 부분은 CSS 블러 처리합니다.
 */
const BlurredCustomerName: React.FC<{ name: string; className?: string }> = ({
  name,
  className = '',
}) => {
  const trimmed = (name || '고객').trim();
  const cleanName = trimmed.replace(/\s*고객님$/, '');
  const surname = cleanName.slice(0, 1);
  const givenName = cleanName.slice(1) || 'OO';

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span>{surname}</span>
      <span
        className="blur-[4px] transform-gpu will-change-transform select-none inline-block px-0.5"
        aria-hidden="true"
      >
        {givenName}
      </span>
    </span>
  );
};

/**
 * 010은 선명하게 표시하고 뒤 숫자(중간·끝자리)만 CSS 블러 처리합니다 (카카오톡 전용).
 */
const BlurredPhoneNumber: React.FC<{ phone: string; className?: string }> = ({
  phone,
  className = '',
}) => {
  const normalized = (phone || '010-4821-7392').trim();
  const prefix = normalized.startsWith('010') ? '010' : normalized.slice(0, 3);
  const restRaw = normalized.slice(3);
  const blurredDigits = restRaw.replace(/^-/, '') || '4821-7392';

  return (
    <span className={`inline-flex items-center tabular-nums ${className}`}>
      <span>{prefix}-</span>
      <span
        className="blur-[4px] transform-gpu will-change-transform select-none inline-block px-0.5"
        aria-hidden="true"
      >
        {blurredDigits}
      </span>
    </span>
  );
};

const ReviewImageThumb: React.FC<{
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}> = ({ src, alt, className = '', eager = false }) => {
  return (
    <SmoothImage
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      wrapperClassName="relative w-full h-full overflow-hidden"
      skeletonTone="light"
      className={className}
      fallback={
        <div
          className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 border border-slate-200 ${className}`}
        >
          <Camera className="w-5 h-5 mb-1" />
          <span className="text-[11px] font-medium">현장 사진</span>
        </div>
      }
    />
  );
};

/**
 * 숨고 실제 리뷰 화면과 동일한 파란 톤 '결제인증' 배지
 */
const SoomgoPaymentBadge: React.FC = () => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#EBF3FE] text-[#2F6FE4] text-[10.5px] font-bold whitespace-nowrap shrink-0">
    결제인증
  </span>
);

/**
 * 카카오톡 기본 프로필 아이콘 (부드러운 스쿼클 + 사람 실루엣)
 */
const KakaoDefaultAvatar: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const sizeClass =
    size === 'sm' ? 'w-7 h-7 rounded-[10px]' : 'w-9 h-9 rounded-[12px]';
  const iconClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div
      className={`${sizeClass} bg-[#97B4E6] flex items-center justify-center shrink-0 shadow-2xs`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className={`${iconClass} text-[#DCE7FA] fill-current`}>
        <circle cx="12" cy="8.2" r="3.6" />
        <path d="M5.2 19.6c0-3.4 3.05-5.6 6.8-5.6s6.8 2.2 6.8 5.6v.4H5.2v-.4z" />
      </svg>
    </div>
  );
};

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  reviews,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateReview,
  onSaveReview,
  onAddReview,
  onDeleteReview,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [photoLightbox, setPhotoLightbox] = useState<{
    photos: string[];
    index: number;
    title: string;
  } | null>(null);
  const [isPopupEditing, setIsPopupEditing] = useState(false);
  const [draft, setDraft] = useState<ReviewItem | null>(null);
  const [pendingAddOpen, setPendingAddOpen] = useState(false);

  // 홈 고객후기 가로 스크롤: rAF 서브픽셀 자동 스크롤 + 모바일 손가락 터치 스크롤 동시 지원
  const marqueeScrollRef = useRef<HTMLDivElement | null>(null);
  const marqueeTrackARef = useRef<HTMLDivElement | null>(null);
  const autoScrollPosRef = useRef<number>(0);
  const isUserScrollingMarqueeRef = useRef<boolean>(false);
  const resumeMarqueeTimerRef = useRef<number | null>(null);
  const marqueeTouchStartRef = useRef<{ x: number; y: number } | null>(null);
  const marqueeDidSwipeRef = useRef<boolean>(false);

  // 후기 팝업: 모바일/데스크톱 네이티브 scroll-snap 좌우 스와이프(깜빡임 제거)
  const popupScrollRef = useRef<HTMLDivElement | null>(null);
  const wasPopupTrackOpenRef = useRef<boolean>(false);
  const currentPopupSlotRef = useRef<number>(1);
  const popupScrollSettleTimerRef = useRef<number | null>(null);

  // 안드로이드 뒤로가기(백버튼) 2단계 팝업 스택 관리: 홈 -> 후기팝업(1) -> 사진팝업(2)
  const hasReviewHistoryRef = useRef<boolean>(false);
  const hasPhotoHistoryRef = useRef<boolean>(false);
  const ignorePopstateCountRef = useRef<number>(0);
  const savedHomeScrollYRef = useRef<number>(0);
  const activeIndexRef = useRef<number | null>(activeIndex);
  const photoLightboxRef = useRef(photoLightbox);
  activeIndexRef.current = activeIndex;
  photoLightboxRef.current = photoLightbox;

  // 사진 크게 보기 라이트박스: 좌우 스와이프
  const lightboxTouchRef = useRef<{
    startX: number;
    startY: number;
  } | null>(null);

  const activeReview = activeIndex !== null ? reviews[activeIndex] ?? null : null;

  const openReviewPopup = useCallback((index: number) => {
    if (typeof window !== 'undefined' && activeIndexRef.current === null) {
      savedHomeScrollYRef.current = window.scrollY;
      if (!hasReviewHistoryRef.current) {
        hasReviewHistoryRef.current = true;
        window.history.pushState(
          { ...(window.history.state || {}), cwModalStage: 'review' },
          '',
          window.location.href
        );
      }
    }
    setActiveIndex(index);
  }, []);

  const closeReviewPopup = useCallback(() => {
    setActiveIndex(null);
    if (typeof window !== 'undefined' && hasReviewHistoryRef.current) {
      hasReviewHistoryRef.current = false;
      ignorePopstateCountRef.current += 1;
      window.history.back();
    }
  }, []);

  const closePhotoLightbox = useCallback(() => {
    setPhotoLightbox(null);
    if (typeof window !== 'undefined' && hasPhotoHistoryRef.current) {
      hasPhotoHistoryRef.current = false;
      ignorePopstateCountRef.current += 1;
      window.history.back();
    }
  }, []);

  useEffect(() => {
    if (activeIndex === null) {
      setIsPopupEditing(false);
      setDraft(null);
    }
  }, [activeIndex]);

  useEffect(() => {
    if (!isEditMode) {
      setIsPopupEditing(false);
      setDraft(null);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (pendingAddOpen && reviews.length > 0) {
      const lastIdx = reviews.length - 1;
      openReviewPopup(lastIdx);
      setDraft({ ...reviews[lastIdx] });
      setIsPopupEditing(true);
      setPendingAddOpen(false);
    }
  }, [pendingAddOpen, reviews, openReviewPopup]);

  // 안드로이드/모바일 브라우저 뒤로가기(<) 1단계씩 팝업 닫기 (페이지 이탈·스크롤 초기화 방지)
  useEffect(() => {
    const handlePopState = () => {
      if (ignorePopstateCountRef.current > 0) {
        ignorePopstateCountRef.current -= 1;
        return;
      }

      if (photoLightboxRef.current !== null) {
        hasPhotoHistoryRef.current = false;
        setPhotoLightbox(null);
        return;
      }

      if (activeIndexRef.current !== null) {
        hasReviewHistoryRef.current = false;
        setActiveIndex(null);
        const targetScrollY = savedHomeScrollYRef.current;
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

  const isModalOpen = activeIndex !== null;

  // 홈 하단 고객후기 연속 가로 스크롤 (prefers-reduced-motion / 모바일 환경 무관하게 동작 + 터치 스크롤 허용)
  useEffect(() => {
    if (reviews.length === 0) return;
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const container = marqueeScrollRef.current;
      const trackA = marqueeTrackARef.current;

      if (
        container &&
        trackA &&
        !isModalOpen &&
        !isUserScrollingMarqueeRef.current
      ) {
        const halfWidth = trackA.offsetWidth;
        if (halfWidth > 0) {
          // 서브픽셀 누적기로 모바일 DPR 정수 반올림에 의한 멈춤 현상 방지
          autoScrollPosRef.current += 42 * dt;
          if (autoScrollPosRef.current >= halfWidth) {
            autoScrollPosRef.current -= halfWidth;
          }
          container.scrollLeft = autoScrollPosRef.current;
        }
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(rafId);
      if (resumeMarqueeTimerRef.current !== null) {
        window.clearTimeout(resumeMarqueeTimerRef.current);
      }
    };
  }, [reviews.length, isModalOpen]);

  const scheduleResumeMarquee = useCallback(() => {
    if (resumeMarqueeTimerRef.current !== null) {
      window.clearTimeout(resumeMarqueeTimerRef.current);
    }
    resumeMarqueeTimerRef.current = window.setTimeout(() => {
      const container = marqueeScrollRef.current;
      const trackA = marqueeTrackARef.current;
      if (container && trackA) {
        const halfWidth = trackA.offsetWidth;
        if (halfWidth > 0) {
          const normalized = ((container.scrollLeft % halfWidth) + halfWidth) % halfWidth;
          if (Math.abs(container.scrollLeft - normalized) > 1) {
            container.scrollLeft = normalized;
          }
          autoScrollPosRef.current = normalized;
        }
      }
      isUserScrollingMarqueeRef.current = false;
    }, 900);
  }, []);

  // 팝업이 열리거나 편집 종료 후 복귀할 때만 초기 슬라이드 위치 즉시 정렬
  useLayoutEffect(() => {
    const isTrackVisible = activeIndex !== null && !isPopupEditing;
    if (isTrackVisible && !wasPopupTrackOpenRef.current) {
      const el = popupScrollRef.current;
      if (el) {
        const width = el.clientWidth;
        const targetSlot = reviews.length > 1 ? activeIndex + 1 : 0;
        currentPopupSlotRef.current = targetSlot;
        if (width > 0) {
          el.scrollLeft = targetSlot * width;
        }
      }
    }
    wasPopupTrackOpenRef.current = isTrackVisible;
  }, [activeIndex, isPopupEditing, reviews.length]);

  // 기기 회전/리사이즈 시 현재 후기 슬라이드 위치 유지
  useEffect(() => {
    if (!isModalOpen || isPopupEditing) return;
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
  }, [isModalOpen, isPopupEditing]);

  useEffect(() => {
    return () => {
      if (popupScrollSettleTimerRef.current !== null) {
        window.clearTimeout(popupScrollSettleTimerRef.current);
      }
    };
  }, []);

  const normalizeCloneBoundary = useCallback(() => {
    const target = popupScrollRef.current;
    if (!target || reviews.length <= 1) return;
    const w = target.clientWidth;
    if (w <= 0) return;

    const settledSlot = Math.round(target.scrollLeft / w);
    if (Math.abs(target.scrollLeft - settledSlot * w) <= Math.max(6, w * 0.03)) {
      if (settledSlot <= 0) {
        currentPopupSlotRef.current = reviews.length;
        target.scrollLeft = reviews.length * w;
      } else if (settledSlot >= reviews.length + 1) {
        currentPopupSlotRef.current = 1;
        target.scrollLeft = w;
      }
    }
  }, [reviews.length]);

  useEffect(() => {
    if (!isModalOpen || isPopupEditing || reviews.length <= 1) return;
    const el = popupScrollRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      normalizeCloneBoundary();
    };
    el.addEventListener('scrollend', onScrollEnd);
    return () => {
      el.removeEventListener('scrollend', onScrollEnd);
    };
  }, [isModalOpen, isPopupEditing, reviews.length, normalizeCloneBoundary]);

  const animatePopupToDirection = useCallback(
    (dir: 'prev' | 'next') => {
      if (reviews.length <= 1 || isPopupEditing) return;
      const el = popupScrollRef.current;
      if (!el) return;
      const width = el.clientWidth;
      if (width <= 0) return;

      // 클론 끝단(0 또는 N+1)에 머물러 있으면 먼저 본 슬라이드로 무음 정렬
      let currentSlot = Math.round(el.scrollLeft / width);
      if (currentSlot <= 0) {
        currentSlot = reviews.length;
        el.scrollLeft = currentSlot * width;
      } else if (currentSlot >= reviews.length + 1) {
        currentSlot = 1;
        el.scrollLeft = currentSlot * width;
      }

      const nextSlot = dir === 'next' ? currentSlot + 1 : currentSlot - 1;
      currentPopupSlotRef.current = nextSlot;
      el.scrollTo({ left: nextSlot * width, behavior: 'smooth' });
    },
    [reviews.length, isPopupEditing]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (photoLightbox) {
        if (e.key === 'Escape') {
          closePhotoLightbox();
        } else if (e.key === 'ArrowLeft' && photoLightbox.photos.length > 1) {
          e.preventDefault();
          setPhotoLightbox((prev) =>
            prev
              ? {
                  ...prev,
                  index: (prev.index - 1 + prev.photos.length) % prev.photos.length,
                }
              : null
          );
        } else if (e.key === 'ArrowRight' && photoLightbox.photos.length > 1) {
          e.preventDefault();
          setPhotoLightbox((prev) =>
            prev ? { ...prev, index: (prev.index + 1) % prev.photos.length } : null
          );
        }
        return;
      }

      if (activeIndex === null) return;
      if (e.key === 'Escape') {
        closeReviewPopup();
        return;
      }
      if (isPopupEditing) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        animatePopupToDirection('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        animatePopupToDirection('next');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeIndex,
    isPopupEditing,
    photoLightbox,
    animatePopupToDirection,
    closePhotoLightbox,
    closeReviewPopup,
  ]);

  const handlePrev = () => {
    if (reviews.length <= 1) return;
    animatePopupToDirection('prev');
  };

  const handleNext = () => {
    if (reviews.length <= 1) return;
    animatePopupToDirection('next');
  };

  const handleStartEditInPopup = () => {
    if (!activeReview) return;
    const idx = activeIndex ?? 0;
    const platform = getPlatform(activeReview, idx);
    setDraft({
      ...activeReview,
      platform,
      contactPhone:
        platform === 'kakao' ? getKakaoPhone(activeReview, idx) : activeReview.contactPhone,
      photos: [...(activeReview.photos || [])],
      highlights: [...(activeReview.highlights || [])],
      chatMessages: activeReview.chatMessages
        ? activeReview.chatMessages.map((m) => ({ ...m }))
        : [
            { sender: 'customer', text: activeReview.content, time: '오후 2:18' },
            {
              sender: 'company',
              text: '고객님 소중한 후기 감사합니다! 언제든 편하게 연락 주세요 :)',
              time: '오후 2:24',
            },
          ],
    });
    setIsPopupEditing(true);
  };

  const handleSavePopupDraft = () => {
    if (!draft) return;
    if (onSaveReview) {
      onSaveReview(draft);
    } else {
      onUpdateReview(draft.id, 'author', draft.author);
      onUpdateReview(draft.id, 'content', draft.content);
      onUpdateReview(draft.id, 'tag', draft.tag || '');
    }
    setIsPopupEditing(false);
    setDraft(null);
  };

  const handleDeleteInPopup = () => {
    if (!activeReview || reviews.length <= 1) return;
    onDeleteReview(activeReview.id);
    closeReviewPopup();
  };

  const openPhotoPopup = (
    e: React.MouseEvent,
    photos: string[],
    index: number,
    title: string
  ) => {
    e.stopPropagation();
    if (!photos.length) return;
    if (typeof window !== 'undefined' && !hasPhotoHistoryRef.current) {
      hasPhotoHistoryRef.current = true;
      window.history.pushState(
        { ...(window.history.state || {}), cwModalStage: 'photo' },
        '',
        window.location.href
      );
    }
    setPhotoLightbox({ photos, index, title });
  };

  const renderDaangnPhotosStrip = (
    photos: string[],
    tag: string | undefined,
    clickable: boolean,
    eagerImages = false
  ) => {
    if (!photos.length) return null;
    const shown = photos.slice(0, 3);
    const colClass =
      shown.length === 1
        ? 'grid-cols-1'
        : shown.length === 2
        ? 'grid-cols-2'
        : 'grid-cols-3';

    return (
      <div className={`grid ${colClass} gap-1 rounded-lg overflow-hidden bg-slate-100`}>
        {shown.map((photo, pIdx) => (
          <div
            key={pIdx}
            onClick={
              clickable
                ? (e) => openPhotoPopup(e, photos, pIdx, tag || '당근마켓 후기 사진')
                : undefined
            }
            className={`relative aspect-square bg-slate-100 overflow-hidden ${
              clickable ? 'cursor-zoom-in' : ''
            }`}
          >
            <ReviewImageThumb
              src={photo}
              alt={`${tag || '당근 후기'} 사진 ${pIdx + 1}`}
              eager={eagerImages}
              className="w-full h-full object-cover"
            />
            {pIdx === shown.length - 1 && photos.length > shown.length && (
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white text-xs font-bold tabular-nums">
                +{photos.length - shown.length}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSoomgoCardContent = (
    review: ReviewItem,
    index: number,
    isPopupMode: boolean
  ) => {
    const photos = review.photos || [];
    const highlights =
      review.highlights && review.highlights.length > 0
        ? review.highlights
        : DEFAULT_SOOMGO_HIGHLIGHTS;
    const avatarTone = AVATAR_TONES[index % AVATAR_TONES.length];

    return (
      <div className="space-y-3">
        {/* 1. 상단 프로필 + 결제인증 마크 + 작성일 + 점3개 (전화번호 및 '숨고 고객 후기' 문구 없음) */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-extrabold shrink-0 ${avatarTone}`}
            >
              {(review.author || '고객').slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13.5px] font-bold text-[#222222]">
                  <BlurredCustomerName name={review.author} />
                </span>
                <SoomgoPaymentBadge />
              </div>
              <div className="text-[11px] text-[#888888] mt-0.5 tabular-nums">
                {review.date || '2개월 전'}
              </div>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-[#B5B9C0] shrink-0 mt-1" />
        </div>

        {/* 2. 첨부 사진 썸네일 (홈 카드에서는 카드 팝업 우선, 후기 팝업 내부에서만 사진 확대) */}
        {photos.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {photos.map((photo, pIdx) => (
              <div
                key={pIdx}
                onClick={
                  isPopupMode
                    ? (e) =>
                        openPhotoPopup(e, photos, pIdx, review.tag || '시공 현장 사진')
                    : undefined
                }
                className={`relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 ${
                  isPopupMode ? 'cursor-zoom-in' : ''
                }`}
              >
                <ReviewImageThumb
                  src={photo}
                  alt={`${review.tag || '숨고 후기'} 사진 ${pIdx + 1}`}
                  eager={isPopupMode}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/70 text-white text-[9px] font-bold">
                  후
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 3. 서비스명 + 노란 별 1개 + 5.0 + 왼쪽 세로선 세부 카테고리 */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13.5px] font-extrabold text-[#222222] leading-snug">
              {review.tag || '건물외부 청소(외벽/유리창)'}
            </span>
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <Star className="w-3.5 h-3.5 text-[#FFCE00] fill-[#FFCE00]" />
              <span className="text-[13px] font-extrabold text-[#222222] tabular-nums">
                {(review.rating || 5).toFixed(1)}
              </span>
            </span>
          </div>
          <div className="border-l-2 border-[#D8DCE2] pl-2 text-[11px] text-[#737373] truncate">
            {review.subTag || `${review.serviceCategory || '창문 (통유리창 포함)'} · ${review.region || '수도권'}`}
          </div>
        </div>

        {/* 4. 후기 본문 */}
        <p
          className={`text-[13px] text-[#333333] leading-[1.6] ${
            isPopupMode
              ? 'whitespace-pre-line'
              : photos.length > 0
              ? 'line-clamp-5'
              : 'line-clamp-7'
          }`}
        >
          {review.content}
        </p>

        {/* 5. 실제 숨고 하단 회색 평가 태그 칩 */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {(isPopupMode ? highlights : highlights.slice(0, 4)).map((chip, cIdx) => (
            <span
              key={cIdx}
              className="px-2 py-1 rounded bg-[#F2F4F7] text-[#555D6D] text-[10.5px] font-medium leading-none"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderMarqueeCard = (review: ReviewItem, rawIndex: number, keyPrefix: string) => {
    const index = rawIndex % reviews.length;
    const platform = getPlatform(review, index);
    const photos = review.photos || [];
    const verifyCount = DAANGN_VERIFY_COUNTS[index % DAANGN_VERIFY_COUNTS.length];
    const avatarTone = AVATAR_TONES[index % AVATAR_TONES.length];

    // 1. 카카오톡 세로형 대화 카드 (말풍선 깨짐/잘림 방지 + 기본 프로필 + 통일 하단 바)
    if (platform === 'kakao') {
      const kakaoPhone = getKakaoPhone(review, index);
      const rawMessages =
        review.chatMessages && review.chatMessages.length > 0
          ? review.chatMessages
          : [
              { sender: 'customer' as const, text: review.content, time: '오후 2:18' },
              {
                sender: 'company' as const,
                text: '이용해 주셔서 감사합니다. 언제든 편하게 연락 주세요 :)',
                time: '오후 2:24',
              },
            ];

      // 채팅 길이에 따라 짧은 후기는 콤팩트하게, 긴 후기는 이전보다 약 10% 더 길게 가변 수용
      const maxCharBudget = photos.length > 0 ? 175 : 230;
      const previewMessages: ReviewChatMessage[] = [];
      let usedChars = 0;
      for (const m of rawMessages.slice(0, 5)) {
        const len = (m.text || '').length;
        if (previewMessages.length >= 2 && usedChars + len > maxCharBudget) {
          break;
        }
        previewMessages.push(m);
        usedChars += len;
      }

      return (
        <div
          key={`${keyPrefix}-${review.id}-${rawIndex}`}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (marqueeDidSwipeRef.current) return;
            openReviewPopup(index);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openReviewPopup(index);
            }
          }}
          aria-label={`카카오톡 고객 후기 ${index + 1} 눌러서 보기`}
          className="shrink-0 w-[284px] sm:w-[308px] max-h-none rounded-2xl overflow-hidden border border-slate-200/90 bg-[#bacee0] shadow-xs hover:shadow-xl transition-shadow text-left flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {/* 카톡 상단 채팅방 헤더 */}
          <div className="bg-[#a9bdce] border-b border-black/5 px-3.5 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <ChevronLeft className="w-4 h-4 text-slate-700 shrink-0" />
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-slate-900 flex items-center gap-1 truncate">
                  <BlurredCustomerName name={review.author} />
                  <span className="font-semibold">고객님</span>
                </div>
                <div className="text-[10.5px] text-slate-700">
                  <BlurredPhoneNumber phone={kakaoPhone} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700 shrink-0">
              <Search className="w-3.5 h-3.5" />
              <Menu className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 카톡 대화 본문 (가변 높이 + 말풍선 깨짐 방지) */}
          <div className="px-3 py-3.5 flex flex-col justify-start">
            <div className="space-y-2.5">
              <div className="text-center">
                <span className="inline-block text-[10px] text-slate-700 bg-black/10 rounded-full px-2.5 py-0.5 tabular-nums">
                  {review.date || '2026.05'} · {review.region || '수도권 방문 시공'}
                </span>
              </div>

              {previewMessages.map((msg, msgIdx) => {
                if (msg.sender === 'customer') {
                  const showAvatar =
                    msgIdx === 0 || previewMessages[msgIdx - 1]?.sender !== 'customer';

                  return (
                    <div
                      key={msgIdx}
                      className={`flex items-start gap-1.5 max-w-[94%] ${
                        showAvatar ? '' : 'pl-[34px]'
                      }`}
                    >
                      {showAvatar && <KakaoDefaultAvatar size="sm" />}
                      <div className="min-w-0 flex-1">
                        {showAvatar && (
                          <div className="text-[10px] font-medium text-slate-700 mb-1 leading-none truncate">
                            <BlurredCustomerName name={review.author} />
                            <span> 고객님</span>
                          </div>
                        )}
                        <div className="flex items-end gap-1.5 min-w-0">
                          <div className="relative bg-white text-slate-900 rounded-xl rounded-tl-[2px] px-3 py-2 text-[12px] leading-[1.45] shadow-2xs break-keep">
                            {showAvatar && (
                              <span
                                className="absolute -left-1 top-1.5 w-2 h-2 bg-white rotate-45 rounded-[1px] pointer-events-none"
                                aria-hidden="true"
                              />
                            )}
                            <span className="relative z-10 line-clamp-4">{msg.text}</span>
                          </div>
                          <span className="text-[9px] text-slate-600 shrink-0 tabular-nums leading-none pb-0.5">
                            {msg.time || '오후 2:18'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msgIdx}
                    className="flex items-end justify-end gap-1.5 ml-auto max-w-[88%]"
                  >
                    <span className="text-[9px] text-slate-600 shrink-0 tabular-nums leading-none pb-0.5">
                      {msg.time || '오후 2:24'}
                    </span>
                    <div className="relative bg-[#FEE500] text-[#191919] rounded-xl rounded-tr-[2px] px-3 py-2 text-[12px] leading-[1.45] shadow-2xs break-keep">
                      <span
                        className="absolute -right-1 top-1.5 w-2 h-2 bg-[#FEE500] rotate-45 rounded-[1px] pointer-events-none"
                        aria-hidden="true"
                      />
                      <span className="relative z-10 line-clamp-4">{msg.text}</span>
                    </div>
                  </div>
                );
              })}

              {photos.length > 0 && (
                <div className="flex items-center gap-2 pt-0.5 pl-[34px]">
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-white/80 shadow-2xs shrink-0">
                    <ReviewImageThumb
                      src={photos[0]}
                      alt="시공 완료 사진"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 카톡 하단 입력창 바 */}
          <div className="bg-white border-t border-black/5 px-3 py-1.5 flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 text-[11px] text-slate-400 truncate">
              메시지 입력
            </div>
            <div className="w-6 h-6 rounded bg-[#FEE500] text-[#3A1D1D] flex items-center justify-center shrink-0">
              <Send className="w-3 h-3" />
            </div>
          </div>

          {/* 3개 플랫폼 통일 하단 바 (시공항목 검은색 + 눌러서 보기 숨고/당근 톤 회색) */}
          <div className="bg-white px-4 sm:px-5 pb-3 pt-0.5 shrink-0">
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-black truncate">
                {review.tag || '고층 외벽·유리창 청소'}
              </span>
              <span className="font-bold text-[#737373] shrink-0">→ 눌러서 보기</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. 숨고 실제 후기 카드 (상단 <숨고 고객 후기> / 전화번호 / 하단 이용고객 문구 제거 + 통일 하단 바)
    if (platform === 'soomgo') {
      return (
        <div
          key={`${keyPrefix}-${review.id}-${rawIndex}`}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (marqueeDidSwipeRef.current) return;
            openReviewPopup(index);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openReviewPopup(index);
            }
          }}
          aria-label={`숨고 고객 후기 ${index + 1} 눌러서 보기`}
          className="shrink-0 w-[284px] sm:w-[308px] max-h-none rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:shadow-xl transition-shadow text-left flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2F6FE4]"
        >
          <div className="p-4 sm:p-5 pb-3.5 flex flex-col">
            <div>
              {renderSoomgoCardContent(review, index, false)}
            </div>

            <div className="pt-2.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] shrink-0">
              <span className="font-semibold text-black truncate">
                {review.tag || '유리창·외벽 청소'}
              </span>
              <span className="font-bold text-[#2F6FE4] shrink-0">→ 눌러서 보기</span>
            </div>
          </div>
        </div>
      );
    }

    // 3. 당근마켓 실제 후기 카드 (전화번호·하단 플랫폼 라벨 제거 + → 눌러서 보기)
    return (
      <div
        key={`${keyPrefix}-${review.id}-${rawIndex}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (marqueeDidSwipeRef.current) return;
          openReviewPopup(index);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openReviewPopup(index);
          }
        }}
        aria-label={`당근마켓 고객 후기 ${index + 1} 눌러서 보기`}
        className="shrink-0 w-[284px] sm:w-[308px] max-h-none rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs hover:shadow-xl transition-shadow text-left flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF6F0F]"
      >
        <div className="p-4 sm:p-5 pb-3.5 flex flex-col">
          <div className="space-y-3">
            {/* 실제 당근 상단: 원형 프로필 + 닉네임(블러) + 동네 인증 N회 · 날짜 */}
            <div className="flex items-start gap-2.5">
              <div
                className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-extrabold shrink-0 ${avatarTone}`}
              >
                {(review.author || '당').slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-[#212124] truncate">
                  <BlurredCustomerName name={review.author} />
                </div>
                <div className="text-[11px] text-[#868B94] truncate mt-0.5 tabular-nums">
                  {review.region || '경기도 안양시'} 인증 {verifyCount}회 ·{' '}
                  {review.date || '6개월 전 작성'}
                </div>
              </div>
            </div>

            {/* 작성자 바로 아래 가로 연속 이미지 (홈 카드에서는 카드 팝업 우선) */}
            {renderDaangnPhotosStrip(photos, review.tag, false)}

            {/* 사진 바로 아래 주황 별 1개 + 5.0 */}
            <div className="inline-flex items-center gap-1 pt-0.5">
              <Star className="w-4 h-4 text-[#FF6F0F] fill-[#FF6F0F]" />
              <span className="text-[13.5px] font-extrabold text-[#212124] tabular-nums">
                {(review.rating || 5).toFixed(1)}
              </span>
            </div>

            {/* 실제 당근 본문 */}
            <p
              className={`text-[13px] text-[#212124] leading-[1.6] ${
                photos.length > 0 ? 'line-clamp-6' : 'line-clamp-[10]'
              }`}
            >
              {review.content}
            </p>
          </div>

          <div className="pt-2.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] shrink-0">
            <span className="font-semibold text-black truncate">
              {review.tag || '청소 후기'}
            </span>
            <span className="font-bold text-[#D95300] shrink-0">→ 눌러서 보기</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 md:py-24 bg-slate-50/70 border-y border-slate-200/70 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center gap-1.5 text-amber-400 mb-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Star key={idx} className="w-4 h-4 fill-amber-400" />
            ))}
            <span className="ml-1.5 text-xs font-bold text-slate-600 tabular-nums">
              평점 5.0 · 실제 플랫폼 인증 후기
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
            <EditableText
              value={sectionTitle}
              onSave={onUpdateTitle}
              isEditMode={isEditMode}
              label="고객 후기 섹션 제목 수정"
            />
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed break-keep whitespace-pre-line">
            <EditableText
              value={sectionSubtitle}
              onSave={onUpdateSubtitle}
              isEditMode={isEditMode}
              label="고객 후기 섹션 부제목 수정"
              multiline
            />
          </p>

          {isEditMode && (
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
                카드를 클릭하면 팝업 상단의 <strong>편집하기</strong>로 바로 수정할 수 있습니다
              </span>
              <button
                type="button"
                onClick={() => {
                  setPendingAddOpen(true);
                  onAddReview();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 후기 추가하기</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 터치 가로 스크롤 + 연속 자동 스크롤 하이브리드 후기 스트립 */}
      <div className="relative w-full py-2">
        <div
          aria-hidden="true"
          className="pointer-events-none hidden sm:block absolute inset-y-0 left-0 w-16 md:w-28 bg-gradient-to-r from-slate-50 via-slate-50/75 to-transparent z-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none hidden sm:block absolute inset-y-0 right-0 w-16 md:w-28 bg-gradient-to-l from-slate-50 via-slate-50/75 to-transparent z-10"
        />
        <div
          ref={marqueeScrollRef}
          onTouchStart={(e) => {
            isUserScrollingMarqueeRef.current = true;
            marqueeDidSwipeRef.current = false;
            if (resumeMarqueeTimerRef.current !== null) {
              window.clearTimeout(resumeMarqueeTimerRef.current);
            }
            const t = e.touches[0];
            if (t) {
              marqueeTouchStartRef.current = { x: t.clientX, y: t.clientY };
            }
            if (marqueeScrollRef.current && marqueeTrackARef.current) {
              const halfWidth = marqueeTrackARef.current.offsetWidth;
              if (halfWidth > 0 && marqueeScrollRef.current.scrollLeft < 24) {
                marqueeScrollRef.current.scrollLeft += halfWidth;
              }
              autoScrollPosRef.current = marqueeScrollRef.current.scrollLeft;
            }
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            const start = marqueeTouchStartRef.current;
            if (t && start && Math.abs(t.clientX - start.x) > 8) {
              marqueeDidSwipeRef.current = true;
            }
          }}
          onTouchEnd={() => {
            marqueeTouchStartRef.current = null;
            scheduleResumeMarquee();
            window.setTimeout(() => {
              marqueeDidSwipeRef.current = false;
            }, 60);
          }}
          onTouchCancel={() => {
            marqueeTouchStartRef.current = null;
            marqueeDidSwipeRef.current = false;
            scheduleResumeMarquee();
          }}
          onScroll={() => {
            if (isUserScrollingMarqueeRef.current && marqueeScrollRef.current) {
              autoScrollPosRef.current = marqueeScrollRef.current.scrollLeft;
              scheduleResumeMarquee();
            }
          }}
          style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
          className="w-full overflow-x-auto cw-no-scrollbar"
        >
          <div className="flex items-start w-max">
            <div ref={marqueeTrackARef} className="flex items-start gap-4 pr-4">
              {reviews.map((review, idx) => renderMarqueeCard(review, idx, 'track-a'))}
            </div>
            <div className="flex items-start gap-4 pr-4" aria-hidden="true">
              {reviews.map((review, idx) => renderMarqueeCard(review, idx, 'track-b'))}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 최적화 및 데스크톱 고정 세로 비율 후기 팝업 */}
      {activeReview && activeIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 flex items-center justify-center p-2.5 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="고객 후기 상세 보기"
          onClick={closeReviewPopup}
        >
          <div
            className="relative w-[calc(100vw-1.25rem)] max-w-[404px] sm:max-w-none sm:w-[420px] h-[min(90dvh,680px)] sm:h-[690px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 데스크톱 사이드 좌우 화살표 */}
            {!isPopupEditing && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="이전 고객 후기"
                  className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-xl border border-slate-200 absolute top-1/2 -translate-y-1/2 -left-16 cursor-pointer transition-transform active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="다음 고객 후기"
                  className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-xl border border-slate-200 absolute top-1/2 -translate-y-1/2 -right-16 cursor-pointer transition-transform active:scale-95"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* 고정 크기 팝업 카드 */}
            <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
              {/* 상단 고정 헤더 (<숨고 고객 후기> 등 불필요한 라벨 제거, 편집하기 + 닫기 제공) */}
              <div className="shrink-0 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2 bg-white">
                <span className="text-xs font-bold text-slate-500 tabular-nums">
                  {activeIndex + 1} / {reviews.length}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isEditMode && !isPopupEditing && (
                    <>
                      <button
                        type="button"
                        onClick={handleStartEditInPopup}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>편집하기</span>
                      </button>
                      {reviews.length > 1 && (
                        <button
                          type="button"
                          onClick={handleDeleteInPopup}
                          aria-label="이 후기 삭제"
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
                        onClick={handleSavePopupDraft}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPopupEditing(false);
                          setDraft(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                      >
                        취소
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={closeReviewPopup}
                    aria-label="후기 팝업 닫기"
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="sm:hidden">닫기</span>
                  </button>
                </div>
              </div>

              {/* 본문 영역: 편집 폼 OR 플랫폼별 세로형 뷰 */}
              {isPopupEditing && draft ? (
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-slate-50 text-sm">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'kakao', label: '카카오톡' },
                        { id: 'soomgo', label: '숨고' },
                        { id: 'daangn', label: '당근마켓' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDraft({ ...draft, platform: opt.id })}
                        className={`py-2 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                          draft.platform === opt.id
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        고객명 (성 제외 자동 블러)
                      </label>
                      <input
                        type="text"
                        value={draft.author}
                        onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    {draft.platform === 'kakao' ? (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          전화번호 (010 제외 블러)
                        </label>
                        <input
                          type="text"
                          value={draft.contactPhone || ''}
                          onChange={(e) =>
                            setDraft({ ...draft, contactPhone: e.target.value })
                          }
                          placeholder="010-1234-5678"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          작성일 표기
                        </label>
                        <input
                          type="text"
                          value={draft.date || ''}
                          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                          placeholder="2개월 전"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        지역
                      </label>
                      <input
                        type="text"
                        value={draft.region || ''}
                        onChange={(e) => setDraft({ ...draft, region: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        별점 (1~5)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        step={0.5}
                        value={draft.rating}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            rating: Math.max(1, Math.min(5, Number(e.target.value) || 5)),
                          })
                        }
                        className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      서비스명 / 시공 항목
                    </label>
                    <input
                      type="text"
                      value={draft.tag || ''}
                      onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                    />
                  </div>

                  {draft.platform === 'soomgo' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          숨고 세부 영역 (세로선 오른쪽 표시)
                        </label>
                        <input
                          type="text"
                          value={draft.subTag || ''}
                          onChange={(e) => setDraft({ ...draft, subTag: e.target.value })}
                          placeholder="창문 (통유리창 포함) · 빌딩/상가"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          숨고 평가 태그 (쉼표로 구분)
                        </label>
                        <input
                          type="text"
                          value={(draft.highlights || []).join(', ')}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              highlights: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="결과물 완성도가 높아요, 응대가 친절해요"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      후기 본문
                    </label>
                    <textarea
                      rows={4}
                      value={draft.content}
                      onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs leading-relaxed"
                    />
                  </div>

                  {draft.platform === 'kakao' && (
                    <div className="space-y-2 pt-1 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700">
                          카카오톡 대화 말풍선
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              chatMessages: [
                                ...(draft.chatMessages || []),
                                { sender: 'customer', text: '', time: '오후 3:00' },
                              ],
                            })
                          }
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          + 말풍선 추가
                        </button>
                      </div>
                      {(draft.chatMessages || []).map((msg, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={msg.sender}
                              onChange={(e) => {
                                const next = [...(draft.chatMessages || [])];
                                next[mIdx] = {
                                  ...next[mIdx],
                                  sender: e.target.value as ReviewChatMessage['sender'],
                                };
                                setDraft({ ...draft, chatMessages: next });
                              }}
                              className="text-[11px] font-bold px-2 py-1 rounded border border-slate-200 bg-slate-50"
                            >
                              <option value="customer">고객 말풍선</option>
                              <option value="company">클리어웍스 답변</option>
                            </select>
                            <input
                              type="text"
                              value={msg.time || ''}
                              onChange={(e) => {
                                const next = [...(draft.chatMessages || [])];
                                next[mIdx] = { ...next[mIdx], time: e.target.value };
                                setDraft({ ...draft, chatMessages: next });
                              }}
                              placeholder="오후 2:18"
                              className="w-20 text-[11px] px-2 py-1 rounded border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = (draft.chatMessages || []).filter(
                                  (_, idx) => idx !== mIdx
                                );
                                setDraft({ ...draft, chatMessages: next });
                              }}
                              className="text-[11px] text-red-500 font-bold cursor-pointer"
                            >
                              삭제
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={msg.text}
                            onChange={(e) => {
                              const next = [...(draft.chatMessages || [])];
                              next[mIdx] = { ...next[mIdx], text: e.target.value };
                              setDraft({ ...draft, chatMessages: next });
                            }}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-200 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        첨부 사진 URL 목록
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            photos: [...(draft.photos || []), '/images/apt_after.jpg'],
                          })
                        }
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        + 사진 추가
                      </button>
                    </div>
                    {(draft.photos || []).map((url, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const next = [...(draft.photos || [])];
                            next[pIdx] = e.target.value;
                            setDraft({ ...draft, photos: next });
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = (draft.photos || []).filter((_, i) => i !== pIdx);
                            setDraft({ ...draft, photos: next });
                          }}
                          className="px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                (() => {
                  const renderPopupReviewBody = (targetReview: ReviewItem, targetIdx: number) => {
                    const platform = getPlatform(targetReview, targetIdx);
                    const photos = targetReview.photos || [];
                    const chatMessages = targetReview.chatMessages || [];
                    const verifyCount =
                      DAANGN_VERIFY_COUNTS[targetIdx % DAANGN_VERIFY_COUNTS.length];
                    const avatarTone = AVATAR_TONES[targetIdx % AVATAR_TONES.length];

                    // 1. 카카오톡 팝업
                    if (platform === 'kakao') {
                      const kakaoPhone = getKakaoPhone(targetReview, targetIdx);
                      const messages =
                        chatMessages.length > 0
                          ? chatMessages
                          : [
                              {
                                sender: 'customer' as const,
                                text: targetReview.content,
                                time: '오후 2:18',
                              },
                              {
                                sender: 'company' as const,
                                text: '소중한 후기 감사합니다! 앞으로도 꼼꼼한 시공으로 보답하겠습니다.',
                                time: '오후 2:24',
                              },
                            ];

                      return (
                        <div className="w-full h-full flex flex-col bg-[#bacee0] overflow-hidden">
                          {/* 카톡방 상단 바 */}
                          <div className="shrink-0 bg-[#a9bdce] px-3.5 sm:px-4 py-2 sm:py-2.5 border-b border-black/5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <ChevronLeft className="w-4 h-4 text-slate-700 shrink-0" />
                              <div className="min-w-0">
                                <div className="text-[13.5px] font-bold text-slate-900 flex items-center gap-1">
                                  <BlurredCustomerName name={targetReview.author} />
                                  <span>고객님</span>
                                </div>
                                <div className="text-[11px] text-slate-700">
                                  <BlurredPhoneNumber phone={kakaoPhone} /> ·{' '}
                                  {targetReview.region || '수도권'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-700 shrink-0">
                              <Search className="w-4 h-4" />
                              <Menu className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3.5 sm:px-4 py-2.5 sm:py-3.5 space-y-2 sm:space-y-2.5">
                            <div className="text-center">
                              <span className="inline-block text-[10.5px] sm:text-[11px] font-medium text-slate-700 bg-black/10 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 tabular-nums">
                                {targetReview.date || '2026.05'} ·{' '}
                                {targetReview.region || '수도권 방문 시공'}
                              </span>
                            </div>

                            {messages.map((msg, idx) => {
                              if (msg.sender === 'customer') {
                                const showAvatar =
                                  idx === 0 || messages[idx - 1]?.sender !== 'customer';

                                return (
                                  <div
                                    key={idx}
                                    className={`flex items-start gap-2 max-w-[90%] ${
                                      showAvatar ? '' : 'pl-11'
                                    }`}
                                  >
                                    {showAvatar && <KakaoDefaultAvatar size="md" />}
                                    <div className="min-w-0 flex-1">
                                      {showAvatar && (
                                        <div className="text-[11px] font-medium text-slate-700 mb-1 leading-none">
                                          <BlurredCustomerName name={targetReview.author} />
                                          <span> 고객님</span>
                                        </div>
                                      )}
                                      <div className="flex items-end gap-2">
                                        <div className="relative min-w-0">
                                          {showAvatar && (
                                            <span
                                              className="absolute -left-1 top-2 w-2.5 h-2.5 bg-white rotate-45 rounded-[1px]"
                                              aria-hidden="true"
                                            />
                                          )}
                                          <div className="relative bg-white text-slate-900 rounded-2xl rounded-tl-[4px] px-3 py-2 sm:px-3.5 sm:py-2.5 text-[13px] sm:text-[13.5px] leading-[1.45] sm:leading-relaxed shadow-xs">
                                            {msg.text}
                                          </div>
                                        </div>
                                        <span className="text-[10px] text-slate-700 shrink-0 tabular-nums">
                                          {msg.time || '오후 2:18'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={idx}
                                  className="flex items-end justify-end gap-2 ml-auto max-w-[88%]"
                                >
                                  <span className="text-[10px] text-slate-700 shrink-0 tabular-nums">
                                    {msg.time || '오후 2:24'}
                                  </span>
                                  <div className="relative min-w-0">
                                    <span
                                      className="absolute -right-1 top-2 w-2.5 h-2.5 bg-[#FEE500] rotate-45 rounded-[1px]"
                                      aria-hidden="true"
                                    />
                                    <div className="relative bg-[#FEE500] text-[#191919] rounded-2xl rounded-tr-[4px] px-3 py-2 sm:px-3.5 sm:py-2.5 text-[13px] sm:text-[13.5px] leading-[1.45] sm:leading-relaxed shadow-xs">
                                      {msg.text}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {photos.length > 0 && (
                              <div className="pt-1 sm:pt-1.5 pl-11 flex flex-wrap gap-2">
                                {photos.map((photo, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={(e) =>
                                      openPhotoPopup(e, photos, pIdx, '카카오톡 첨부 사진')
                                    }
                                    className="w-24 h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden border border-white/90 bg-white shadow-xs cursor-zoom-in"
                                  >
                                    <ReviewImageThumb
                                      src={photo}
                                      alt={`카카오톡 첨부 사진 ${pIdx + 1}`}
                                      eager
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 카톡 하단 입력창 */}
                          <div className="shrink-0 bg-white border-t border-black/5 px-3.5 py-2 flex items-center gap-2">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                              <Plus className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-xs text-slate-400">메시지 입력</div>
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-[#FEE500] text-[#3A1D1D] flex items-center justify-center shrink-0">
                              <Send className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // 2. 당근 팝업
                    if (platform === 'daangn') {
                      return (
                        <div className="w-full h-full overflow-y-auto overscroll-y-contain bg-[#F2F3F6] px-3.5 sm:px-4 py-6 flex flex-col">
                          <div className="my-auto bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3.5">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-extrabold shrink-0 ${avatarTone}`}
                              >
                                {(targetReview.author || '당').slice(0, 1)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[15px] font-bold text-[#212124]">
                                  <BlurredCustomerName name={targetReview.author} />
                                </div>
                                <div className="text-xs text-[#868B94] mt-0.5 tabular-nums">
                                  {targetReview.region || '경기도 안양시'} 인증 {verifyCount}회 ·{' '}
                                  {targetReview.date || '6개월 전 작성'}
                                </div>
                              </div>
                            </div>

                            {renderDaangnPhotosStrip(photos, targetReview.tag, true, true)}

                            <div className="inline-flex items-center gap-1 pt-0.5">
                              <Star className="w-4 h-4 text-[#FF6F0F] fill-[#FF6F0F]" />
                              <span className="text-sm font-extrabold text-[#212124] tabular-nums">
                                {(targetReview.rating || 5).toFixed(1)}
                              </span>
                            </div>

                            <p className="text-[14px] text-[#212124] leading-[1.65] whitespace-pre-line">
                              {targetReview.content}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // 3. 숨고 팝업
                    return (
                      <div className="w-full h-full overflow-y-auto overscroll-y-contain bg-[#F4F6F8] px-3.5 sm:px-4 py-6 flex flex-col">
                        <div className="my-auto bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
                          {renderSoomgoCardContent(targetReview, targetIdx, true)}
                        </div>
                      </div>
                    );
                  };

                  const hasMultiple = reviews.length > 1;
                  const slides = hasMultiple
                    ? [
                        {
                          slotKey: `clone-prev-${reviews[reviews.length - 1].id}`,
                          review: reviews[reviews.length - 1],
                          realIndex: reviews.length - 1,
                        },
                        ...reviews.map((review, idx) => ({
                          slotKey: `slide-${review.id}`,
                          review,
                          realIndex: idx,
                        })),
                        {
                          slotKey: `clone-next-${reviews[0].id}`,
                          review: reviews[0],
                          realIndex: 0,
                        },
                      ]
                    : [
                        {
                          slotKey: `slide-${activeReview.id}`,
                          review: activeReview,
                          realIndex: activeIndex,
                        },
                      ];

                  return (
                    <div
                      ref={popupScrollRef}
                      onTouchStart={() => {
                        if (!hasMultiple) return;
                        const el = popupScrollRef.current;
                        if (!el) return;
                        const w = el.clientWidth;
                        if (w <= 0) return;

                        // 직전 스와이프가 클론 끝단(0 또는 N+1)에 걸쳐 있으면 터치 시작과 동시에 본 슬라이드로 즉시 보정해 16->1, 1->16 무한 순환 보장
                        if (el.scrollLeft <= 0.5 * w) {
                          const targetLeft = el.scrollLeft + reviews.length * w;
                          currentPopupSlotRef.current = Math.round(targetLeft / w);
                          el.scrollLeft = targetLeft;
                        } else if (el.scrollLeft >= (reviews.length + 0.5) * w) {
                          const targetLeft = el.scrollLeft - reviews.length * w;
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
                            ? reviews.length - 1
                            : rawSlot >= reviews.length + 1
                            ? 0
                            : rawSlot - 1;

                        setActiveIndex((prev) => (prev === mappedIdx ? prev : mappedIdx));

                        if (popupScrollSettleTimerRef.current !== null) {
                          window.clearTimeout(popupScrollSettleTimerRef.current);
                        }
                        popupScrollSettleTimerRef.current = window.setTimeout(() => {
                          normalizeCloneBoundary();
                        }, 90);
                      }}
                      style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' }}
                      className="flex-1 min-h-0 flex w-full overflow-x-auto overscroll-x-contain snap-x snap-mandatory cw-no-scrollbar"
                    >
                      {slides.map((slide) => (
                        <div
                          key={slide.slotKey}
                          className="w-full h-full shrink-0 snap-start snap-always overflow-hidden"
                        >
                          {renderPopupReviewBody(slide.review, slide.realIndex)}
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}

              {/* 하단 고정 이전/다음 화살표 네비게이션 */}
              <div className="shrink-0 px-3.5 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={isPopupEditing}
                  className="inline-flex items-center gap-1 px-3 min-h-[42px] rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>이전 후기</span>
                </button>
                <div className="text-center">
                  <div className="text-xs font-bold text-slate-500 tabular-nums">
                    {activeIndex + 1} / {reviews.length}
                  </div>
                  {!isPopupEditing && reviews.length > 1 && (
                    <div className="sm:hidden text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                      좌우로 밀어 넘기기
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isPopupEditing}
                  className="inline-flex items-center gap-1 px-3 min-h-[42px] rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer transition-colors"
                >
                  <span>다음 후기</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 후기 첨부 사진 전용 팝업 (닫기 버튼 및 뒤로가기로 이전 화면 복귀) */}
      {photoLightbox && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/92 flex flex-col items-center justify-between p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="첨부 사진 크게 보기"
          onClick={closePhotoLightbox}
        >
          {/* 상단 닫기 헤더 */}
          <div
            className="w-full max-w-3xl flex items-center justify-between gap-3 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs sm:text-sm font-bold truncate">
              {photoLightbox.title}
              {photoLightbox.photos.length > 1 && (
                <span className="ml-2 text-slate-300 tabular-nums">
                  ({photoLightbox.index + 1} / {photoLightbox.photos.length})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={closePhotoLightbox}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-bold cursor-pointer shadow-lg shrink-0"
            >
              <X className="w-4 h-4" />
              <span>닫기</span>
            </button>
          </div>

          {/* 중앙 사진 뷰 (모바일 좌우 스와이프 지원) */}
          <div
            className="relative flex-1 w-full max-w-3xl min-h-0 flex items-center justify-center my-3"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (t) lightboxTouchRef.current = { startX: t.clientX, startY: t.clientY };
            }}
            onTouchEnd={(e) => {
              const start = lightboxTouchRef.current;
              lightboxTouchRef.current = null;
              if (!start || photoLightbox.photos.length <= 1) return;
              const t = e.changedTouches[0];
              if (!t) return;
              const dx = t.clientX - start.startX;
              const dy = t.clientY - start.startY;
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                setPhotoLightbox((prev) =>
                  prev
                    ? {
                        ...prev,
                        index:
                          dx < 0
                            ? (prev.index + 1) % prev.photos.length
                            : (prev.index - 1 + prev.photos.length) % prev.photos.length,
                      }
                    : null
                );
              }
            }}
          >
            {photoLightbox.photos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPhotoLightbox((prev) =>
                    prev
                      ? {
                          ...prev,
                          index:
                            (prev.index - 1 + prev.photos.length) % prev.photos.length,
                        }
                      : null
                  )
                }
                aria-label="이전 사진"
                className="absolute left-1 sm:left-3 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <SmoothImage
              src={photoLightbox.photos[photoLightbox.index]}
              alt={photoLightbox.title}
              wrapperClassName="relative flex items-center justify-center max-w-full max-h-[78dvh] overflow-hidden rounded-xl"
              minSkeletonHeightClass="w-[min(86vw,520px)] min-h-[260px] sm:min-h-[360px]"
              skeletonTone="dark"
              className="max-w-full max-h-[78dvh] rounded-xl object-contain shadow-2xl"
            />

            {photoLightbox.photos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setPhotoLightbox((prev) =>
                    prev ? { ...prev, index: (prev.index + 1) % prev.photos.length } : null
                  )
                }
                aria-label="다음 사진"
                className="absolute right-1 sm:right-3 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

import React from 'react';
import {
  Award,
  CheckCircle2,
  Image as ImageIcon,
  MessageCircle,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { AnimatedCounter } from '@/src/components/AnimatedCounter';
import { SmoothImage } from '@/src/components/SmoothImage';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import { CLEARWORKS_IMAGES } from '@/src/data/clearworksData';
import type { CompanyInfo, HeroData } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';

interface HeroProps {
  hero: HeroData;
  company: CompanyInfo;
  isEditMode: boolean;
  onUpdateHero: (field: keyof HeroData, value: string) => void;
  onUpdateStat: (statId: string, field: 'value' | 'label', value: string) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onScrollToContact: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  hero,
  company,
  isEditMode,
  onUpdateHero,
  onUpdateStat,
  onEditImage,
  onScrollToContact,
}) => {
  const rawBgUrl = hero.afterImage || CLEARWORKS_IMAGES.afterHero;
  const resolvedBgUrl = resolveAssetUrl(rawBgUrl);
  const smsDigits = company.phone.replace(/[^0-9]/g, '');

  const statIcons = [
    <CheckCircle2 key="s1" className="w-5 h-5 text-blue-600" />,
    <Award key="s2" className="w-5 h-5 text-indigo-600" />,
    <ShieldCheck key="s3" className="w-5 h-5 text-emerald-600" />,
    <Star key="s4" className="w-5 h-5 text-amber-500 fill-amber-400" />,
  ];

  return (
    <section id="top" className="relative bg-slate-50/70 border-b border-slate-200/70">
      {/* Wide Full-Bleed Photo Hero Banner */}
      <div className="relative w-full overflow-hidden bg-slate-900 min-h-[320px] sm:min-h-[380px] md:min-h-[540px] flex items-center">
        <SmoothImage
          src={resolvedBgUrl}
          alt="클리어웍스 서울·수도권 유리창청소 전경"
          fetchPriority="high"
          decoding="sync"
          wrapperClassName="absolute inset-0 overflow-hidden"
          skeletonTone="dark"
          className="w-full h-full object-cover object-center scale-[1.01]"
          fallback={
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />
          }
        />

        {/* Layered Atmospheric Scrim for Crisp Text Contrast */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/65 to-slate-950/30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/30"
        />

        {/* Hero Copy & CTA Overlay */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/25 backdrop-blur-md text-sky-100 text-xs font-semibold mb-4 sm:mb-5 border border-sky-300/30 shadow-xs">
              <EditableText
                value={hero.badgeText}
                onSave={(v) => onUpdateHero('badgeText', v)}
                isEditMode={isEditMode}
                label="상단 뱃지 수정"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.18] mb-4 sm:mb-5 whitespace-pre-line drop-shadow-sm max-w-2xl">
              <EditableText
                value={hero.title}
                onSave={(v) => onUpdateHero('title', v)}
                isEditMode={isEditMode}
                label="메인 헤드라인 수정"
                multiline
                as="div"
              />
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-100/95 leading-relaxed font-normal mb-0 md:mb-8 max-w-xl whitespace-pre-line drop-shadow-xs">
              <EditableText
                value={hero.subtitle}
                onSave={(v) => onUpdateHero('subtitle', v)}
                isEditMode={isEditMode}
                label="서브 카피 수정"
                multiline
              />
            </p>

            <div className="hidden md:flex flex-wrap items-center gap-3">
              <a
                href={`tel:${company.phone}`}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-slate-950/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <EditableText
                  value={hero.callButtonText}
                  onSave={(v) => onUpdateHero('callButtonText', v)}
                  isEditMode={isEditMode}
                  label="전화 버튼 문구 수정"
                />
              </a>

              <a
                href={`sms:${smsDigits}`}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-slate-950/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <EditableText
                  value={hero.smsButtonText || '문자 상담하기'}
                  onSave={(v) => onUpdateHero('smsButtonText', v)}
                  isEditMode={isEditMode}
                  label="문자 버튼 문구 수정"
                />
              </a>

              <a
                href={company.kakaoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#3c1e1e] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-slate-950/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
                <EditableText
                  value={hero.kakaoButtonText}
                  onSave={(v) => onUpdateHero('kakaoButtonText', v)}
                  isEditMode={isEditMode}
                  label="카카오톡 버튼 문구 수정"
                />
              </a>

              <button
                type="button"
                onClick={onScrollToContact}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-sm sm:text-base border border-white/35 shadow-lg shadow-slate-950/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer whitespace-nowrap flex items-center justify-center"
              >
                빠른 온라인 견적
              </button>
            </div>
          </div>
        </div>

        {/* Admin Background Image Swap Control */}
        {isEditMode && (
          <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-20">
            <button
              type="button"
              onClick={() =>
                onEditImage({
                  title: '홈 메인 배경 사진 변경',
                  currentUrl: rawBgUrl,
                  defaultUrl: CLEARWORKS_IMAGES.afterHero,
                  onSave: (url) => onUpdateHero('afterImage', url),
                })
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950/85 hover:bg-blue-600 text-white text-xs font-bold shadow-lg border border-white/20 backdrop-blur-md transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-300" />
              <span>배경 사진 변경</span>
            </button>
          </div>
        )}
      </div>

      {/* Trust Stats 4-Column Row */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {hero.stats.map((stat, idx) => (
            <div
              key={stat.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center mb-2.5">
                {statIcons[idx % statIcons.length]}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums">
                {isEditMode ? (
                  <EditableText
                    value={stat.value}
                    onSave={(v) => onUpdateStat(stat.id, 'value', v)}
                    isEditMode={isEditMode}
                    label={`${stat.label} 수치 수정`}
                  />
                ) : (
                  <AnimatedCounter value={stat.value} />
                )}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                <EditableText
                  value={stat.label}
                  onSave={(v) => onUpdateStat(stat.id, 'label', v)}
                  isEditMode={isEditMode}
                  label="통계 라벨 수정"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

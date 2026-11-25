import React from 'react';
import {
  Building2,
  Home,
  Image as ImageIcon,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
} from 'lucide-react';
import { SmoothImage } from '@/src/components/SmoothImage';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import type { ServiceIconName, ServiceItem } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';
import { getRoutePath } from '@/src/utils/seo';

interface ServicesSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  services: ServiceItem[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdateService: (id: string, field: 'title' | 'description' | 'badge', val: string) => void;
  onUpdateServiceImage: (id: string, url: string) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onAddService: () => void;
  onDeleteService: (id: string) => void;
  onViewDetail: (serviceId: string) => void;
}

const ICON_MAP: Record<ServiceIconName, React.ReactNode> = {
  Home: <Home className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />,
  Store: <Store className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />,
  Building2: <Building2 className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />,
  Sparkles: <Sparkles className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />,
  Layers: <Layers className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />,
};

const FALLBACK_ICON_MAP: Record<ServiceIconName, React.ReactNode> = {
  Home: <Home className="w-10 h-10 text-blue-500/70" />,
  Store: <Store className="w-10 h-10 text-blue-500/70" />,
  Building2: <Building2 className="w-10 h-10 text-blue-500/70" />,
  Sparkles: <Sparkles className="w-10 h-10 text-blue-500/70" />,
  Layers: <Layers className="w-10 h-10 text-blue-500/70" />,
  ShieldCheck: <ShieldCheck className="w-10 h-10 text-blue-500/70" />,
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  services,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdateService,
  onUpdateServiceImage,
  onEditImage,
  onAddService,
  onDeleteService,
  onViewDetail,
}) => {
  return (
    <section id="service" className="py-16 md:py-28 bg-white relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-2 block">
            Our Services
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 sm:mb-4">
            <EditableText
              value={sectionTitle}
              onSave={onUpdateTitle}
              isEditMode={isEditMode}
              label="서비스 섹션 제목 수정"
            />
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            <EditableText
              value={sectionSubtitle}
              onSave={onUpdateSubtitle}
              isEditMode={isEditMode}
              label="서비스 섹션 부제목 수정"
            />
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-7 items-stretch">
          {services.map((service) => {
            const rawImageUrl = service.image || service.detail?.afterImage || '';
            const resolvedUrl = resolveAssetUrl(rawImageUrl);

            return (
              <article
                key={service.id}
                onClick={() => onViewDetail(service.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewDetail(service.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-blue-300 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div>
                  <div className="relative aspect-square sm:aspect-[16/10] bg-slate-100 overflow-hidden">
                    <SmoothImage
                      src={resolvedUrl}
                      alt={service.title}
                      loading="lazy"
                      wrapperClassName="w-full h-full overflow-hidden"
                      skeletonTone="light"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      fallback={
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-sky-50 to-slate-100 flex items-center justify-center">
                          {FALLBACK_ICON_MAP[service.iconName]}
                        </div>
                      }
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent pointer-events-none" />

                    {(service.badge || isEditMode) && (
                      <div
                        className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10"
                        onClick={(e) => {
                          if (isEditMode) e.stopPropagation();
                        }}
                      >
                        <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-bold rounded-full bg-blue-600/95 backdrop-blur-xs text-white shadow-sm whitespace-nowrap">
                          <EditableText
                            value={service.badge || '뱃지 추가'}
                            onSave={(v) => onUpdateService(service.id, 'badge', v)}
                            isEditMode={isEditMode}
                            label="서비스 뱃지 수정"
                          />
                        </span>
                      </div>
                    )}

                    {isEditMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditImage({
                            title: `[${service.title}] 서비스 대표 사진 변경`,
                            currentUrl: rawImageUrl,
                            defaultUrl: service.detail?.afterImage,
                            onSave: (url) => onUpdateServiceImage(service.id, url),
                          });
                        }}
                        className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-950/85 hover:bg-blue-600 text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-lg cursor-pointer"
                      >
                        <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>사진 변경</span>
                      </button>
                    )}
                  </div>

                  <div className="px-2.5 pt-3 sm:p-6 sm:pb-0">
                    <div className="flex items-start sm:items-center gap-1.5 sm:gap-2.5 mb-1.5 sm:mb-2.5">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 group-hover:bg-blue-600 flex items-center justify-center transition-colors shrink-0 mt-0.5 sm:mt-0">
                        {ICON_MAP[service.iconName]}
                      </div>
                      <h3 className="min-w-0 flex-1 text-[12px] sm:text-xl font-bold tracking-tight sm:tracking-normal text-slate-900 group-hover:text-blue-600 transition-colors leading-snug break-keep">
                        <EditableText
                          value={service.title}
                          onSave={(v) => onUpdateService(service.id, 'title', v)}
                          isEditMode={isEditMode}
                          label="서비스 제목 수정"
                          displayNode={
                            service.id === 'srv-1' &&
                            service.title === '아파트창문청소·외창청소' ? (
                              <>
                                <span className="sm:hidden">
                                  아파트창문청소·외창
                                  <br />
                                  유리창청소
                                </span>
                                <span className="hidden sm:inline">{service.title}</span>
                              </>
                            ) : service.id === 'srv-2' &&
                              service.title === '매장·사무실 유리창청소' ? (
                              <>
                                <span className="sm:hidden">
                                  매장·사무실
                                  <br />
                                  유리창청소
                                </span>
                                <span className="hidden sm:inline">{service.title}</span>
                              </>
                            ) : undefined
                          }
                        />
                      </h3>
                    </div>

                    <p className="text-[11.5px] sm:text-sm text-slate-600 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                      <EditableText
                        value={service.description}
                        onSave={(v) => onUpdateService(service.id, 'description', v)}
                        isEditMode={isEditMode}
                        label="서비스 설명 수정"
                        multiline
                      />
                    </p>
                  </div>
                </div>

                <div className="px-2.5 sm:px-6 pb-3 sm:pb-6 mt-3 sm:mt-5 pt-2.5 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={getRoutePath({ type: 'service', serviceId: service.id })}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onViewDetail(service.id);
                    }}
                    className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold text-blue-600 group-hover:text-blue-800 transition-colors"
                  >
                    <span className="sm:hidden">상세보기</span>
                    <span className="hidden sm:inline">상세보기 및 작업범위</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>

                  {isEditMode && services.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteService(service.id);
                      }}
                      className="text-[11px] sm:text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}

          {isEditMode && (
            <button
              type="button"
              onClick={onAddService}
              className="rounded-2xl sm:rounded-3xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60 p-4 sm:p-6 flex flex-col items-center justify-center text-blue-600 gap-2 min-h-[220px] sm:min-h-[280px] transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-center">새 서비스 항목 추가하기</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

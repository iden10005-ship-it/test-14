import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { BeforeAfterComparison } from '@/src/components/BeforeAfterComparison';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import { INITIAL_SITE_DATA } from '@/src/data/clearworksData';
import type {
  CompanyInfo,
  InquiryPayload,
  RegionDetail,
  ServiceItem,
  SiteData,
} from '@/src/types/clearworks';
import {
  applyResolvedSeoMeta,
  getRoutePath,
  resolveMatrixDynamicSeo,
  type ResolvedSeoMeta,
} from '@/src/utils/seo';

interface MatrixPageProps {
  regionName: string;
  regionDetail?: RegionDetail;
  service: ServiceItem;
  allServices: ServiceItem[];
  company: CompanyInfo;
  siteData?: SiteData;
  seoMeta?: ResolvedSeoMeta;
  isEditMode?: boolean;
  onUpdateService?: (updated: ServiceItem) => void;
  onEditImage?: (target: ImageEditTarget) => void;
  onBack: () => void;
  onNavigateRegion: (regionName: string) => void;
  onNavigateService: (serviceId: string) => void;
  onNavigateMatrix: (regionName: string, serviceId: string) => void;
  onSubmitInquiry: (payload: InquiryPayload) => void;
}

export const MatrixPage: React.FC<MatrixPageProps> = ({
  regionName,
  regionDetail,
  service,
  allServices,
  company,
  siteData,
  seoMeta: _seoMeta,
  isEditMode = false,
  onUpdateService,
  onEditImage,
  onBack,
  onNavigateRegion,
  onNavigateService,
  onNavigateMatrix,
  onSubmitInquiry,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState(
    `${regionName} ${service.title} 무료 출장 견적을 문의드립니다.`
  );
  const [sent, setSent] = useState(false);

  const seoContextSiteData = useMemo<SiteData>(() => {
    const base = siteData ?? INITIAL_SITE_DATA;
    return {
      ...base,
      company,
      services: { ...base.services, items: allServices },
      regions: regionDetail
        ? {
            ...base.regions,
            details: {
              ...base.regions.details,
              [regionName]: regionDetail,
            },
          }
        : base.regions,
    };
  }, [siteData, company, allServices, regionDetail, regionName]);

  const dynamicSeoMeta = useMemo(
    () => resolveMatrixDynamicSeo(regionName, service, seoContextSiteData, regionDetail),
    [regionName, service, seoContextSiteData, regionDetail]
  );

  useEffect(() => {
    setContent(`${regionName} ${service.title} 무료 출장 견적을 문의드립니다.`);
    setSent(false);
  }, [regionName, service.title]);

  useEffect(() => {
    applyResolvedSeoMeta(dynamicSeoMeta, seoContextSiteData);
  }, [dynamicSeoMeta, seoContextSiteData]);

  const subDistricts = regionDetail?.subDistricts ?? [`${regionName} 전지역`];
  const popularComplexes = regionDetail?.popularComplexes ?? [];
  const leadTime = regionDetail?.leadTime || '당일·익일 무료 방문 견적 가능';
  const siblingServices = allServices.filter((s) => s.id !== service.id);

  const updateDetail = (patch: Partial<ServiceItem['detail']>) => {
    if (!onUpdateService) return;
    onUpdateService({
      ...service,
      detail: { ...service.detail, ...patch },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmitInquiry({
      name,
      phone,
      region: regionName,
      buildingType: service.title,
      content,
    });
    setSent(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>메인으로 돌아가기</span>
          </button>

          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5 font-medium">
            <button
              type="button"
              onClick={() => onNavigateRegion(regionName)}
              className="hover:underline cursor-pointer"
            >
              {regionName}
            </button>
            <span>/</span>
            <button
              type="button"
              onClick={() => onNavigateService(service.id)}
              className="hover:underline cursor-pointer"
            >
              {service.title}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>{regionName} 전담팀 직영 출장</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug mb-3">
            {regionName} {service.title} 전문 | {company.name}
          </h1>

          <p className="text-[15px] sm:text-base md:text-lg text-blue-600 font-bold mb-3">
            <EditableText
              value={service.detail.tagline}
              onSave={(v) => updateDetail({ tagline: v })}
              isEditMode={isEditMode && !!onUpdateService}
              label="서비스 슬로건 수정"
              multiline
            />
          </p>

          <p className="text-[14.5px] sm:text-base text-slate-600 leading-relaxed mb-5">
            {regionName}({subDistricts.slice(0, 6).join(', ')} 등) 전지역에서 {service.title} 시공을 진행합니다.{' '}
            <EditableText
              value={service.detail.duration}
              onSave={(v) => updateDetail({ duration: v })}
              isEditMode={isEditMode && !!onUpdateService}
              label="소요 시간 수정"
            />{' '}
            ·{' '}
            <EditableText
              value={service.detail.priceGuide}
              onSave={(v) => updateDetail({ priceGuide: v })}
              isEditMode={isEditMode && !!onUpdateService}
              label="예상 견적 수정"
            />
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
            <a
              href={`tel:${company.phone}`}
              className="justify-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-md tabular-nums"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span>{company.phone} 전화 상담</span>
            </a>
            <a
              href={company.kakaoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="justify-center px-5 py-3 rounded-xl bg-[#FEE500] text-[#3c1e1e] font-bold text-sm flex items-center gap-2 shadow-2xs"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>카톡 1:1 상담</span>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {regionName} {service.title} 시공 전후 비교
            </h2>
            <p className="text-[13.5px] sm:text-sm text-slate-500 mt-1">
              실제 시공 현장에서 촬영된 시공 전·후 비교 사진입니다.
            </p>
          </div>

          <BeforeAfterComparison
            beforeImage={service.detail.beforeImage}
            afterImage={service.detail.afterImage}
            beforeCaption={service.detail.beforeCaption}
            afterCaption={service.detail.afterCaption}
            beforeAlt={`${regionName} ${service.title} 시공 전 상태`}
            afterAlt={`${regionName} ${service.title} 시공 후 깨끗해진 상태`}
            isEditMode={isEditMode && !!onEditImage}
            onEditBefore={
              onEditImage
                ? () =>
                    onEditImage({
                      title: `[${service.title}] 청소 전(Before) 사진 변경`,
                      currentUrl: service.detail.beforeImage,
                      onSave: (url) => updateDetail({ beforeImage: url }),
                    })
                : undefined
            }
            onEditAfter={
              onEditImage
                ? () =>
                    onEditImage({
                      title: `[${service.title}] 청소 후(After) 사진 변경`,
                      currentUrl: service.detail.afterImage,
                      onSave: (url) => updateDetail({ afterImage: url }),
                    })
                : undefined
            }
            onSaveBeforeCaption={
              onUpdateService ? (val) => updateDetail({ beforeCaption: val }) : undefined
            }
            onSaveAfterCaption={
              onUpdateService ? (val) => updateDetail({ afterCaption: val }) : undefined
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3">
              {regionName} {service.title} 작업 범위
            </h2>
            <ul className="space-y-2.5">
              {service.detail.scopeList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[14px] sm:text-[15px] text-slate-700">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="flex-1">
                    <EditableText
                      value={item}
                      onSave={(v) =>
                        updateDetail({
                          scopeList: service.detail.scopeList.map((s, i) => (i === idx ? v : s)),
                        })
                      }
                      isEditMode={isEditMode && !!onUpdateService}
                      label="작업 범위 수정"
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>사용 장비 및 안심 보증</span>
            </h2>
            <ul className="space-y-2.5">
              {service.detail.equipment.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[14px] sm:text-[15px] text-slate-700">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="flex-1">
                    <EditableText
                      value={item}
                      onSave={(v) =>
                        updateDetail({
                          equipment: service.detail.equipment.map((s, i) => (i === idx ? v : s)),
                        })
                      }
                      isEditMode={isEditMode && !!onUpdateService}
                      label="장비 안내 수정"
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Local Coverage & Complexes */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{regionName} {service.title} 출장 가능 지역 안내</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5" />
              <span>{leadTime}</span>
            </span>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">세부 출장 가능 동</p>
            <div className="flex flex-wrap gap-1.5">
              {subDistricts.map((sub, idx) => (
                <span
                  key={`${sub}-${idx}`}
                  className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200/70"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          {popularComplexes.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-500 mb-2">
                {regionName} 주요 시공 아파트 · 상권 구역
              </p>
              <div className="flex flex-wrap gap-1.5">
                {popularComplexes.map((complex, idx) => (
                  <span
                    key={`${complex}-${idx}`}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold"
                  >
                    {complex}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Service FAQs tailored for this Region */}
        {service.detail.faqList && service.detail.faqList.length > 0 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">
              {regionName} {service.title} 자주 묻는 질문
            </h2>
            <div className="space-y-3">
              {service.detail.faqList.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[15px] font-bold text-slate-900 mb-1">
                    Q. [{regionName}] {faq.q}
                  </p>
                  <p className="text-[14.5px] sm:text-[15px] text-slate-600 leading-relaxed">
                    A. {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">
            {regionName} {service.title} 빠른 견적 신청
          </h3>
          <p className="text-sm text-slate-600 mb-5">
            남겨주시면 영업시간 내에 담당자가 연락드립니다.
          </p>

          {sent ? (
            <div className="py-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-base">견적 신청이 완료되었습니다!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="성함 / 상호명 *"
                  className="px-3.5 py-2.5 text-base sm:text-[15px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="연락처 (010-0000-0000) *"
                  className="px-3.5 py-2.5 text-base sm:text-[15px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-[15px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>무료 견적 신청하기</span>
              </button>
            </form>
          )}
        </div>

        {/* Cross-links to other services in the same region */}
        {siblingServices.length > 0 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {regionName}의 다른 전문 청소 서비스
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  같은 {regionName} 지역 내 다른 유리창·외벽·간판 청소 안내 페이지로 바로 이동하실 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateRegion(regionName)}
                className="self-start sm:self-auto text-xs font-bold text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
              >
                {regionName} 전체 안내 보기 →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {siblingServices.map((other) => (
                <a
                  key={other.id}
                  href={getRoutePath({ type: 'matrix', regionName, serviceId: other.id })}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigateMatrix(regionName, other.id);
                  }}
                  className="text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-700">
                    {regionName} {other.title}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

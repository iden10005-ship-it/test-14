import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type {
  CompanyInfo,
  GalleryPost,
  InquiryPayload,
  RegionDetail,
  ServiceItem,
} from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';

function buildRegionMatchTokens(regionName: string): string[] {
  const tokens = new Set<string>();
  const trimmed = regionName.trim();
  if (trimmed) tokens.add(trimmed);

  for (const part of trimmed.split(/[\s·,/]+/)) {
    const clean = part.trim();
    if (!clean) continue;
    tokens.add(clean);
    if (clean.length >= 3 && /[시군구동]$/.test(clean)) {
      tokens.add(clean.slice(0, -1));
    }
  }
  return Array.from(tokens).filter((t) => t.length >= 2);
}

interface RegionDetailPageProps {
  regionName: string;
  regionDetail?: RegionDetail;
  allServices: ServiceItem[];
  galleryPosts: GalleryPost[];
  company: CompanyInfo;
  isEditMode: boolean;
  onUpdateRegionDetail: (regionName: string, detail: RegionDetail) => void;
  onBack: () => void;
  onSelectMatrix: (regionName: string, serviceId: string) => void;
  onSelectPost: (postId: string) => void;
  onViewGalleryList: () => void;
  onSubmitInquiry: (payload: InquiryPayload) => void;
}

export const RegionDetailPage: React.FC<RegionDetailPageProps> = ({
  regionName,
  regionDetail,
  allServices,
  galleryPosts,
  company,
  isEditMode,
  onUpdateRegionDetail,
  onBack,
  onSelectMatrix,
  onSelectPost,
  onViewGalleryList,
  onSubmitInquiry,
}) => {
  const detail: RegionDetail = regionDetail ?? {
    name: regionName,
    subDistricts: [`${regionName} 1동`, `${regionName} 2동`, '중심 상권', '아파트 밀집 구역'],
    description: `${regionName} 전지역 아파트 외창 및 상가 유리창 전문 신속 출장`,
    leadTime: '상담 접수 후 24시간 이내 방문 견적 가능',
    popularComplexes: [`${regionName} 랜드마크 아파트`, `${regionName} 중심 상업지구`],
    notice: `${regionName} 지역 단체 및 공동구매 접수 시 특별 할인 적용`,
  };

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [buildingType, setBuildingType] = useState('아파트창문청소·외창청소');
  const [content, setContent] = useState(`${regionName} 지역 유리창 청소 무료 견적 문의드립니다.`);
  const [sent, setSent] = useState(false);
  const [newSubDistrict, setNewSubDistrict] = useState('');
  const [newComplex, setNewComplex] = useState('');

  useEffect(() => {
    setContent(`${regionName} 지역 유리창 청소 무료 견적 문의드립니다.`);
    setSent(false);
  }, [regionName]);

  const featuredGalleryPosts = useMemo(() => {
    const tokens = buildRegionMatchTokens(regionName);
    const subTokens = detail.subDistricts
      .map((s) => s.trim().replace(/[동리읍면]$/, ''))
      .filter((s) => s.length >= 2);

    const scored = galleryPosts.map((post, idx) => {
      let score = 0;
      const postRegion = post.region || '';
      const haystack = `${post.title} ${post.excerpt} ${post.tags.join(' ')}`;

      if (postRegion.includes(regionName) || regionName.includes(postRegion)) {
        score += 20;
      }
      for (const tk of tokens) {
        if (postRegion.includes(tk)) score += 8;
        if (haystack.includes(tk)) score += 4;
      }
      for (const sub of subTokens) {
        if (postRegion.includes(sub) || post.title.includes(sub)) score += 3;
      }
      return { post, score, idx };
    });

    scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - a.idx));
    return scored.slice(0, 6).map((item) => item.post);
  }, [galleryPosts, regionName, detail.subDistricts]);

  const updateDetail = (patch: Partial<RegionDetail>) => {
    onUpdateRegionDetail(regionName, {
      ...detail,
      ...patch,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmitInquiry({
      name,
      phone,
      region: regionName,
      buildingType,
      content,
    });
    setSent(true);
  };

  const handleAddSubDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubDistrict.trim()) return;
    updateDetail({ subDistricts: [...detail.subDistricts, newSubDistrict.trim()] });
    setNewSubDistrict('');
  };

  const handleAddComplex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplex.trim()) return;
    updateDetail({ popularComplexes: [...detail.popularComplexes, newComplex.trim()] });
    setNewComplex('');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumb Bar */}
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
            <button type="button" onClick={onBack} className="hover:underline cursor-pointer">
              홈
            </button>
            <span>/</span>
            <span>서비스 지역</span>
            <span>/</span>
            <span className="font-bold text-blue-600">[{regionName}] 유리창 청소</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Region Hero */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{regionName} 전지역 출장 가능</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug mb-3">
              [{regionName}] 유리창청소 전문 {company.name}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-blue-600 font-bold mb-3 leading-relaxed">
              <EditableText
                value={detail.description}
                onSave={(v) => updateDetail({ description: v })}
                isEditMode={isEditMode}
                label="지역 대표 설명 수정"
                multiline
              />
            </p>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
              {regionName} 관내 아파트 외창 물때부터 상가 쇼윈도, 통유리까지 전문 스퀴지 장비와 안심 배상책임보험으로 흔적 없이 맑고 투명하게 케어합니다.
            </p>

            {(detail.notice || isEditMode) && (
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/70 text-xs text-blue-900 font-medium mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="flex-1">
                  <EditableText
                    value={detail.notice || '지역 안내 공지 입력'}
                    onSave={(v) => updateDetail({ notice: v })}
                    isEditMode={isEditMode}
                    label="지역 공지 문구 수정"
                  />
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <a
                href={`tel:${company.phone}`}
                className="justify-center px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all tabular-nums"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>{regionName} 직통 전화 ({company.phone})</span>
              </a>
              <a
                href={company.kakaoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="justify-center px-5 py-3 rounded-xl bg-[#FEE500] text-[#3c1e1e] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs hover:brightness-95 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                <span>카톡 문의</span>
              </a>
              <a
                href="#region-quote"
                className="justify-center px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-colors text-center"
              >
                {regionName} 빠른 출장 견적
              </a>
            </div>
          </div>
        </div>

        {/* SubDistricts & Trust Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {regionName} 출장 가능 세부 동
              </h2>
            </div>

            <p className="text-xs text-slate-500 mb-3.5">
              아래 관내 모든 법정동 및 행정동에 당일/익일 출장 작업이 가능합니다.
            </p>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {detail.subDistricts.map((sub, idx) => (
                <span
                  key={`${sub}-${idx}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200/80"
                >
                  <EditableText
                    value={sub}
                    onSave={(v) =>
                      updateDetail({
                        subDistricts: detail.subDistricts.map((s, i) => (i === idx ? v : s)),
                      })
                    }
                    isEditMode={isEditMode}
                    label="세부 동명 수정"
                  />
                  {isEditMode && detail.subDistricts.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateDetail({
                          subDistricts: detail.subDistricts.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                      title="삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isEditMode && (
              <form onSubmit={handleAddSubDistrict} className="flex items-center gap-2 mt-3">
                <input
                  type="text"
                  value={newSubDistrict}
                  onChange={(e) => setNewSubDistrict(e.target.value)}
                  placeholder="세부 동 추가 (예: 반포동)"
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  방문:{' '}
                  <strong className="text-slate-800">
                    <EditableText
                      value={detail.leadTime}
                      onSave={(v) => updateDetail({ leadTime: v })}
                      isEditMode={isEditMode}
                      label="방문 일정 안내 수정"
                    />
                  </strong>
                </span>
              </span>
              <span className="text-[11px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 whitespace-nowrap">
                무료 출장 견적
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {regionName} 시공 신뢰 보증
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                {regionName} 관내 아파트 및 상가 유리창은 고소 작업 안전 인증 장비와 독일제 친환경 중성 케미컬을 투입하여 창틀 손상 없이 투명하게 복원합니다.
              </p>

              <div className="space-y-2 text-xs font-semibold text-slate-700 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>영업배상책임보험 1억원 가입 완료</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>시공 후 7일 이내 무상 A/S 보증</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 block mb-2">
                주요 출장 아파트/상권
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detail.popularComplexes.map((complex, idx) => (
                  <span
                    key={`${complex}-${idx}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-semibold"
                  >
                    <EditableText
                      value={complex}
                      onSave={(v) =>
                        updateDetail({
                          popularComplexes: detail.popularComplexes.map((c, i) =>
                            i === idx ? v : c
                          ),
                        })
                      }
                      isEditMode={isEditMode}
                      label="주요 단지/상권 수정"
                    />
                    {isEditMode && detail.popularComplexes.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateDetail({
                            popularComplexes: detail.popularComplexes.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-indigo-400 hover:text-red-500 cursor-pointer"
                        title="삭제"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditMode && (
                <form onSubmit={handleAddComplex} className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newComplex}
                    onChange={(e) => setNewComplex(e.target.value)}
                    placeholder="주요 아파트/상권 추가"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Region Featured Gallery Work Logs (Fixed 6 Cards above Custom Services) */}
        {featuredGalleryPosts.length > 0 && (
          <section
            aria-labelledby="region-gallery-heading"
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 sm:mb-6">
              <div>
                <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>실제 현장 시공 일지</span>
                </span>
                <h2
                  id="region-gallery-heading"
                  className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
                >
                  {regionName} 맞춤 실제 현장 작업 사례
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  카드를 클릭하시면 실제 작업 전·후 사진과 상세 시공 과정을 확인하실 수 있습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={onViewGalleryList}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-600 font-bold text-xs border border-slate-200 hover:border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>전체 작업일지 보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {featuredGalleryPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => onSelectPost(post.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPost(post.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                      <img
                        src={resolveAssetUrl(post.coverImage || post.afterImage)}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold shadow-md">
                          {post.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-blue-400" />
                          <span>{post.region}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5 tabular-nums">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span>{post.date}</span>
                      </div>
                      <h3 className="text-sm sm:text-[15px] font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-1.5">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:bg-blue-50/50 transition-colors">
                    <span>자세히 보기</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Region x Service Matrix Links */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-2xs">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            {regionName} 맞춤 서비스 바로가기
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            원하시는 청소 유형을 선택하시면 {regionName} 전용 시공 안내를 확인하실 수 있습니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allServices.map((srv) => (
              <button
                key={srv.id}
                type="button"
                onClick={() => onSelectMatrix(regionName, srv.id)}
                className="text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-2 cursor-pointer group"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-700">
                  {regionName} {srv.title}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Region Quote Form */}
        <div
          id="region-quote"
          className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl"
        >
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-1">
            {regionName} 무료 출장 견적 신청
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-5">
            {regionName} 전담 팀이 신속하게 연락드려 일정과 예상 금액을 안내해 드립니다.
          </p>

          {sent ? (
            <div className="py-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold text-slate-900 text-sm mb-1">견적 신청이 접수되었습니다!</p>
              <p className="text-xs text-slate-600">영업시간 내에 신속히 연락드리겠습니다.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="성함 / 고객명 *"
                  className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="연락처 (010-0000-0000) *"
                  className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="아파트창문청소·외창청소">아파트창문청소·외창청소</option>
                  <option value="상가·매장·사무실 유리창청소">상가·매장·사무실 유리창청소</option>
                  <option value="빌딩 외벽(로프/고소작업차)">빌딩 외벽(로프/고소작업차)</option>
                  <option value="간판청소·어닝청소">간판청소·어닝청소</option>
                  <option value="시트지제거·필름제거">시트지제거·필름제거</option>
                  <option value="기타 청소문의">기타 청소문의</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{regionName} 무료 견적 신청하기</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

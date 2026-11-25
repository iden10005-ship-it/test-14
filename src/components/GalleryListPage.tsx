import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Home,
  Layers,
  LayoutGrid,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { GalleryPostModal } from '@/src/components/admin/GalleryPostModal';
import type { GalleryPost, SiteData } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';
import {
  getGalleryCategories,
  matchesGalleryCategory,
} from '@/src/utils/galleryCategories';
import {
  loadWorkLogPromptTemplate,
  resetWorkLogPromptTemplate,
  saveWorkLogPromptTemplate,
} from '@/src/utils/worklogPromptTemplate';

interface GalleryListPageProps {
  posts: GalleryPost[];
  categories?: string[];
  regions?: string[];
  siteData?: SiteData;
  isEditMode: boolean;
  onAddPost: (post: GalleryPost) => void;
  onUpdatePost: (post: GalleryPost) => void;
  onDeletePost: (postId: string) => void;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onBackHome: () => void;
  onSelectPost: (postId: string) => void;
}

function getCategoryIcon(cat: string) {
  if (cat.includes('아파트') || cat.includes('주택')) return Home;
  if (cat.includes('상가') || cat.includes('매장')) return Store;
  if (cat.includes('빌딩') || cat.includes('외벽')) return Building2;
  if (cat.includes('간판') || cat.includes('어닝')) return Wrench;
  if (cat.includes('시트지') || cat.includes('필름') || cat.includes('썬팅')) return Layers;
  if (cat.includes('기타')) return null;
  return Sparkles;
}

export const GalleryListPage: React.FC<GalleryListPageProps> = ({
  posts,
  categories,
  regions,
  siteData,
  isEditMode,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onUploadImage,
  onBackHome,
  onSelectPost,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<GalleryPost | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedListJson, setCopiedListJson] = useState(false);
  const [promptTemplate, setPromptTemplate] = useState<string>(() =>
    loadWorkLogPromptTemplate()
  );
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptDraft, setPromptDraft] = useState('');
  const gridTopRef = useRef<HTMLDivElement | null>(null);

  const copyPlainText = async (text: string): Promise<boolean> => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      // Fallback below
    }
    if (!ok) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        ok = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        ok = false;
      }
    }
    return ok;
  };

  const handleCopyPrompt = async (overrideText?: string) => {
    const ok = await copyPlainText(overrideText ?? promptTemplate);
    if (ok) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };

  const handleOpenPromptEditor = () => {
    setPromptDraft(promptTemplate);
    setPromptModalOpen(true);
  };

  const handleSavePrompt = (copyAfterSave = false) => {
    const cleaned = promptDraft.trim();
    if (!cleaned) return;
    saveWorkLogPromptTemplate(cleaned);
    setPromptTemplate(cleaned);
    setPromptModalOpen(false);
    if (copyAfterSave) {
      void handleCopyPrompt(cleaned);
    }
  };

  const handleResetPrompt = () => {
    const restored = resetWorkLogPromptTemplate();
    setPromptDraft(restored);
    setPromptTemplate(restored);
  };

  const handleCopyListJson = async () => {
    const payload = siteData
      ? {
          ...siteData,
          gallery: {
            ...siteData.gallery,
            posts,
          },
          updatedAt: new Date().toISOString(),
        }
      : { posts };
    const text = `${JSON.stringify(payload, null, 2)}\n`;
    const ok = await copyPlainText(text);
    if (ok) {
      setCopiedListJson(true);
      setTimeout(() => setCopiedListJson(false), 2500);
    }
  };

  const resolvedCategories = getGalleryCategories(categories);
  const categoryTabs = [
    { id: '전체', label: '전체일지', icon: LayoutGrid },
    ...resolvedCategories.map((cat) => ({
      id: cat,
      label: cat,
      icon: getCategoryIcon(cat),
    })),
  ];

  useEffect(() => {
    if (activeCategory !== '전체' && !resolvedCategories.includes(activeCategory)) {
      setActiveCategory('전체');
    }
  }, [activeCategory, resolvedCategories]);

  const filteredPosts = posts.filter((p) =>
    matchesGalleryCategory(p.category, activeCategory, resolvedCategories)
  );
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    const clamped = Math.max(1, Math.min(nextPage, totalPages));
    setCurrentPage(clamped);
    gridTopRef.current?.scrollIntoView({
      behavior: 'instant' as ScrollBehavior,
      block: 'start',
    });
  };

  const visiblePageNumbers = (() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    const left = Math.max(2, safePage - 1);
    const right = Math.min(totalPages - 1, safePage + 1);
    if (left > 2) pages.push('ellipsis');
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  })();

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <button
            type="button"
            onClick={onBackHome}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            홈
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-800">작업 갤러리 (현장일지)</span>
        </nav>

        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-6 sm:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Real Field Stories &amp; Work Logs</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
                클리어웍스 현장 작업 갤러리
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-5">
                아파트 외창부터 상가·빌딩 외벽까지, 실제 현장에서 직접 시공한 전후 결과와 클리어웍스만의 세척 노하우를 생생한 현장 일지로 만나보세요.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% 직접 시공한 현장 사례만 게재합니다</span>
              </div>
            </div>

            {isEditMode && (
              <div className="flex flex-col items-start md:items-end gap-2.5 self-start md:self-auto shrink-0">
                <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-slate-900/75 border border-white/15 backdrop-blur-md px-3.5 py-2 text-xs shadow-lg">
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-100">
                    <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>작업일지 프롬프트(네이버블로그 반영)</span>
                  </span>
                  <div className="inline-flex items-center gap-1.5 pl-1 border-l border-white/20">
                    <button
                      type="button"
                      onClick={() => void handleCopyPrompt()}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-extrabold cursor-pointer transition-colors ${
                        copiedPrompt
                          ? 'bg-emerald-500 text-white'
                          : 'text-sky-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {copiedPrompt ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedPrompt ? '복사됨!' : '복사'}</span>
                    </button>
                    <span className="text-white/30 select-none" aria-hidden="true">
                      |
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenPromptEditor}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-slate-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>편집</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyListJson}
                    title="삭제/수정된 현재 갤러리 목록을 포함한 전체 JSON을 복사합니다"
                    className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                      copiedListJson
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copiedListJson ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedListJson ? 'JSON 복사 완료!' : 'JSON 복사하기'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(null);
                      setModalOpen(true);
                    }}
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 작업일지 작성하기</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs + Count / Page Size Bar */}
        <div
          ref={gridTopRef}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 scroll-mt-24"
        >
          <div className="flex flex-wrap items-center gap-2">
            {categoryTabs.map((cat) => {
              const isActive = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 text-xs text-slate-600 shrink-0">
            <span className="font-semibold tabular-nums">
              총 <strong className="text-slate-900">{filteredPosts.length}</strong>건
              {filteredPosts.length > 0 && (
                <span className="text-slate-400 ml-1.5">
                  ({startIndex + 1}–{Math.min(startIndex + pageSize, filteredPosts.length)} 표시)
                </span>
              )}
            </span>
            <label className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500">목록 수</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                aria-label="페이지당 게시글 수"
              >
                <option value={6}>6개씩</option>
                <option value={12}>12개씩</option>
              </select>
            </label>
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <p className="text-sm font-bold text-slate-600">
              선택한 카테고리에 등록된 작업일지가 없습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {paginatedPosts.map((post) => (
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
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold shadow-md">
                        {post.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        <span>{post.region}</span>
                      </span>
                    </div>

                    {isEditMode && (
                      <div
                        className="absolute top-3 right-3 z-20 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPost(post);
                            setModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-950/85 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-md cursor-pointer"
                          title="게시글 수정"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>수정</span>
                        </button>
                        {posts.length > 1 &&
                          (confirmDeleteId === post.id ? (
                            <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 shadow-md">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeletePost(post.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                삭제확인
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(post.id)}
                              className="px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-md cursor-pointer"
                              title="게시글 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{post.date}</span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-2">
                      {post.title}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:bg-blue-50/50 transition-colors">
                  <span>자세히 보기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </article>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                aria-label="작업갤러리 페이지 이동"
                className="mt-10 sm:mt-12 flex flex-col items-center justify-center gap-2.5 bg-white border border-slate-200/90 rounded-2xl px-4 sm:px-6 py-4 shadow-2xs"
              >
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handlePageChange(safePage - 1)}
                    disabled={safePage === 1}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>이전</span>
                  </button>

                  {visiblePageNumbers.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1.5 text-xs font-bold text-slate-400 select-none"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        aria-current={item === safePage ? 'page' : undefined}
                        className={`min-w-9 h-9 px-2.5 rounded-xl text-xs font-extrabold tabular-nums transition-all cursor-pointer ${
                          item === safePage
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => handlePageChange(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-slate-700 cursor-pointer transition-colors"
                  >
                    <span>다음</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] font-medium text-slate-500 tabular-nums text-center">
                  총 <strong className="text-slate-900">{filteredPosts.length}</strong>개 작업일지 ·{' '}
                  <strong className="text-blue-600">
                    {safePage} / {totalPages}
                  </strong>{' '}
                  페이지
                </p>
              </nav>
            )}
          </>
        )}
      </div>

      {isEditMode && (
        <>
          <GalleryPostModal
            isOpen={modalOpen}
            editingPost={editingPost}
            categories={resolvedCategories}
            regions={regions}
            siteData={siteData}
            onUploadImage={onUploadImage}
            onClose={() => {
              setModalOpen(false);
              setEditingPost(null);
            }}
            onSave={(saved) => {
              if (editingPost || posts.some((p) => p.id === saved.id)) {
                onUpdatePost(saved);
              } else {
                onAddPost(saved);
              }
            }}
          />

          {promptModalOpen && (
            <div
              className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
              onClick={() => setPromptModalOpen(false)}
            >
              <div
                className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        작업일지 프롬프트 편집 (네이버블로그 반영)
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        원하는 기준이나 문구를 수정·저장해두면 [복사] 버튼 클릭 시 수정된 전체 내용이 복사됩니다.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPromptModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <textarea
                  value={promptDraft}
                  onChange={(e) => setPromptDraft(e.target.value)}
                  rows={16}
                  className="w-full flex-1 px-4 py-3 text-xs sm:text-[13px] leading-relaxed font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetPrompt}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>기본 프롬프트 복원</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setPromptModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      disabled={!promptDraft.trim()}
                      onClick={() => handleSavePrompt(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                    >
                      저장하기
                    </button>
                    <button
                      type="button"
                      disabled={!promptDraft.trim()}
                      onClick={() => handleSavePrompt(true)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>저장 후 복사하기</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

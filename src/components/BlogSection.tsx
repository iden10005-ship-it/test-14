import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import type { BlogPost } from '@/src/types/clearworks';

interface BlogSectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  posts: BlogPost[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdatePostField: (
    postId: string,
    field: 'title' | 'excerpt' | 'coverImage',
    val: string
  ) => void;
  onOpenNewPostModal: () => void;
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onViewBlogList: () => void;
  onSelectPost: (postId: string) => void;
}

const FILTER_TABS = ['전체', '업계 팁', '프로젝트 소식', '유지관리 가이드', '장비·공법'] as const;

export const BlogSection: React.FC<BlogSectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  posts,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdatePostField,
  onOpenNewPostModal,
  onEditPost,
  onDeletePost,
  onEditImage,
  onViewBlogList,
  onSelectPost,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    const base =
      activeCategory === '전체'
        ? posts
        : posts.filter((post) => post.category === activeCategory);
    return base.slice(0, 4);
  }, [posts, activeCategory]);

  const featuredPost = filteredPosts[0];
  const secondaryPosts = filteredPosts.slice(1);

  const handleImageError = (postId: string) => {
    setFailedImages((prev) => ({ ...prev, [postId]: true }));
  };

  return (
    <section
      id="blog"
      aria-labelledby="blog-section-heading"
      className="py-16 md:py-24 bg-white relative border-t border-slate-200/70"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold text-blue-600 tracking-wide mb-2">
              업계 인사이트 &amp; 현장 리포트
            </p>
            <h2
              id="blog-section-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 text-balance"
            >
              <EditableText
                value={sectionTitle}
                onSave={onUpdateTitle}
                isEditMode={isEditMode}
                label="블로그 섹션 제목 수정"
              />
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              <EditableText
                value={sectionSubtitle}
                onSave={onUpdateSubtitle}
                isEditMode={isEditMode}
                label="블로그 섹션 부제목 수정"
              />
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {isEditMode && (
              <button
                type="button"
                onClick={onOpenNewPostModal}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>새 블로그 글 작성</span>
              </button>
            )}
            <button
              type="button"
              onClick={onViewBlogList}
              className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>전체 아티클 보기</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Interactive Category Filter Control */}
        <div className="flex items-center justify-between gap-4 mb-8 overflow-x-auto pb-1">
          <div
            role="tablist"
            aria-label="블로그 카테고리 필터"
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab}
                onClick={() => setActiveCategory(tab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeCategory === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline tabular-nums whitespace-nowrap">
            총 {posts.length}건의 관리 가이드 · 프로젝트 소식
          </span>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 ? (
          <div className="p-12 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              선택한 카테고리에 등록된 게시글이 없습니다.
            </p>
            <div className="flex items-center justify-center gap-2">
              {activeCategory !== '전체' && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('전체')}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  전체 글 보기
                </button>
              )}
              {isEditMode && (
                <button
                  type="button"
                  onClick={onOpenNewPostModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  이 카테고리에 첫 글 쓰기
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Featured Lead Article */}
            {featuredPost && (
              <article
                onClick={() => onSelectPost(featuredPost.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPost(featuredPost.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-slate-300 transition-all duration-200 grid grid-cols-1 lg:grid-cols-12 items-stretch group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto lg:min-h-[300px] bg-slate-100 overflow-hidden">
                  {failedImages[featuredPost.id] || !featuredPost.coverImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 p-6 text-center">
                      <BookOpen className="w-8 h-8 mb-2 text-blue-600" />
                      <span className="text-xs font-bold">{featuredPost.title}</span>
                    </div>
                  ) : (
                    <img
                      src={featuredPost.coverImage}
                      alt={featuredPost.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onError={() => handleImageError(featuredPost.id)}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  )}

                  {isEditMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditImage({
                          title: `[${featuredPost.title}] 대표 이미지 변경`,
                          currentUrl: featuredPost.coverImage,
                          onSave: (url) => onUpdatePostField(featuredPost.id, 'coverImage', url),
                        });
                      }}
                      className="absolute bottom-3 right-3 z-20 px-2.5 py-1.5 rounded-lg bg-slate-950/85 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>사진 변경</span>
                    </button>
                  )}
                </div>

                <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span className="font-bold text-blue-600">{featuredPost.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{featuredPost.publishedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>{featuredPost.readTimeMinutes}분 읽기</span>
                      <span aria-hidden="true">·</span>
                      <span>{featuredPost.author}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug text-balance">
                      <EditableText
                        value={featuredPost.title}
                        onSave={(v) => onUpdatePostField(featuredPost.id, 'title', v)}
                        isEditMode={isEditMode}
                        label="블로그 제목 수정"
                      />
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      <EditableText
                        value={featuredPost.excerpt}
                        onSave={(v) => onUpdatePostField(featuredPost.id, 'excerpt', v)}
                        isEditMode={isEditMode}
                        label="블로그 요약 수정"
                        multiline
                      />
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-blue-600 inline-flex items-center gap-1.5">
                      <span>전문 가이드 읽기</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>

                    {isEditMode && (
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onEditPost(featuredPost)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>편집</span>
                        </button>
                        {confirmDeleteId === featuredPost.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              onDeletePost(featuredPost.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            삭제확인
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(featuredPost.id)}
                            aria-label="글 삭제"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )}

            {/* Secondary Articles Grid */}
            {secondaryPosts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {secondaryPosts.map((post) => (
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
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        {failedImages[post.id] || !post.coverImage ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 p-4 text-center">
                            <BookOpen className="w-6 h-6 mb-1.5 text-blue-600" />
                            <span className="text-xs font-semibold line-clamp-1">
                              {post.title}
                            </span>
                          </div>
                        ) : (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={() => handleImageError(post.id)}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        )}

                        {isEditMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditImage({
                                title: `[${post.title}] 대표 이미지 변경`,
                                currentUrl: post.coverImage,
                                onSave: (url) => onUpdatePostField(post.id, 'coverImage', url),
                              });
                            }}
                            className="absolute bottom-2.5 right-2.5 z-20 px-2 py-1 rounded-lg bg-slate-950/85 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>사진 변경</span>
                          </button>
                        )}
                      </div>

                      <div className="p-5 sm:p-6 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                          <span className="font-bold text-blue-600">{post.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{post.publishedAt}</span>
                          <span aria-hidden="true">·</span>
                          <span>{post.readTimeMinutes}분 읽기</span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 text-balance">
                          <EditableText
                            value={post.title}
                            onSave={(v) => onUpdatePostField(post.id, 'title', v)}
                            isEditMode={isEditMode}
                            label="블로그 제목 수정"
                          />
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                          <EditableText
                            value={post.excerpt}
                            onSave={(v) => onUpdatePostField(post.id, 'excerpt', v)}
                            isEditMode={isEditMode}
                            label="블로그 요약 수정"
                            multiline
                          />
                        </p>
                      </div>
                    </div>

                    <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="text-blue-600 inline-flex items-center gap-1">
                        <span>자세히 읽기</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>

                      {isEditMode && (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onEditPost(post)}
                            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold cursor-pointer"
                          >
                            편집
                          </button>
                          {confirmDeleteId === post.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePost(post.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                            >
                              삭제확인
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(post.id)}
                              aria-label="글 삭제"
                              className="p-1 rounded-md bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { BlogPostModal } from '@/src/components/admin/BlogPostModal';
import type { BlogPost, ServiceItem } from '@/src/types/clearworks';

interface BlogListPageProps {
  posts: BlogPost[];
  services: ServiceItem[];
  companyName: string;
  isEditMode: boolean;
  onAddPost: (post: BlogPost) => void;
  onUpdatePost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onBackHome: () => void;
  onSelectPost: (postId: string) => void;
}

const CATEGORIES = ['전체', '업계 팁', '프로젝트 소식', '유지관리 가이드', '장비·공법'] as const;

export const BlogListPage: React.FC<BlogListPageProps> = ({
  posts,
  services,
  companyName,
  isEditMode,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onUploadImage,
  onBackHome,
  onSelectPost,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      const matchesCat = activeCategory === '전체' || p.category === activeCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, activeCategory, searchQuery]);

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <nav aria-label="브레드크럼" className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <button
            type="button"
            onClick={onBackHome}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            홈
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-800">블로그 &amp; 관리 가이드</span>
        </nav>

        <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white border border-slate-800 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-bold text-blue-400 tracking-wide">
              {companyName} 인사이트 블로그
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
              유리창·외벽 관리 노하우 &amp; 현장 소식
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              계절별 외창 물때 예방법부터 상업 빌딩 고층 작업 리포트까지, 건물 관리자와 점주님께 실질적으로 도움이 되는 현장 가이드를 전해드립니다.
            </p>
          </div>

          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                setEditingPost(null);
                setModalOpen(true);
              }}
              className="self-start md:self-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>새 블로그 글 작성</span>
            </button>
          )}
        </div>

        {/* Category Filter & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="키워드 또는 제목 검색..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-600">
              검색 조건에 맞는 게시글이 없습니다.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('전체');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
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
                  <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                    {failedImages[post.id] || !post.coverImage ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 p-4 text-center">
                        <BookOpen className="w-6 h-6 mb-1.5 text-blue-600" />
                        <span className="text-xs font-semibold line-clamp-1">{post.title}</span>
                      </div>
                    ) : (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [post.id]: true }))
                        }
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
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

                    <h2 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 text-balance">
                      {post.title}
                    </h2>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-blue-600 inline-flex items-center gap-1">
                    <span>아티클 읽기</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>

                  {isEditMode && (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPost(post);
                          setModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>수정</span>
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
                          확인
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

      <BlogPostModal
        isOpen={modalOpen}
        editingPost={editingPost}
        services={services}
        onUploadImage={onUploadImage}
        onClose={() => {
          setModalOpen(false);
          setEditingPost(null);
        }}
        onSave={(saved) => {
          if (editingPost) {
            onUpdatePost(saved);
          } else {
            onAddPost(saved);
          }
        }}
      />
    </div>
  );
};

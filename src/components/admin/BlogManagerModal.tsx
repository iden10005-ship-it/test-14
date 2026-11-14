import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { BlogPostModal } from '@/src/components/admin/BlogPostModal';
import type { BlogPost, ServiceItem } from '@/src/types/clearworks';

interface BlogManagerModalProps {
  isOpen: boolean;
  posts: BlogPost[];
  services: ServiceItem[];
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onAddPost: (post: BlogPost) => void;
  onUpdatePost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onViewPost: (postId: string) => void;
  onViewBlogSection: () => void;
  onClose: () => void;
}

const FILTER_CATEGORIES = ['전체', '업계 팁', '프로젝트 소식', '유지관리 가이드', '장비·공법'];

export const BlogManagerModal: React.FC<BlogManagerModalProps> = ({
  isOpen,
  posts,
  services,
  onUploadImage,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onViewPost,
  onViewBlogSection,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((post) => {
      const catMatch = selectedCategory === '전체' || post.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-manager-title"
      >
        <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 id="blog-manager-title" className="text-lg font-extrabold text-slate-900">
                  블로그 게시글 관리 (Blog)
                </h3>
                <p className="text-xs text-slate-500">
                  업계 팁·프로젝트 소식을 발행하면 메인 섹션, 아티클 페이지, sitemap.xml에 자동 반영됩니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewBlogSection();
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>섹션 보기</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingPost(null);
                  setComposerOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 글 작성</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목·태그 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Posts List */}
          <div className="overflow-y-auto flex-1 py-4 space-y-3 pr-1">
            {filteredPosts.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl space-y-3">
                <p className="text-sm font-semibold text-slate-600">
                  조건에 맞는 블로그 게시글이 없습니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(null);
                    setComposerOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>첫 번째 블로그 글 작성하기</span>
                </button>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-20 aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 tabular-nums">
                        <span className="font-bold text-blue-600">{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.publishedAt}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.readTimeMinutes}분 읽기</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{post.excerpt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewPost(post.id);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                    >
                      열기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPost(post);
                        setComposerOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>수정</span>
                    </button>
                    {confirmDeleteId === post.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeletePost(post.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                        >
                          삭제확인
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(post.id)}
                        aria-label={`${post.title} 삭제`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BlogPostModal
        isOpen={composerOpen}
        editingPost={editingPost}
        services={services}
        onUploadImage={onUploadImage}
        onClose={() => {
          setComposerOpen(false);
          setEditingPost(null);
        }}
        onSave={(savedPost) => {
          if (editingPost) {
            onUpdatePost(savedPost);
          } else {
            onAddPost(savedPost);
          }
        }}
      />
    </>
  );
};

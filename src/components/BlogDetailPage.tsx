import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
  Pencil,
  Send,
} from 'lucide-react';
import { BlogPostModal } from '@/src/components/admin/BlogPostModal';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import type {
  BlogPost,
  CompanyInfo,
  InquiryPayload,
  ServiceItem,
} from '@/src/types/clearworks';

interface BlogDetailPageProps {
  post: BlogPost;
  allPosts: BlogPost[];
  services: ServiceItem[];
  company: CompanyInfo;
  isEditMode: boolean;
  onUpdatePost: (post: BlogPost) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onBackToList: () => void;
  onSelectPost: (postId: string) => void;
  onSelectService: (serviceId: string) => void;
  onSubmitInquiry: (payload: InquiryPayload) => void;
}

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  post,
  allPosts,
  services,
  company,
  isEditMode,
  onUpdatePost,
  onEditImage,
  onUploadImage,
  onBackToList,
  onSelectPost,
  onSelectService,
  onSubmitInquiry,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState(`[블로그 문의] ${post.title} 관련 상담 요청합니다.`);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setImageFailed(false);
    setContent(`[블로그 문의] ${post.title} 관련 상담 요청합니다.`);
    setSent(false);
  }, [post.id, post.title]);

  const relatedService = post.relatedServiceId
    ? services.find((s) => s.id === post.relatedServiceId)
    : undefined;
  const relatedPosts = allPosts.filter((p) => p.id !== post.id).slice(0, 3);

  const paragraphs = post.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmitInquiry({
      name,
      phone,
      region: company.region,
      buildingType: relatedService?.title || post.category,
      content,
    });
    setSent(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-12 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={onBackToList}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>블로그 목록으로 돌아가기</span>
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>이 아티클 수정</span>
            </button>
          )}
        </div>

        <article className="bg-white rounded-3xl border border-slate-200 overflow-hidden mb-10">
          <div className="p-6 sm:p-10 space-y-5 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
              <span className="font-bold text-blue-600">{post.category}</span>
              <span aria-hidden="true">·</span>
              <span>{post.publishedAt}</span>
              <span aria-hidden="true">·</span>
              <span>{post.readTimeMinutes}분 읽기</span>
              <span aria-hidden="true">·</span>
              <span>{post.author}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight text-balance">
              <EditableText
                value={post.title}
                onSave={(v) => onUpdatePost({ ...post, title: v })}
                isEditMode={isEditMode}
                label="제목 수정"
              />
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              <EditableText
                value={post.excerpt}
                onSave={(v) => onUpdatePost({ ...post, excerpt: v })}
                isEditMode={isEditMode}
                label="요약 수정"
                multiline
              />
            </p>
          </div>

          <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
            {imageFailed || !post.coverImage ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 p-6 text-center">
                <BookOpen className="w-10 h-10 mb-2 text-blue-600" />
                <span className="text-sm font-bold">{post.title}</span>
              </div>
            ) : (
              <img
                src={post.coverImage}
                alt={post.title}
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="w-full h-full object-cover"
              />
            )}

            {isEditMode && (
              <button
                type="button"
                onClick={() =>
                  onEditImage({
                    title: `[${post.title}] 대표 이미지 변경`,
                    currentUrl: post.coverImage,
                    onSave: (url) => onUpdatePost({ ...post, coverImage: url }),
                  })
                }
                className="absolute bottom-4 right-4 px-3 py-2 rounded-xl bg-slate-950/85 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>대표 사진 변경</span>
              </button>
            )}
          </div>

          <div className="p-6 sm:p-10 space-y-6">
            {isEditMode ? (
              <div className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                <EditableText
                  value={post.content}
                  onSave={(v) => onUpdatePost({ ...post, content: v })}
                  isEditMode={isEditMode}
                  label="본문 내용 수정"
                  multiline
                />
              </div>
            ) : (
              <div className="space-y-4 text-[15px] sm:text-base text-slate-700 leading-relaxed max-w-[70ch]">
                {paragraphs.map((para, idx) => (
                  <p key={idx} className="whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {post.tags.length > 0 && (
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                <span className="font-bold text-slate-700">관련 주제:</span>
                {post.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}

            {relatedService && (
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-blue-600">관련 시공 서비스 안내</p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {relatedService.title} · {relatedService.detail.priceGuide}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectService(relatedService.id)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>서비스 자세히 보기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </article>

        {/* Quick Inquiry Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 mb-10">
          <h2 className="text-lg font-extrabold text-slate-900 mb-1">
            관련 청소·관리 견적이 궁금하신가요?
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            남겨주시면 {company.name} 전담팀이 현장 상황에 맞춰 무료 상담해 드립니다.
          </p>

          {sent ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>견적 상담 요청이 정상 접수되었습니다. 영업시간 내 빠르게 연락드리겠습니다.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="성함 또는 업체명"
                className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="연락처 (010-0000-0000)"
                className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>무료 상담 신청</span>
              </button>
            </form>
          )}
        </div>

        {/* Related Blog Posts */}
        {relatedPosts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">함께 읽으면 좋은 글</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((rp) => (
                <button
                  key={rp.id}
                  type="button"
                  onClick={() => onSelectPost(rp.id)}
                  className="text-left p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-colors space-y-2 cursor-pointer"
                >
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    <span className="font-bold text-blue-600">{rp.category}</span> · {rp.publishedAt}
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">
                    {rp.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <BlogPostModal
        isOpen={modalOpen}
        editingPost={post}
        services={services}
        onUploadImage={onUploadImage}
        onClose={() => setModalOpen(false)}
        onSave={onUpdatePost}
      />
    </div>
  );
};

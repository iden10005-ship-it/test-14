import React, { useEffect, useState } from 'react';
import { BookOpen, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { CLEARWORKS_IMAGES } from '@/src/data/clearworksData';
import type { BlogPost, ServiceItem } from '@/src/types/clearworks';

interface BlogPostModalProps {
  isOpen: boolean;
  editingPost: BlogPost | null;
  services: ServiceItem[];
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onClose: () => void;
  onSave: (post: BlogPost) => void;
}

const CATEGORY_OPTIONS = ['업계 팁', '프로젝트 소식', '유지관리 가이드', '장비·공법'] as const;

const PRESET_IMAGES = [
  { label: '아파트 외창', url: CLEARWORKS_IMAGES.aptAfter },
  { label: '빌딩 외벽', url: CLEARWORKS_IMAGES.buildingAfter },
  { label: '상가 쇼윈도', url: CLEARWORKS_IMAGES.storeAfter },
  { label: '시공 완료 전경', url: CLEARWORKS_IMAGES.afterHero },
];

export const BlogPostModal: React.FC<BlogPostModalProps> = ({
  isOpen,
  editingPost,
  services,
  onUploadImage,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('업계 팁');
  const [publishedAt, setPublishedAt] = useState('');
  const [author, setAuthor] = useState('클리어웍스 기술연구소');
  const [readTimeMinutes, setReadTimeMinutes] = useState<number>(4);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(CLEARWORKS_IMAGES.aptAfter);
  const [tagsText, setTagsText] = useState('유리창청소, 외벽관리, 발수코팅');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [relatedServiceId, setRelatedServiceId] = useState<string>('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    if (editingPost) {
      setTitle(editingPost.title);
      setCategory(editingPost.category || '업계 팁');
      setPublishedAt(editingPost.publishedAt);
      setAuthor(editingPost.author);
      setReadTimeMinutes(editingPost.readTimeMinutes || 4);
      setExcerpt(editingPost.excerpt);
      setContent(editingPost.content);
      setCoverImage(editingPost.coverImage || CLEARWORKS_IMAGES.aptAfter);
      setTagsText(editingPost.tags.join(', '));
      setSeoKeywords(editingPost.seoKeywords ?? '');
      setRelatedServiceId(editingPost.relatedServiceId ?? '');
    } else {
      const today = new Date();
      const formatted = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(
        2,
        '0'
      )}.${String(today.getDate()).padStart(2, '0')}`;
      setTitle('');
      setCategory('업계 팁');
      setPublishedAt(formatted);
      setAuthor('클리어웍스 기술연구소');
      setReadTimeMinutes(4);
      setExcerpt('');
      setContent('');
      setCoverImage(CLEARWORKS_IMAGES.aptAfter);
      setTagsText('유리창청소, 외벽관리, 물때제거');
      setSeoKeywords('');
      setRelatedServiceId(services[0]?.id ?? '');
    }
  }, [isOpen, editingPost, services]);

  if (!isOpen) return null;

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingCover(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        setUploadingCover(false);
        return;
      }
      const img = new Image();
      img.onload = async () => {
        const maxWidth = 1400;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const dataUrl = ctx
          ? (() => {
              ctx.drawImage(img, 0, 0, width, height);
              return canvas.toDataURL('image/jpeg', 0.86);
            })()
          : (reader.result as string);

        try {
          if (onUploadImage) {
            const uploadedUrl = await onUploadImage(
              dataUrl,
              `blog-${file.name.replace(/\.[^.]+$/, '')}`
            );
            setCoverImage(uploadedUrl);
          } else {
            setCoverImage(dataUrl);
          }
        } finally {
          setUploadingCover(false);
        }
      };
      img.onerror = () => setUploadingCover(false);
      img.src = reader.result;
    };
    reader.onerror = () => setUploadingCover(false);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('게시글 제목을 입력해 주세요.');
      return;
    }
    if (!content.trim() && !excerpt.trim()) {
      setFormError('본문 또는 요약 설명을 입력해 주세요.');
      return;
    }

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const safeContent = content.trim() || excerpt.trim();
    const safeExcerpt =
      excerpt.trim() ||
      safeContent
        .replace(/\s+/g, ' ')
        .slice(0, 120)
        .trim();

    const estimatedRead = Math.max(
      1,
      Math.min(20, Number(readTimeMinutes) || Math.ceil(safeContent.length / 400))
    );

    const nextPost: BlogPost = {
      id: editingPost?.id ?? `blog-${Date.now()}`,
      title: title.trim(),
      category: category.trim() || '업계 팁',
      publishedAt: publishedAt.trim() || '2026.11.14',
      author: author.trim() || '클리어웍스 편집팀',
      readTimeMinutes: estimatedRead,
      excerpt: safeExcerpt,
      content: safeContent,
      coverImage: coverImage.trim() || CLEARWORKS_IMAGES.aptAfter,
      tags: tags.length > 0 ? tags : ['유리창청소', '외벽청소'],
      seoKeywords: seoKeywords.trim() || undefined,
      relatedServiceId: relatedServiceId || undefined,
    };

    onSave(nextPost);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[125] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-post-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 id="blog-post-modal-title" className="text-lg font-extrabold text-slate-900">
                {editingPost ? '블로그 글 수정' : '새 블로그 글 작성'}
              </h3>
              <p className="text-xs text-slate-500">
                업계 팁이나 프로젝트 소식을 작성해 구글·네이버 SEO 검색 노출을 강화하세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="모달 닫기"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4 pt-5 pr-1">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              게시글 제목 * (검색 결과 헤드라인)
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 장마철 아파트 외창 물때 방지 및 발수코팅 유지 기간 안내"
              className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">연관 서비스</label>
              <select
                value={relatedServiceId}
                onChange={(e) => setRelatedServiceId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="">선택 안함 (일반 상담 연결)</option>
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">작성일</label>
              <input
                type="text"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                placeholder="2026.11.14"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">작성자/팀</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="클리어웍스 기술연구소"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">예상 읽기(분)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>대표 썸네일 이미지 (OG 공유 이미지 겸용)</span>
              </label>
              <label className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                {uploadingCover ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                <span>{uploadingCover ? '업로드 중...' : '파일 업로드'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-full sm:w-40 aspect-[16/10] rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                <img
                  src={coverImage}
                  alt="대표 이미지 미리보기"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="/images/apt_after.jpg 또는 https://..."
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setCoverImage(preset.url)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                        coverImage === preset.url
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              핵심 요약 (목록 카드 및 검색 결과 메타 설명)
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="독자와 검색엔진에게 보여줄 핵심 요약 1~2문장 (비워두면 본문 앞부분이 자동 적용됩니다)"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">본문 내용 *</label>
            <textarea
              rows={7}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="업계 팁, 현장 공법, 프로젝트 성과 및 주의사항을 문단(엔터) 단위로 상세히 작성하세요."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="유리창청소, 외창발수코팅, 물때제거"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                SEO 집중 키워드 (선택)
              </label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="예: 강남 유리창청소, 아파트 외창 물때 제거"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={uploadingCover}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-60 transition-colors"
            >
              {editingPost ? '수정 내용 저장' : '블로그 글 발행'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Globe,
  Heading2,
  ImagePlus,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { CLEARWORKS_IMAGES } from '@/src/data/clearworksData';
import type { GalleryBlock, GalleryPost } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';
import {
  blocksToPlainContent,
  getPostBlocks,
  getPostCoverImage,
} from '@/src/utils/galleryBlocks';
import {
  buildWorkLogImageFilename,
  formatBytes,
  optimizeWorkLogImage,
} from '@/src/utils/imageOptimizer';
import {
  getGalleryCategories,
  normalizeGalleryCategory,
} from '@/src/utils/galleryCategories';
import {
  formatSeoKeywords,
  generateNaverPostSeo,
  MAX_SEO_KEYWORDS,
  parseSeoKeywords,
} from '@/src/utils/naverSeoGenerator';

interface GalleryPostModalProps {
  isOpen: boolean;
  editingPost: GalleryPost | null;
  categories?: string[];
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onClose: () => void;
  onSave: (post: GalleryPost) => void;
}

function makeBlockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const GalleryPostModal: React.FC<GalleryPostModalProps> = ({
  isOpen,
  editingPost,
  categories,
  onUploadImage,
  onClose,
  onSave,
}) => {
  const resolvedCategories = useMemo(
    () => getGalleryCategories(categories),
    [categories]
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(() => resolvedCategories[0] || '아파트');
  const [region, setRegion] = useState('서울 강남구');
  const [date, setDate] = useState('');
  const [author, setAuthor] = useState('클리어웍스 마스터');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState(CLEARWORKS_IMAGES.aptAfter);
  const [blocks, setBlocks] = useState<GalleryBlock[]>([]);
  const [tagsText, setTagsText] = useState('유리창청소, 외창청소');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [coverOptimizationNote, setCoverOptimizationNote] = useState('');
  const [seoAutoSync, setSeoAutoSync] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');

  const parsedTags = useMemo(
    () =>
      tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsText]
  );

  const analyzedSeo = useMemo(
    () =>
      generateNaverPostSeo({
        title,
        category,
        region,
        excerpt,
        blocks,
        tags: parsedTags,
      }),
    [title, category, region, excerpt, blocks, parsedTags]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (editingPost) {
      setTitle(editingPost.title);
      const normCat = normalizeGalleryCategory(editingPost.category);
      setCategory(normCat || resolvedCategories[0] || '아파트');
      setRegion(editingPost.region);
      setDate(editingPost.date);
      setAuthor(editingPost.author);
      setExcerpt(editingPost.excerpt);
      setCoverImage(getPostCoverImage(editingPost) || CLEARWORKS_IMAGES.aptAfter);
      setBlocks(getPostBlocks(editingPost));
      setTagsText(editingPost.tags.join(', '));
      setCoverOptimizationNote('');

      const shouldAuto = editingPost.seo?.autoSync !== false;
      setSeoAutoSync(shouldAuto);
      if (!shouldAuto && editingPost.seo) {
        const fallback = generateNaverPostSeo(editingPost);
        setSeoTitle(editingPost.seo.title?.trim() || fallback.title);
        setSeoDescription(editingPost.seo.description?.trim() || fallback.description);
        setOgTitle(editingPost.seo.ogTitle?.trim() || fallback.ogTitle);
        setSeoKeywords(editingPost.seo.keywords?.trim() || fallback.keywords);
      } else {
        const generated = generateNaverPostSeo(editingPost);
        setSeoTitle(generated.title);
        setSeoDescription(generated.description);
        setOgTitle(generated.ogTitle);
        setSeoKeywords(generated.keywords);
      }
    } else {
      const today = new Date();
      const formatted = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(
        2,
        '0'
      )}.${String(today.getDate()).padStart(2, '0')}`;
      setTitle('');
      setCategory(resolvedCategories[0] || '아파트');
      setRegion('서울 강남구');
      setDate(formatted);
      setAuthor('클리어웍스 현장팀');
      setExcerpt('');
      setCoverImage(CLEARWORKS_IMAGES.aptAfter);
      const starterBlocks: GalleryBlock[] = [
        {
          id: makeBlockId('h'),
          type: 'heading',
          text: '1. 현장 방문 및 오염 상태 확인',
        },
        {
          id: makeBlockId('t'),
          type: 'text',
          text: '',
        },
      ];
      setBlocks(starterBlocks);
      setTagsText('유리창청소, 외창청소, 클리어웍스');
      setCoverOptimizationNote('');
      setSeoAutoSync(true);
    }
  }, [isOpen, editingPost]);

  useEffect(() => {
    if (!isOpen || !seoAutoSync) return;
    setSeoTitle(analyzedSeo.title);
    setSeoDescription(analyzedSeo.description);
    setOgTitle(analyzedSeo.ogTitle);
    setSeoKeywords(analyzedSeo.keywords);
  }, [isOpen, seoAutoSync, analyzedSeo]);

  const expectedImageName = useMemo(
    () =>
      buildWorkLogImageFilename({
        region,
        category,
        title,
      }).filename,
    [region, category, title]
  );

  const activeKeywords = useMemo(
    () => parseSeoKeywords(seoKeywords, MAX_SEO_KEYWORDS),
    [seoKeywords]
  );

  const availableKeywordSuggestions = useMemo(() => {
    const activeNorm = new Set(activeKeywords.map((k) => k.replace(/\s+/g, '').toLowerCase()));
    return analyzedSeo.suggestedKeywords.filter(
      (s) => !activeNorm.has(s.replace(/\s+/g, '').toLowerCase())
    );
  }, [analyzedSeo.suggestedKeywords, activeKeywords]);

  if (!isOpen) return null;

  const compressAndUpload = async (
    file: File
  ): Promise<{ url: string; filename: string; sizeInfo: string }> => {
    const optimized = await optimizeWorkLogImage(file, {
      region,
      category,
      title,
    });

    if (!optimized.dataUrl) {
      return { url: '', filename: optimized.filename, sizeInfo: '' };
    }

    const ratio =
      optimized.originalBytes > 0 && optimized.compressedBytes > 0
        ? Math.max(
            0,
            Math.round((1 - optimized.compressedBytes / optimized.originalBytes) * 100)
          )
        : 0;

    const sizeInfo =
      optimized.originalBytes > optimized.compressedBytes
        ? `${formatBytes(optimized.originalBytes)} → ${formatBytes(optimized.compressedBytes)} (${ratio}% 절감)`
        : `${formatBytes(optimized.compressedBytes)} (웹 최적화)`;

    if (onUploadImage) {
      const uploadedUrl = await onUploadImage(optimized.dataUrl, optimized.filename);
      let resolvedName = optimized.filename;
      if (uploadedUrl.startsWith('/uploads/')) {
        resolvedName = decodeURIComponent(uploadedUrl.replace('/uploads/', '').split('?')[0]);
      }
      return { url: uploadedUrl, filename: resolvedName, sizeInfo };
    }

    return { url: optimized.dataUrl, filename: optimized.filename, sizeInfo };
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await compressAndUpload(file);
      if (result.url) {
        setCoverImage(result.url);
        setCoverOptimizationNote(`${result.filename} · ${result.sizeInfo}`);
      }
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      const added: GalleryBlock[] = [];
      for (const file of files) {
        const result = await compressAndUpload(file);
        if (result.url) {
          added.push({
            id: makeBlockId('img'),
            type: 'image',
            url: result.url,
            caption: '',
            filename: result.filename,
            sizeInfo: result.sizeInfo,
          });
        }
      }
      if (added.length > 0) {
        setBlocks((prev) => [...prev, ...added]);
      }
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleReplaceBlockImage = async (
    blockId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const result = await compressAndUpload(file);
      if (result.url) {
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === blockId && b.type === 'image'
              ? {
                  ...b,
                  url: result.url,
                  filename: result.filename,
                  sizeInfo: result.sizeInfo,
                }
              : b
          )
        );
      }
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const addHeadingBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { id: makeBlockId('h'), type: 'heading', text: '' },
    ]);
  };

  const addTextBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { id: makeBlockId('t'), type: 'text', text: '' },
    ]);
  };

  const updateBlockText = (blockId: string, text: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId && (b.type === 'heading' || b.type === 'text')
          ? { ...b, text }
          : b
      )
    );
  };

  const updateBlockCaption = (blockId: string, caption: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId && b.type === 'image' ? { ...b, caption } : b
      )
    );
  };

  const moveBlock = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cleanedBlocks = blocks.filter((b) => {
      if (b.type === 'image') return Boolean(b.url?.trim());
      return Boolean(b.text?.trim());
    });

    const plainContent = blocksToPlainContent(cleanedBlocks);
    const firstImg = cleanedBlocks.find((b) => b.type === 'image');
    const resolvedCover =
      coverImage.trim() ||
      (firstImg && firstImg.type === 'image' ? firstImg.url : '') ||
      CLEARWORKS_IMAGES.aptAfter;

    const imageBlocks = cleanedBlocks.filter(
      (b): b is Extract<GalleryBlock, { type: 'image' }> => b.type === 'image'
    );

    const resolvedExcerpt =
      excerpt.trim() ||
      plainContent.replace(/\n+/g, ' ').slice(0, 110) ||
      `${region.trim() || '서울·수도권'} ${title.trim()}`;

    const finalAnalyzed = generateNaverPostSeo({
      title: title.trim(),
      category,
      region: region.trim() || '서울·수도권',
      excerpt: resolvedExcerpt,
      content: plainContent,
      blocks: cleanedBlocks,
      tags: parsedTags,
    });

    const post: GalleryPost = {
      id: editingPost ? editingPost.id : `post-${Date.now()}`,
      title: title.trim(),
      category,
      region: region.trim() || '서울·수도권',
      date: date.trim() || new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      author: author.trim() || '클리어웍스 현장팀',
      excerpt: resolvedExcerpt,
      coverImage: resolvedCover,
      beforeImage: imageBlocks[0]?.url || resolvedCover,
      afterImage: imageBlocks[imageBlocks.length - 1]?.url || resolvedCover,
      tags: parsedTags,
      equipmentUsed: editingPost?.equipmentUsed ?? [
        '전문가용 윈도우 스퀴지',
        '친환경 세정제',
      ],
      keyPoints: editingPost?.keyPoints ?? [
        '오염물 정밀 세척 및 무얼룩 마감',
        '보양 및 안전 시공',
      ],
      content: plainContent || resolvedExcerpt || title.trim(),
      blocks: cleanedBlocks,
      seo: {
        title: seoAutoSync ? finalAnalyzed.title : seoTitle.trim() || finalAnalyzed.title,
        description: seoAutoSync
          ? finalAnalyzed.description
          : seoDescription.trim() || finalAnalyzed.description,
        ogTitle: seoAutoSync ? finalAnalyzed.ogTitle : ogTitle.trim() || finalAnalyzed.ogTitle,
        keywords: seoAutoSync
          ? finalAnalyzed.keywords
          : formatSeoKeywords(activeKeywords, MAX_SEO_KEYWORDS) || finalAnalyzed.keywords,
        autoSync: seoAutoSync,
      },
    };

    onSave(post);
    onClose();
  };

  const handleRegenerateSeo = () => {
    setSeoAutoSync(true);
    setSeoTitle(analyzedSeo.title);
    setSeoDescription(analyzedSeo.description);
    setOgTitle(analyzedSeo.ogTitle);
    setSeoKeywords(analyzedSeo.keywords);
    setKeywordDraft('');
  };

  const handleAddKeywords = (rawInput?: string) => {
    const source = rawInput ?? keywordDraft;
    const incoming = parseSeoKeywords(source, MAX_SEO_KEYWORDS);
    if (incoming.length === 0) return;
    const merged = formatSeoKeywords([...activeKeywords, ...incoming], MAX_SEO_KEYWORDS);
    setSeoAutoSync(false);
    setSeoKeywords(merged);
    if (rawInput === undefined) setKeywordDraft('');
  };

  const handleRemoveKeyword = (targetKw: string) => {
    const next = activeKeywords.filter((k) => k !== targetKw);
    setSeoAutoSync(false);
    setSeoKeywords(next.join(', '));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddKeywords();
    }
  };

  const titleLen = seoTitle.trim().length;
  const descLen = seoDescription.trim().length;
  const ogTitleLen = ogTitle.trim().length;
  const previewPostId = editingPost?.id || 'new-post';

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {editingPost ? '현장 작업일지 수정 (블로그형)' : '새 현장 작업일지 작성 (블로그형)'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              소제목, 글, 사진을 원하는 순서대로 섞어서 블로그처럼 작성하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              제목 * <span className="font-normal text-slate-400">(지역명 + 건물 + 작업명 권장)</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 서울 강남구 역삼동 상가 어닝청소 · 통유리 고압 세척 작업일지"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {(resolvedCategories.includes(category) || !category
                  ? resolvedCategories
                  : [category, ...resolvedCategories]
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">지역</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 서울 강남구"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">작성일</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">작성자</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Cover Thumbnail + Excerpt */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">대표 썸네일 사진</span>
                <label className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>변경</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <img
                src={resolveAssetUrl(coverImage)}
                alt="대표 썸네일"
                className="w-full h-24 object-cover rounded-xl bg-slate-200"
              />
              {coverOptimizationNote && (
                <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 truncate">
                  {coverOptimizationNote}
                </p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                요약 문구 <span className="font-normal text-slate-400">(목록 카드 · 네이버/구글 검색 설명)</span>
              </label>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="비워두면 본문 앞부분으로 자동 생성됩니다. 검색 결과에 보여질 핵심 요약을 1~2줄로 적어주세요."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Blog Content Blocks */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="text-xs font-extrabold text-slate-900">
                  블로그 본문 구성 (글 · 소제목 · 사진)
                </label>
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                  사진 업로드 시 자동 웹 최적화 압축(최대 1280px · 220KB 이하) 및{' '}
                  <span className="font-bold">{expectedImageName}</span> 형식으로 자동 변환됩니다.
                </p>
              </div>
              <span className="text-[11px] text-slate-400">
                총 {blocks.length}개 블록
              </span>
            </div>

            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                        block.type === 'heading'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : block.type === 'image'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {block.type === 'heading'
                        ? '소제목'
                        : block.type === 'image'
                          ? '사진'
                          : '본문 글'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, 1)}
                        disabled={index === blocks.length - 1}
                        className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                        title="블록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {block.type === 'heading' && (
                    <input
                      type="text"
                      value={block.text}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      placeholder="소제목을 입력하세요 (예: 1. 시공 전 어닝 오염 상태)"
                      className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {block.type === 'text' && (
                    <textarea
                      rows={4}
                      value={block.text}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                      placeholder="현장 상황, 작업 공법, 주의사항 등을 블로그 포스팅처럼 작성하세요."
                      className="w-full px-3 py-2 text-xs sm:text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  {block.type === 'image' && (
                    <div className="space-y-2">
                      <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                        <img
                          src={resolveAssetUrl(block.url)}
                          alt={block.caption || '현장 사진'}
                          className="w-full max-h-56 object-cover"
                        />
                        <label className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-md">
                          <Upload className="w-3 h-3" />
                          <span>사진 교체</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleReplaceBlockImage(block.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {(block.filename || block.sizeInfo) && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
                          <span className="truncate">파일명: {block.filename}</span>
                          {block.sizeInfo && <span className="shrink-0">{block.sizeInfo}</span>}
                        </div>
                      )}
                      <input
                        type="text"
                        value={block.caption ?? ''}
                        onChange={(e) => updateBlockCaption(block.id, e.target.value)}
                        placeholder="사진 아래 설명 / 검색엔진 이미지 Alt 문구 (선택)"
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Block Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
              <span className="text-[11px] font-bold text-slate-500 mr-1">블록 추가:</span>
              <button
                type="button"
                onClick={addHeadingBlock}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Heading2 className="w-3.5 h-3.5" />
                <span>+ 소제목</span>
              </button>
              <button
                type="button"
                onClick={addTextBlock}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>+ 본문 글</span>
              </button>
              <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                <ImagePlus className="w-3.5 h-3.5" />
                <span>{uploadingImage ? '업로드 중...' : '+ 사진 추가 (여러 장 가능)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingImage}
                  onChange={handleAddImageFiles}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              검색 태그 <span className="font-normal text-slate-400">(쉼표로 구분)</span>
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="예: 강남구어닝청소, 역삼동간판청소, 상가유리창청소"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Naver SEO Meta Tag Auto-Generator */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>네이버 검색 최적화 (SEO 메타 태그 자동 생성)</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        seoAutoSync
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {seoAutoSync ? '제목·본문 자동분석 ON' : '수동 편집 모드'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    제목·지역·본문을 분석해 네이버 검색 노출에 유리한 title, description, og:title을 자동 생성합니다.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRegenerateSeo}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3 h-3" />
                <span>제목·본문 분석해서 다시 생성</span>
              </button>
            </div>

            {/* Editable Related Search Keywords (8~10 recommended, max 10) */}
            <div className="rounded-xl bg-white border border-emerald-200/90 p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>연관 검색어 · SEO 메타 키워드 (메타데이터 전용)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    제목·본문을 분석해 스팸 방지 적정 개수(8~10개)로 자동 추천됩니다. 필요 시 직접 추가·삭제하세요.
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeKeywords.length >= MAX_SEO_KEYWORDS
                      ? 'bg-amber-100 text-amber-800'
                      : activeKeywords.length >= 5
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {activeKeywords.length} / {MAX_SEO_KEYWORDS}개 {activeKeywords.length >= MAX_SEO_KEYWORDS ? '(최대)' : '적정'}
                </span>
              </div>

              {/* Active Keyword Chips */}
              <div className="flex flex-wrap gap-1.5">
                {activeKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="p-0.5 rounded-full hover:bg-emerald-200/80 text-emerald-700 cursor-pointer"
                      aria-label={`${kw} 키워드 삭제`}
                      title="삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {activeKeywords.length === 0 && (
                  <span className="text-[11px] text-slate-400">
                    입력된 키워드가 없습니다. 아래에서 직접 입력하거나 추천 키워드를 추가하세요.
                  </span>
                )}
              </div>

              {/* Add Custom Keyword Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={keywordDraft}
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  disabled={activeKeywords.length >= MAX_SEO_KEYWORDS}
                  placeholder={
                    activeKeywords.length >= MAX_SEO_KEYWORDS
                      ? '스팸 방지를 위해 최대 10개까지 입력 가능합니다 (기존 항목 삭제 후 추가 가능)'
                      : '연관 검색어 입력 후 Enter 또는 추가 (쉼표로 여러 개 입력 가능)'
                  }
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => handleAddKeywords()}
                  disabled={activeKeywords.length >= MAX_SEO_KEYWORDS || !keywordDraft.trim()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              </div>

              {/* Quick Suggestions */}
              {activeKeywords.length < MAX_SEO_KEYWORDS &&
                availableKeywordSuggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 mr-0.5">
                      추천 키워드 추가:
                    </span>
                    {availableKeywordSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleAddKeywords(sug)}
                        className="px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[10px] font-semibold text-slate-600 hover:text-emerald-800 cursor-pointer transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    검색 제목 태그 (&lt;title&gt;)
                  </label>
                  <span
                    className={`text-[10px] font-bold ${
                      titleLen > 60
                        ? 'text-amber-600'
                        : titleLen >= 20
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {titleLen} / 60자 권장
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoAutoSync(false);
                    setSeoTitle(e.target.value);
                  }}
                  placeholder="제목과 본문 작성 시 자동 생성됩니다"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    검색 설명문 (meta description)
                  </label>
                  <span
                    className={`text-[10px] font-bold ${
                      descLen > 160
                        ? 'text-amber-600'
                        : descLen >= 70
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {descLen} / 155자 권장
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoAutoSync(false);
                    setSeoDescription(e.target.value);
                  }}
                  placeholder="본문 핵심 문장과 지역·작업명을 바탕으로 자동 요약됩니다"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    공유 카드 제목 (og:title — 카카오톡·네이버 블로그 공유용)
                  </label>
                  <span
                    className={`text-[10px] font-bold ${
                      ogTitleLen > 48
                        ? 'text-amber-600'
                        : ogTitleLen >= 14
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                    }`}
                  >
                    {ogTitleLen} / 46자 권장
                  </span>
                </div>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => {
                    setSeoAutoSync(false);
                    setOgTitle(e.target.value);
                  }}
                  placeholder="[지역] 핵심 작업 제목 형태로 자동 생성됩니다"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Live Naver SERP Preview */}
            <div className="rounded-xl bg-white border border-slate-200 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  네이버 검색결과 미리보기
                </span>
                <span className="flex items-center gap-1 normal-case text-slate-400">
                  <Globe className="w-3 h-3" />
                  og:title: {ogTitle || '자동 생성 대기'}
                </span>
              </div>
              <div className="text-[11px] text-emerald-700 truncate">
                https://clearworks.kr/gallery/{previewPostId}
              </div>
              <div className="text-sm font-bold text-blue-700 leading-snug line-clamp-1">
                {seoTitle || '제목을 입력하면 네이버 검색 제목이 자동 생성됩니다 | 클리어웍스'}
              </div>
              <div className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {seoDescription ||
                  '본문 내용을 입력하시면 네이버 검색 결과에 노출될 요약 설명문이 자동으로 작성됩니다.'}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={uploadingImage}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

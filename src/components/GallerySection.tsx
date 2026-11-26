import React from 'react';
import { ArrowRight, Calendar, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react';
import { SmoothImage } from '@/src/components/SmoothImage';
import { EditableText } from '@/src/components/admin/EditableText';
import type { ImageEditTarget } from '@/src/components/admin/ImageEditorModal';
import type { GalleryPost } from '@/src/types/clearworks';
import { resolveAssetUrl } from '@/src/utils/assetUrl';
import { getRoutePath } from '@/src/utils/seo';

interface GallerySectionProps {
  sectionTitle: string;
  sectionSubtitle: string;
  posts: GalleryPost[];
  isEditMode: boolean;
  onUpdateTitle: (val: string) => void;
  onUpdateSubtitle: (val: string) => void;
  onUpdatePostField: (
    postId: string,
    field: 'title' | 'excerpt' | 'coverImage',
    val: string
  ) => void;
  onEditImage: (target: ImageEditTarget) => void;
  onViewGalleryList: () => void;
  onSelectPost: (postId: string) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({
  sectionTitle,
  sectionSubtitle,
  posts,
  isEditMode,
  onUpdateTitle,
  onUpdateSubtitle,
  onUpdatePostField,
  onEditImage,
  onViewGalleryList,
  onSelectPost,
}) => {
  const visiblePosts = posts.slice(0, 6);

  return (
    <section
      id="gallery"
      className="py-11 md:py-16 bg-white relative border-b border-slate-300/75"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 sm:mb-9 gap-5">
          <div className="max-w-2xl">
            <span className="text-xs sm:text-[13px] font-bold text-blue-600 tracking-wider uppercase mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Real Field Stories &amp; Work Logs</span>
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              <EditableText
                value={sectionTitle}
                onSave={onUpdateTitle}
                isEditMode={isEditMode}
                label="작업갤러리 제목 수정"
              />
            </h2>
            <p className="text-[15px] sm:text-base md:text-[17px] text-slate-600 leading-relaxed">
              <EditableText
                value={sectionSubtitle}
                onSave={onUpdateSubtitle}
                isEditMode={isEditMode}
                label="작업갤러리 부제목 수정"
              />
            </p>
          </div>

          <a
            href="/gallery"
            onClick={(e) => {
              e.preventDefault();
              onViewGalleryList();
            }}
            className="self-start md:self-auto px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-blue-600 font-extrabold text-[13px] sm:text-sm border border-slate-200 shadow-2xs flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap"
          >
            <span>전체 작업일지 보러가기</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
          {visiblePosts.map((post) => (
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
              className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div>
                <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-slate-100 overflow-hidden">
                  <SmoothImage
                    src={resolveAssetUrl(post.coverImage || post.afterImage)}
                    alt={post.title}
                    loading="lazy"
                    wrapperClassName="w-full h-full overflow-hidden"
                    skeletonTone="light"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1 sm:gap-1.5 z-10 pr-2">
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-600 text-white text-[10.5px] sm:text-xs font-extrabold shadow-md">
                      {post.category}
                    </span>
                    <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10.5px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1">
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 shrink-0" />
                      <span className="truncate max-w-[84px] sm:max-w-none">{post.region}</span>
                    </span>
                  </div>

                  {isEditMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditImage({
                          title: `[${post.title}] 대표 이미지 변경`,
                          currentUrl: post.coverImage || post.afterImage,
                          optimizationTarget: {
                            region: post.region,
                            category: post.category,
                            title: post.title,
                          },
                          onSave: (url) => onUpdatePostField(post.id, 'coverImage', url),
                        });
                      }}
                      className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-950/85 hover:bg-blue-600 text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-lg cursor-pointer"
                    >
                      <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>사진 변경</span>
                    </button>
                  )}
                </div>

                <div className="p-3 sm:p-6">
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-[13px] text-slate-500 mb-1.5 sm:mb-2 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-[14px] sm:text-[17px] font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mb-1.5 sm:mb-2">
                    <EditableText
                      value={post.title}
                      onSave={(v) => onUpdatePostField(post.id, 'title', v)}
                      isEditMode={isEditMode}
                      label="게시글 제목 수정"
                    />
                  </h3>
                  <p className="text-[12.5px] sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                    <EditableText
                      value={post.excerpt}
                      onSave={(v) => onUpdatePostField(post.id, 'excerpt', v)}
                      isEditMode={isEditMode}
                      label="게시글 요약 수정"
                      multiline
                    />
                  </p>
                </div>
              </div>

              <a
                href={getRoutePath({ type: 'gallery_detail', postId: post.id })}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectPost(post.id);
                }}
                className="px-3 py-2.5 sm:px-6 sm:py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs sm:text-[13px] font-bold text-blue-600 group-hover:bg-blue-50/50 transition-colors"
              >
                <span>자세히 보기</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { FolderOpen, Image as ImageIcon, Loader2, RotateCcw, Upload, X } from 'lucide-react';
import {
  DEFAULT_IMAGE_FRAME_TRANSFORM,
  InteractiveImageFrameEditor,
  renderFramedImageToDataUrl,
  type ImageFrameTransform,
} from '@/src/components/admin/InteractiveImageFrameEditor';
import {
  buildSeoImageFilename,
  ENHANCEMENT_MODE_OPTIONS,
  formatBytes,
  GALLERY_IMAGE_GUIDELINES,
  optimizeWorkLogImage,
  WATERMARK_TRIM_OPTIONS,
  type ImageEnhancementMode,
  type SeoImageFilenameInput,
  type WatermarkTrimPreset,
  type WorkLogImageNameInput,
} from '@/src/utils/imageOptimizer';

export interface ImageEditTarget {
  title: string;
  currentUrl: string;
  defaultUrl?: string;
  aspectRatio?: number;
  aspectLabel?: string;
  seoFileName?: SeoImageFilenameInput | string;
  optimizationTarget?: WorkLogImageNameInput;
  onSave: (newUrl: string) => void;
}

interface ImageEditorModalProps {
  target: ImageEditTarget | null;
  onUploadImage?: (dataUrl: string, nameHint?: string) => Promise<string>;
  onClose: () => void;
}

interface UploadedFileItem {
  filename: string;
  url: string;
  mtimeMs: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function isTransformAdjusted(t: ImageFrameTransform): boolean {
  return t.zoom > 1.001 || Math.abs(t.panX) > 0.001 || Math.abs(t.panY) > 0.001;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  target,
  onUploadImage,
  onClose,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [localPreviewSrc, setLocalPreviewSrc] = useState<string | null>(null);
  const [localNameHint, setLocalNameHint] = useState<string>('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadNote, setUploadNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [watermarkTrim, setWatermarkTrim] = useState<WatermarkTrimPreset>('none');
  const [enhancementMode, setEnhancementMode] = useState<ImageEnhancementMode>('natural');
  const [showGuideline, setShowGuideline] = useState(false);
  const [transform, setTransform] = useState<ImageFrameTransform>(DEFAULT_IMAGE_FRAME_TRANSFORM);
  const [recentUploads, setRecentUploads] = useState<UploadedFileItem[]>([]);
  const [showRecentUploads, setShowRecentUploads] = useState(false);

  const aspectRatio = target?.aspectRatio ?? 16 / 10;
  const aspectLabel = target?.aspectLabel ?? '16:10';

  useEffect(() => {
    if (!target) return;
    setUrlInput(target.currentUrl);
    setLocalPreviewSrc(null);
    setLocalNameHint('');
    setError('');
    setUploadNote('');
    setSelectedFile(null);
    setWatermarkTrim('none');
    setEnhancementMode('natural');
    setShowGuideline(false);
    setShowRecentUploads(false);
    setTransform({
      ...DEFAULT_IMAGE_FRAME_TRANSFORM,
      mode: target.optimizationTarget ? 'original' : 'crop',
    });

    let active = true;
    fetch('/api/admin/uploads', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { ok?: boolean; files?: UploadedFileItem[] } | null) => {
        if (active && data?.ok && Array.isArray(data.files)) {
          setRecentUploads(data.files);
        }
      })
      .catch(() => {
        // Static host or unavailable — ignore silently
      });

    return () => {
      active = false;
    };
  }, [target]);

  const processWorkLogFile = useCallback(
    async (
      file: File,
      optTarget: WorkLogImageNameInput,
      trim: WatermarkTrimPreset,
      enhance: ImageEnhancementMode
    ) => {
      setProcessing(true);
      setError('');
      try {
        const optimized = await optimizeWorkLogImage(file, optTarget, 240 * 1024, {
          watermarkTrim: trim,
          enhancementMode: enhance,
        });
        const ratio =
          optimized.originalBytes > 0 && optimized.compressedBytes > 0
            ? Math.max(
                0,
                Math.round((1 - optimized.compressedBytes / optimized.originalBytes) * 100)
              )
            : 0;
        const notesText = optimized.appliedNotes?.length
          ? `${optimized.appliedNotes.join(' · ')} · `
          : '';
        setLocalPreviewSrc(optimized.dataUrl);
        setLocalNameHint(optimized.filename);
        setUploadNote(
          `${optimized.filename} · ${notesText}${formatBytes(optimized.originalBytes)} → ${formatBytes(optimized.compressedBytes)} (${ratio}% 절감)`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '이미지 처리 중 오류가 발생했습니다.');
      } finally {
        setProcessing(false);
      }
    },
    []
  );

  if (!target) return null;

  const activePreviewSrc = localPreviewSrc || urlInput.trim();

  const resolvedSeoFilename = (() => {
    if (typeof target.seoFileName === 'string' && target.seoFileName.trim()) {
      return target.seoFileName.trim();
    }
    if (target.seoFileName && typeof target.seoFileName === 'object') {
      return buildSeoImageFilename(target.seoFileName).filename;
    }
    if (target.optimizationTarget) {
      return buildSeoImageFilename({
        section: 'gallery',
        region: target.optimizationTarget.region,
        category: target.optimizationTarget.category,
        title: target.optimizationTarget.title,
      }).filename;
    }
    return buildSeoImageFilename({
      section: 'general',
      title: target.title.replace(/\[|\]|사진 변경|대표 이미지 변경|배경 사진 변경|변경/g, ' ').trim(),
    }).filename;
  })();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (target.optimizationTarget) {
      setSelectedFile(file);
      await processWorkLogFile(file, target.optimizationTarget, watermarkTrim, enhancementMode);
      return;
    }

    setProcessing(true);
    setError('');
    setUploadNote('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSelectedFile(file);
      setLocalPreviewSrc(dataUrl);
      setLocalNameHint(resolvedSeoFilename);
      setTransform({ zoom: 1, panX: 0, panY: 0, mode: 'crop' });
      setUploadNote(
        `자동 SEO 파일명: ${resolvedSeoFilename} — 위 화면에서 드래그·확대해 위치를 맞춘 뒤 적용하세요.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSelectRecentUpload = (item: UploadedFileItem) => {
    setSelectedFile(null);
    setLocalPreviewSrc(null);
    setLocalNameHint(resolvedSeoFilename);
    setUrlInput(item.url);
    setTransform({ zoom: 1, panX: 0, panY: 0, mode: 'crop' });
    setUploadNote(
      `자동 SEO 파일명: ${resolvedSeoFilename} — 드래그·확대해 위치를 맞춘 뒤 적용하세요.`
    );
    setError('');
  };

  const handleTrimChange = async (nextTrim: WatermarkTrimPreset) => {
    setWatermarkTrim(nextTrim);
    if (selectedFile && target.optimizationTarget) {
      await processWorkLogFile(selectedFile, target.optimizationTarget, nextTrim, enhancementMode);
    }
  };

  const handleEnhanceChange = async (nextEnhance: ImageEnhancementMode) => {
    setEnhancementMode(nextEnhance);
    if (selectedFile && target.optimizationTarget) {
      await processWorkLogFile(selectedFile, target.optimizationTarget, watermarkTrim, nextEnhance);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePreviewSrc) {
      setError('이미지 파일을 업로드하거나 URL을 입력해 주세요.');
      return;
    }

    const adjusted = transform.mode === 'crop' && isTransformAdjusted(transform);
    const hasNewLocalFile = Boolean(localPreviewSrc);
    const shouldRenderCanvas =
      hasNewLocalFile ||
      adjusted ||
      (transform.mode === 'crop' && urlInput.trim() !== target.currentUrl && urlInput.trim().startsWith('/'));

    if (!shouldRenderCanvas) {
      target.onSave(urlInput.trim());
      onClose();
      return;
    }

    setSaving(true);
    setError('');
    try {
      let dataUrlToUpload: string;
      if (hasNewLocalFile && target.optimizationTarget && transform.mode === 'original') {
        dataUrlToUpload = localPreviewSrc!;
      } else {
        dataUrlToUpload = await renderFramedImageToDataUrl(
          activePreviewSrc,
          aspectRatio,
          transform,
          1440
        );
      }

      const hint = localNameHint || resolvedSeoFilename;

      const savedUrl = onUploadImage
        ? await onUploadImage(dataUrlToUpload, hint)
        : dataUrlToUpload;

      target.onSave(savedUrl);
      onClose();
    } catch (err) {
      // Fallback when remote external image blocks CORS canvas export
      if (!hasNewLocalFile && /^https?:\/\//i.test(urlInput.trim())) {
        target.onSave(urlInput.trim());
        onClose();
        return;
      }
      setError(
        err instanceof Error ? err.message : '이미지 저장 중 오류가 발생했습니다.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 truncate">{target.title}</h3>
              <p className="text-xs text-slate-500">
                사진을 올린 뒤 드래그로 위치 이동, 휠·슬라이더로 확대/축소할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Interactive Pan & Zoom Frame Editor */}
          <InteractiveImageFrameEditor
            src={activePreviewSrc}
            aspectRatio={aspectRatio}
            aspectLabel={aspectLabel}
            transform={transform}
            onChange={setTransform}
            allowOriginalMode={true}
          />

          {target.optimizationTarget && (
            <div className="rounded-2xl border border-blue-200/90 bg-blue-50/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-slate-900">
                  작업갤러리 이미지 최적화 옵션
                </span>
                <button
                  type="button"
                  onClick={() => setShowGuideline((prev) => !prev)}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  {showGuideline ? '가이드라인 닫기 ▲' : '가이드라인 보기 ▼'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    하단 워터마크 제거
                  </label>
                  <select
                    value={watermarkTrim}
                    onChange={(e) => void handleTrimChange(e.target.value as WatermarkTrimPreset)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    {WATERMARK_TRIM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    현장 사진 보정 모드
                  </label>
                  <select
                    value={enhancementMode}
                    onChange={(e) => void handleEnhanceChange(e.target.value as ImageEnhancementMode)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    {ENHANCEMENT_MODE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {showGuideline && (
                <ul className="space-y-1 pt-2 border-t border-blue-200/70">
                  {GALLERY_IMAGE_GUIDELINES.map((g) => (
                    <li key={g.id} className="text-[10px] text-slate-600 leading-snug">
                      <strong className="text-blue-800">{g.title}:</strong> {g.summary}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* File Upload + Recent Uploads */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs cursor-pointer transition-colors">
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{processing ? '이미지 불러오는 중...' : '내 기기에서 사진 파일 선택'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {recentUploads.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRecentUploads((prev) => !prev)}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                    showRecentUploads
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>최근 업로드 ({recentUploads.length})</span>
                </button>
              )}
            </div>

            {showRecentUploads && recentUploads.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-2">
                <p className="text-[11px] font-bold text-slate-600">
                  최근 올린 사진을 클릭해 바로 위치·확대를 조정할 수 있습니다.
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {recentUploads.map((item) => {
                    const isSelected = !localPreviewSrc && urlInput === item.url;
                    return (
                      <button
                        key={item.filename}
                        type="button"
                        onClick={() => handleSelectRecentUpload(item)}
                        title={item.filename}
                        className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/30'
                            : 'border-white hover:border-blue-400'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.filename}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {uploadNote && (
              <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                {uploadNote}
              </p>
            )}
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              또는 이미지 주소(URL) 직접 입력
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setLocalPreviewSrc(null);
                setSelectedFile(null);
                setTransform({ ...transform, zoom: 1, panX: 0, panY: 0 });
              }}
              placeholder="https://..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            {target.defaultUrl ? (
              <button
                type="button"
                onClick={() => {
                  setLocalPreviewSrc(null);
                  setSelectedFile(null);
                  setUrlInput(target.defaultUrl!);
                  setUploadNote('');
                  setTransform({ zoom: 1, panX: 0, panY: 0, mode: 'crop' });
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>기본 이미지 복원</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving || processing}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{saving ? '적용 중...' : '이미지 적용하기'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

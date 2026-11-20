import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import { resolveAssetUrl } from '@/src/utils/assetUrl';

interface BeforeAfterComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeCaption?: string;
  afterCaption?: string;
  beforeAlt?: string;
  afterAlt?: string;
  isEditMode?: boolean;
  onEditBefore?: () => void;
  onEditAfter?: () => void;
  onSaveBeforeCaption?: (val: string) => void;
  onSaveAfterCaption?: (val: string) => void;
}

const DEFAULT_BEFORE_CAPTION = '오염 및 물때로 시야가 차단된 상태';
const DEFAULT_AFTER_CAPTION = '스퀴지 공법으로 완벽히 투명해진 조망';

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  beforeImage,
  afterImage,
  beforeCaption,
  afterCaption,
  beforeAlt = '시공 전 물때와 오염이 있는 상태',
  afterAlt = '시공 후 깨끗하고 투명해진 상태',
  isEditMode = false,
  onEditBefore,
  onEditAfter,
  onSaveBeforeCaption,
  onSaveAfterCaption,
}) => {
  const [beforeError, setBeforeError] = useState(false);
  const [afterError, setAfterError] = useState(false);

  const resolvedBefore = resolveAssetUrl(beforeImage);
  const resolvedAfter = resolveAssetUrl(afterImage);

  useEffect(() => {
    setBeforeError(false);
  }, [beforeImage]);

  useEffect(() => {
    setAfterError(false);
  }, [afterImage]);

  const resolvedBeforeCaption = beforeCaption?.trim() || DEFAULT_BEFORE_CAPTION;
  const resolvedAfterCaption = afterCaption?.trim() || DEFAULT_AFTER_CAPTION;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
      {/* Before Card */}
      <div className="rounded-2xl overflow-hidden border border-slate-200/90 bg-white flex flex-col shadow-2xs">
        <div
          onClick={isEditMode && onEditBefore ? onEditBefore : undefined}
          role={isEditMode && onEditBefore ? 'button' : undefined}
          tabIndex={isEditMode && onEditBefore ? 0 : undefined}
          onKeyDown={
            isEditMode && onEditBefore
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEditBefore();
                  }
                }
              : undefined
          }
          className={`relative aspect-[16/10] bg-slate-200 overflow-hidden ${
            isEditMode && onEditBefore ? 'cursor-pointer group' : ''
          }`}
        >
          {resolvedBefore && !beforeError ? (
            <img
              src={resolvedBefore}
              alt={beforeAlt}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setBeforeError(true)}
              className={`w-full h-full object-cover ${
                isEditMode && onEditBefore
                  ? 'group-hover:scale-[1.02] transition-transform duration-300'
                  : ''
              }`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex flex-col items-center justify-center text-slate-200 p-4">
              <ImageIcon className="w-8 h-8 mb-2 text-slate-400" />
              <span className="text-sm font-bold">BEFORE</span>
            </div>
          )}

          <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-slate-900/85 text-white text-xs font-bold backdrop-blur-xs shadow-md pointer-events-none tracking-wide">
            BEFORE
          </div>

          {isEditMode && onEditBefore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditBefore();
              }}
              className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-blue-600 text-white text-xs font-bold shadow-lg cursor-pointer transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
              <span>청소 전 사진 변경</span>
            </button>
          )}
        </div>

        <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-medium text-slate-700 flex-1 min-w-0">
            {onSaveBeforeCaption ? (
              <EditableText
                value={resolvedBeforeCaption}
                onSave={onSaveBeforeCaption}
                isEditMode={isEditMode}
                label="시공 전 사진 설명 수정"
              />
            ) : (
              <span>{resolvedBeforeCaption}</span>
            )}
          </div>
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap shrink-0">
            시공 전
          </span>
        </div>
      </div>

      {/* After Card */}
      <div className="rounded-2xl overflow-hidden border border-blue-200/90 bg-white flex flex-col shadow-2xs">
        <div
          onClick={isEditMode && onEditAfter ? onEditAfter : undefined}
          role={isEditMode && onEditAfter ? 'button' : undefined}
          tabIndex={isEditMode && onEditAfter ? 0 : undefined}
          onKeyDown={
            isEditMode && onEditAfter
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEditAfter();
                  }
                }
              : undefined
          }
          className={`relative aspect-[16/10] bg-slate-100 overflow-hidden ${
            isEditMode && onEditAfter ? 'cursor-pointer group' : ''
          }`}
        >
          {resolvedAfter && !afterError ? (
            <img
              src={resolvedAfter}
              alt={afterAlt}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setAfterError(true)}
              className={`w-full h-full object-cover ${
                isEditMode && onEditAfter
                  ? 'group-hover:scale-[1.02] transition-transform duration-300'
                  : ''
              }`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-50 to-blue-100 flex flex-col items-center justify-center text-blue-700 p-4">
              <Sparkles className="w-8 h-8 mb-2" />
              <span className="text-sm font-bold">AFTER</span>
            </div>
          )}

          <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/95 text-white text-xs font-bold backdrop-blur-xs shadow-md pointer-events-none tracking-wide">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>AFTER</span>
          </div>

          {isEditMode && onEditAfter && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditAfter();
              }}
              className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/95 hover:bg-blue-700 text-white text-xs font-bold shadow-lg cursor-pointer transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>청소 후 사진 변경</span>
            </button>
          )}
        </div>

        <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs sm:text-sm font-semibold text-blue-600 flex-1 min-w-0">
            {onSaveAfterCaption ? (
              <EditableText
                value={resolvedAfterCaption}
                onSave={onSaveAfterCaption}
                isEditMode={isEditMode}
                label="시공 후 사진 설명 수정"
              />
            ) : (
              <span>{resolvedAfterCaption}</span>
            )}
          </div>
          <span className="text-xs font-bold text-blue-600 whitespace-nowrap shrink-0">
            시공 후
          </span>
        </div>
      </div>
    </div>
  );
};

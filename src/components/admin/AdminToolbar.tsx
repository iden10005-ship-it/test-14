import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Eye,
  Globe,
  Home,
  Inbox,
  Loader2,
  LogOut,
  Pencil,
  Save,
  Settings,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { PageRoute, ServiceItem } from '@/src/types/clearworks';
import { normalizeBaseUrl } from '@/src/utils/sitemap';

export type CodeSyncStatus = 'checking' | 'saved' | 'saving' | 'unsynced' | 'readonly' | 'error';

interface AdminToolbarProps {
  isEditMode: boolean;
  inquiryCount: number;
  codeSyncStatus: CodeSyncStatus;
  currentRoute: PageRoute;
  siteUrl?: string;
  regions: string[];
  services: ServiceItem[];
  onNavigate: (route: PageRoute) => void;
  onSaveNow: () => void;
  onToggleEditMode: () => void;
  onOpenSettings: () => void;
  onOpenInquiries: () => void;
  onExitAdmin: () => void;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  isEditMode,
  inquiryCount,
  codeSyncStatus,
  currentRoute,
  siteUrl,
  regions,
  services,
  onNavigate,
  onSaveNow,
  onToggleEditMode,
  onOpenSettings,
  onOpenInquiries,
  onExitAdmin,
}) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedLiveUrl, setCopiedLiveUrl] = useState(false);

  const selectedRegion =
    currentRoute.type === 'region' || currentRoute.type === 'matrix'
      ? currentRoute.regionName
      : '';
  const selectedServiceId =
    currentRoute.type === 'service' || currentRoute.type === 'matrix'
      ? currentRoute.serviceId
      : '';

  const currentPathLabel = (() => {
    switch (currentRoute.type) {
      case 'home':
        return '/';
      case 'gallery_list':
        return '/gallery';
      case 'gallery_detail':
        return `/gallery/${currentRoute.postId}`;
      case 'region':
        return `/region/${currentRoute.regionName}`;
      case 'service':
        return `/service/${currentRoute.serviceId}`;
      case 'matrix':
        return `/region/${currentRoute.regionName}/service/${currentRoute.serviceId}`;
    }
  })();

  const encodedRoutePath = (() => {
    switch (currentRoute.type) {
      case 'home':
        return '/';
      case 'gallery_list':
        return '/gallery';
      case 'gallery_detail':
        return `/gallery/${encodeURIComponent(currentRoute.postId)}`;
      case 'region':
        return `/region/${encodeURIComponent(currentRoute.regionName)}`;
      case 'service':
        return `/service/${encodeURIComponent(currentRoute.serviceId)}`;
      case 'matrix':
        return `/region/${encodeURIComponent(currentRoute.regionName)}/service/${encodeURIComponent(currentRoute.serviceId)}`;
    }
  })();

  const liveBaseUrl = normalizeBaseUrl(siteUrl);
  const liveDirectUrl = `${liveBaseUrl}${encodedRoutePath}`;
  const liveDisplayLabel = `${liveBaseUrl.replace(/^https?:\/\//i, '')}${currentPathLabel}`;

  const handleRegionChange = (nextRegion: string) => {
    if (nextRegion && selectedServiceId) {
      onNavigate({ type: 'matrix', regionName: nextRegion, serviceId: selectedServiceId });
    } else if (nextRegion) {
      onNavigate({ type: 'region', regionName: nextRegion });
    } else if (selectedServiceId) {
      onNavigate({ type: 'service', serviceId: selectedServiceId });
    } else {
      onNavigate({ type: 'home' });
    }
  };

  const handleServiceChange = (nextServiceId: string) => {
    if (selectedRegion && nextServiceId) {
      onNavigate({ type: 'matrix', regionName: selectedRegion, serviceId: nextServiceId });
    } else if (nextServiceId) {
      onNavigate({ type: 'service', serviceId: nextServiceId });
    } else if (selectedRegion) {
      onNavigate({ type: 'region', regionName: selectedRegion });
    } else {
      onNavigate({ type: 'home' });
    }
  };

  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall back to execCommand below
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyCurrentUrl = async () => {
    if (typeof window === 'undefined') return;
    if (await copyTextToClipboard(window.location.href)) {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 1500);
    }
  };

  const handleCopyLiveUrl = async () => {
    if (await copyTextToClipboard(liveDirectUrl)) {
      setCopiedLiveUrl(true);
      setTimeout(() => setCopiedLiveUrl(false), 1800);
    }
  };

  const isGalleryRoute =
    currentRoute.type === 'gallery_list' || currentRoute.type === 'gallery_detail';

  return (
    <div className="bg-slate-950 text-white border-b border-slate-800 z-[60]">
      {/* Row 1: Primary Admin Actions */}
      <div className="px-3 sm:px-6 py-2.5 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-400">
              <Shield className="w-4 h-4 shrink-0" />
              <span>관리자 모드</span>
            </div>

            {codeSyncStatus === 'saving' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[11px] font-bold">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>프리뷰 저장 중...</span>
              </span>
            )}
            {codeSyncStatus === 'saved' && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-bold"
                title="현재 프리뷰 서버에 저장되었습니다. GitHub 반영은 채팅으로 요청해 주세요."
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>프리뷰 저장 완료</span>
              </span>
            )}
            {codeSyncStatus === 'unsynced' && (
              <button
                type="button"
                onClick={onSaveNow}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold cursor-pointer transition-colors"
                title="브라우저에 남은 수정사항을 프리뷰 서버에 저장합니다"
              >
                <span>서버 반영 대기중 (클릭 저장)</span>
              </button>
            )}
            {codeSyncStatus === 'readonly' && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-bold"
                title="GitHub Pages/Vercel에서는 브라우저에만 임시 저장됩니다."
              >
                <span>배포 미리보기 (브라우저 임시저장)</span>
              </span>
            )}
            {codeSyncStatus === 'error' && (
              <button
                type="button"
                onClick={onSaveNow}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[11px] font-bold cursor-pointer"
              >
                <span>저장 오류 (재시도)</span>
              </button>
            )}

            <span className="text-slate-600 hidden lg:inline">|</span>
            <span className="text-[11px] text-slate-400 hidden lg:inline">
              {isEditMode
                ? '편집 내용은 프리뷰에 자동 저장됩니다. (GitHub 반영은 채팅으로 요청하세요)'
                : '방문자 화면 미리보기 중입니다.'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {codeSyncStatus !== 'readonly' && (
              <button
                type="button"
                onClick={onSaveNow}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                title="수정된 내용을 프리뷰 서버에 즉시 저장합니다"
              >
                <Save className="w-3.5 h-3.5" />
                <span>프리뷰 저장</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleEditMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isEditMode
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
              }`}
            >
              {isEditMode ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>편집 중 (미리보기 전환)</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  <span>바로 편집 켜기</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenInquiries}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Inbox className="w-3.5 h-3.5 text-blue-400" />
              <span>견적문의</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[10px] tabular-nums">
                {inquiryCount}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Settings className="w-3.5 h-3.5 text-slate-300" />
              <span>사이트 설정</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-950/70 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>관리자 종료</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Quick Route Navigator (Region + Service Composite) */}
      <div className="bg-slate-950/90 px-3 sm:px-6 py-2">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold whitespace-nowrap">
              <Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>지역 + 서비스 복합 이동</span>
            </span>

            <button
              type="button"
              onClick={handleCopyCurrentUrl}
              title="클릭하면 현재 프리뷰 페이지 주소를 복사합니다"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-mono max-w-[200px] sm:max-w-xs transition-colors cursor-pointer"
            >
              {copiedPath ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="truncate">{copiedPath ? '주소 복사됨!' : currentPathLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLiveUrl}
              title={`실제 웹사이트 직링크 복사: ${liveDirectUrl}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                copiedLiveUrl
                  ? 'bg-emerald-600/25 border-emerald-400/60 text-emerald-200'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/70 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {copiedLiveUrl ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span>
                {copiedLiveUrl
                  ? `복사됨! (${liveDisplayLabel})`
                  : '실제주소 복사'}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'home' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                currentRoute.type === 'home'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>홈</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate({ type: 'gallery_list' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                isGalleryRoute
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>작업갤러리</span>
            </button>

            <select
              aria-label="지역 페이지 선택"
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selectedRegion
                  ? 'bg-blue-950/70 border-blue-500/70 text-blue-100'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
              }`}
            >
              <option value="" className="bg-slate-900 text-slate-200">
                -- 지역 선택 (전체) --
              </option>
              {regions.map((region) => (
                <option key={region} value={region} className="bg-slate-900 text-white">
                  {region}
                </option>
              ))}
            </select>

            <select
              aria-label="서비스 항목 선택"
              value={selectedServiceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[200px] sm:max-w-[230px] ${
                selectedServiceId
                  ? 'bg-blue-950/70 border-blue-500/70 text-blue-100'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
              }`}
            >
              <option value="" className="bg-slate-900 text-slate-200">
                -- 서비스 항목 선택 --
              </option>
              {services.map((srv) => (
                <option key={srv.id} value={srv.id} className="bg-slate-900 text-white">
                  {srv.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useMemo, useState } from 'react';
import {
  Check,
  Compass,
  Copy,
  Globe,
  Home,
  Sparkles,
} from 'lucide-react';
import type { PageRoute, ServiceItem } from '@/src/types/clearworks';
import {
  getRouteDisplayPath,
  getRoutePath,
  resolveEffectiveRoute,
} from '@/src/utils/seo';
import { normalizeBaseUrl } from '@/src/utils/sitemap';
import { INITIAL_SITE_DATA } from '@/src/data/clearworksData';

interface RegionServiceNavigatorProps {
  currentRoute: PageRoute;
  siteUrl?: string;
  regions: string[];
  services: ServiceItem[];
  onNavigate: (route: PageRoute) => void;
}

export const RegionServiceNavigator: React.FC<RegionServiceNavigatorProps> = ({
  currentRoute,
  siteUrl,
  regions,
  services,
  onNavigate,
}) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedLiveUrl, setCopiedLiveUrl] = useState(false);

  const effectiveRoute = useMemo(
    () =>
      resolveEffectiveRoute(currentRoute, {
        ...INITIAL_SITE_DATA,
        services: { ...INITIAL_SITE_DATA.services, items: services },
      }),
    [currentRoute, services]
  );

  const selectedRegion =
    effectiveRoute.type === 'region' || effectiveRoute.type === 'matrix'
      ? effectiveRoute.regionName
      : '';
  const selectedServiceId =
    effectiveRoute.type === 'service' || effectiveRoute.type === 'matrix'
      ? effectiveRoute.serviceId
      : '';

  const currentPathLabel = getRouteDisplayPath(effectiveRoute);
  const encodedRoutePath = getRoutePath(effectiveRoute);
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
    effectiveRoute.type === 'gallery_list' || effectiveRoute.type === 'gallery_detail';

  return (
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
            <span>{copiedLiveUrl ? `복사됨! (${liveDisplayLabel})` : '실제주소 복사'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onNavigate({ type: 'home' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              effectiveRoute.type === 'home'
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
  );
};

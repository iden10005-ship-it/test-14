import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Compass, Layers, MapPin } from 'lucide-react';
import type { CompanyInfo, GalleryPost, PageRoute, ServiceItem } from '@/src/types/clearworks';
import { normalizeRegionToDetailKey } from '@/src/utils/galleryRegions';

interface RegionServiceNavigatorProps {
  currentRoute: PageRoute;
  company: CompanyInfo;
  regions: string[];
  services: ServiceItem[];
  activePost?: GalleryPost;
  onNavigateRegion: (regionName: string) => void;
  onNavigateService: (serviceId: string) => void;
  onNavigateMatrix: (regionName: string, serviceId: string) => void;
}

export const RegionServiceNavigator: React.FC<RegionServiceNavigatorProps> = ({
  currentRoute,
  company,
  regions,
  services,
  activePost,
  onNavigateRegion,
  onNavigateService,
  onNavigateMatrix,
}) => {
  const defaultRegion = regions[0] || '강남구';
  const defaultServiceId = services[0]?.id || 'srv-1';

  const derivedRegion = useMemo(() => {
    if (currentRoute.type === 'region' || currentRoute.type === 'matrix') {
      return currentRoute.regionName;
    }
    if (currentRoute.type === 'gallery_detail' && activePost?.region) {
      const normalized = normalizeRegionToDetailKey(activePost.region, regions);
      if (normalized && regions.includes(normalized)) {
        return normalized;
      }
    }
    return defaultRegion;
  }, [currentRoute, activePost?.region, regions, defaultRegion]);

  const derivedServiceId = useMemo(() => {
    if (currentRoute.type === 'service' || currentRoute.type === 'matrix') {
      return currentRoute.serviceId;
    }
    return defaultServiceId;
  }, [currentRoute, defaultServiceId]);

  const [selectedRegion, setSelectedRegion] = useState<string>(derivedRegion);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(derivedServiceId);

  useEffect(() => {
    setSelectedRegion(derivedRegion);
  }, [derivedRegion]);

  useEffect(() => {
    setSelectedServiceId(derivedServiceId);
  }, [derivedServiceId]);

  const activeService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? services[0],
    [services, selectedServiceId]
  );

  const currentServiceOnRoute = useMemo(() => {
    if (currentRoute.type === 'service' || currentRoute.type === 'matrix') {
      return services.find((s) => s.id === currentRoute.serviceId) ?? services[0];
    }
    return undefined;
  }, [currentRoute, services]);

  const handleRegionChange = (nextRegion: string) => {
    setSelectedRegion(nextRegion);
    if (currentRoute.type === 'matrix') {
      onNavigateMatrix(nextRegion, selectedServiceId);
    } else if (currentRoute.type === 'region') {
      onNavigateRegion(nextRegion);
    }
  };

  const handleServiceChange = (nextServiceId: string) => {
    setSelectedServiceId(nextServiceId);
    if (currentRoute.type === 'matrix') {
      onNavigateMatrix(selectedRegion, nextServiceId);
    } else if (currentRoute.type === 'service') {
      onNavigateService(nextServiceId);
    }
  };

  if (regions.length === 0 || services.length === 0) return null;

  return (
    <section
      aria-label="지역 및 서비스 통합 탐색"
      className="bg-slate-50/95 border-b border-slate-200/80"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 lg:gap-4">
        {/* Current Active Combination Context */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </span>

          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs sm:text-sm min-w-0">
            {currentRoute.type === 'matrix' && currentServiceOnRoute ? (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateRegion(currentRoute.regionName)}
                  className="font-extrabold text-blue-600 hover:underline cursor-pointer whitespace-nowrap"
                >
                  {currentRoute.regionName}
                </button>
                <span className="text-slate-400 font-bold">×</span>
                <button
                  type="button"
                  onClick={() => onNavigateService(currentServiceOnRoute.id)}
                  className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer truncate"
                >
                  {currentServiceOnRoute.title}
                </button>
                <span className="text-slate-500 font-medium hidden sm:inline">전담 안내</span>
              </>
            ) : currentRoute.type === 'region' ? (
              <>
                <span className="font-extrabold text-blue-600 whitespace-nowrap">
                  {currentRoute.regionName}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 font-medium truncate">
                  지역에서 원하는 서비스를 조합해 보세요
                </span>
              </>
            ) : currentRoute.type === 'service' && currentServiceOnRoute ? (
              <>
                <span className="font-extrabold text-slate-900 truncate">
                  {currentServiceOnRoute.title}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 font-medium whitespace-nowrap">
                  지역별 맞춤 페이지 보기
                </span>
              </>
            ) : (
              <>
                <span className="font-extrabold text-slate-800 whitespace-nowrap">
                  {company.region} 맞춤 안내
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 font-medium truncate">
                  지역과 서비스를 선택해 바로 확인하세요
                </span>
              </>
            )}
          </div>
        </div>

        {/* Region + Service Combination Picker */}
        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 shrink-0">
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <label className="relative flex items-center bg-white border border-slate-200 hover:border-blue-300 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-1.5" />
              <select
                aria-label="지역 선택"
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full sm:w-32 bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </label>

            <label className="relative flex items-center bg-white border border-slate-200 hover:border-blue-300 rounded-xl px-2.5 py-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all">
              <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0 mr-1.5" />
              <select
                aria-label="서비스 선택"
                value={selectedServiceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full sm:w-44 bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {services.map((srv) => (
                  <option key={srv.id} value={srv.id}>
                    {srv.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => onNavigateMatrix(selectedRegion, selectedServiceId)}
            title={
              activeService
                ? `${selectedRegion} ${activeService.title} 페이지로 이동`
                : '선택한 지역+서비스 페이지로 이동'
            }
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>지역·서비스 바로가기</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </section>
  );
};

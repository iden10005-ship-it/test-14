import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Lock,
  Menu,
  MessageCircle,
  Phone,
  Sparkles,
  X,
} from 'lucide-react';
import { EditableText } from '@/src/components/admin/EditableText';
import type { CompanyInfo, PageRoute, ServiceItem } from '@/src/types/clearworks';

type HomeSectionKey =
  | 'home'
  | 'service'
  | 'process'
  | 'gallery'
  | 'price'
  | 'faq'
  | 'regions'
  | 'contact';

const SCROLL_SPY_SECTIONS: Array<Exclude<HomeSectionKey, 'home'>> = [
  'service',
  'process',
  'gallery',
  'price',
  'faq',
  'regions',
  'contact',
];

interface HeaderProps {
  company: CompanyInfo;
  services: ServiceItem[];
  currentPage: PageRoute;
  isEditMode: boolean;
  isAdminMode: boolean;
  onUpdateCompany: (field: keyof CompanyInfo, value: string) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onNavigateHome: () => void;
  onNavigateService: (serviceId: string) => void;
  onNavigateGalleryList: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  company,
  services,
  currentPage,
  isEditMode,
  isAdminMode,
  onUpdateCompany,
  onOpenAdminLogin,
  onLogoutAdmin,
  onNavigateHome,
  onNavigateService,
  onNavigateGalleryList,
  onScrollToSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHomeSection, setActiveHomeSection] = useState<HomeSectionKey>('home');
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (currentPage.type !== 'home') {
      setActiveHomeSection('home');
      return;
    }

    let rafId = 0;

    const updateActiveSection = () => {
      rafId = 0;
      if (window.scrollY < 80) {
        setActiveHomeSection('home');
        return;
      }

      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight > 0 && scrollBottom >= docHeight - 40) {
        setActiveHomeSection('contact');
        return;
      }

      const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 84;
      const triggerY = Math.min(Math.max(headerBottom + 72, 130), window.innerHeight * 0.42);

      let matched: HomeSectionKey = 'home';
      for (const sectionId of SCROLL_SPY_SECTIONS) {
        const el = document.getElementById(sectionId);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= triggerY) {
          matched = sectionId;
        } else {
          break;
        }
      }
      setActiveHomeSection(matched);
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    const timer = window.setTimeout(updateActiveSection, 60);

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(timer);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [currentPage.type]);

  const handleSectionLink = (sectionId: string) => {
    setMobileMenuOpen(false);
    setServiceDropdownOpen(false);
    onScrollToSection(sectionId);
  };

  const handleGoHome = () => {
    setMobileMenuOpen(false);
    setServiceDropdownOpen(false);
    onNavigateHome();
  };

  const isHomeActive = currentPage.type === 'home' && activeHomeSection === 'home';
  const isServiceActive =
    currentPage.type === 'service' ||
    (currentPage.type === 'home' && activeHomeSection === 'service');
  const isProcessActive = currentPage.type === 'home' && activeHomeSection === 'process';
  const isGalleryActive =
    currentPage.type === 'gallery_list' ||
    currentPage.type === 'gallery_detail' ||
    (currentPage.type === 'home' && activeHomeSection === 'gallery');
  const isPriceActive = currentPage.type === 'home' && activeHomeSection === 'price';
  const isFaqActive = currentPage.type === 'home' && activeHomeSection === 'faq';
  const isRegionsActive =
    currentPage.type === 'region' ||
    currentPage.type === 'matrix' ||
    (currentPage.type === 'home' && activeHomeSection === 'regions');
  const isContactActive = currentPage.type === 'home' && activeHomeSection === 'contact';

  const getDesktopNavClass = (active: boolean) =>
    `px-2.5 xl:px-3.5 py-2 text-[15px] xl:text-base font-bold rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
      active
        ? 'text-blue-600 bg-blue-50/80'
        : 'text-slate-800 hover:text-blue-600 hover:bg-slate-50'
    }`;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md backdrop-saturate-150 border-slate-200/70 shadow-[0_8px_28px_rgba(15,23,42,0.07)]'
          : 'bg-white border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Top Utility Bar */}
      <div
        className={`text-slate-300 text-xs py-2 px-4 border-b transition-colors duration-300 ${
          scrolled
            ? 'bg-slate-900/90 border-slate-800/80'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-slate-200 truncate">
              <EditableText
                value={company.region}
                onSave={(v) => onUpdateCompany('region', v)}
                isEditMode={isEditMode}
                label="대표 지역 수정"
              />{' '}
              전지역 무료 견적 출장
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
              운영시간:{' '}
              <EditableText
                value={company.operatingHours}
                onSave={(v) => onUpdateCompany('operatingHours', v)}
                isEditMode={isEditMode}
                label="운영시간 수정"
              />
            </span>
            {!isAdminMode ? (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="inline-flex items-center justify-center p-1 text-slate-400 hover:text-white transition-colors sm:pl-2.5 sm:border-l sm:border-slate-700 cursor-pointer"
                title="관리자 모드 로그인"
                aria-label="관리자 모드 로그인"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-200 transition-colors sm:pl-2 sm:border-l sm:border-slate-700 font-semibold text-[11px] cursor-pointer"
                title="관리자 모드 종료"
              >
                <Lock className="w-3 h-3" />
                <span>관리자 종료</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        aria-label="주 메뉴"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 xl:gap-4"
      >
          {/* Brand Logo */}
          <div
            onClick={handleGoHome}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleGoHome();
              }
            }}
            className="flex items-center gap-2.5 group cursor-pointer select-none text-left shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                <EditableText
                  value={company.name}
                  onSave={(v) => onUpdateCompany('name', v)}
                  isEditMode={isEditMode}
                  label="업체명 수정"
                />
              </span>
              <span className="text-[10px] text-blue-600 font-bold tracking-wider uppercase mt-0.5">
                Glass Cleaning Specialist
              </span>
            </div>
          </div>

          {/* Desktop Navigation (Center-Aligned) */}
          <div className="hidden lg:flex flex-1 items-center justify-center gap-0.5 xl:gap-1.5">
            <button
              type="button"
              onClick={handleGoHome}
              className={getDesktopNavClass(isHomeActive)}
            >
              홈
            </button>

            <div
              className="relative"
              onMouseEnter={() => setServiceDropdownOpen(true)}
              onMouseLeave={() => setServiceDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => handleSectionLink('service')}
                aria-expanded={serviceDropdownOpen}
                className={`${getDesktopNavClass(isServiceActive)} flex items-center gap-1`}
              >
                <span>서비스목록</span>
                <ChevronDown
                  className={`w-4 h-4 transition-colors ${
                    isServiceActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                />
              </button>

              {serviceDropdownOpen && (
                <div className="absolute top-full left-0 w-68 pt-1.5 z-50">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2">
                    <div className="text-xs font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider border-b border-slate-100 mb-1">
                      전문 서비스 목록
                    </div>
                    {services.map((srv) => (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => {
                          setServiceDropdownOpen(false);
                          onNavigateService(srv.id);
                        }}
                        className="w-full text-left px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span>{srv.title}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleSectionLink('process')}
              className={getDesktopNavClass(isProcessActive)}
            >
              청소과정
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setServiceDropdownOpen(false);
                onNavigateGalleryList();
              }}
              className={getDesktopNavClass(isGalleryActive)}
            >
              작업갤러리
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('price')}
              className={getDesktopNavClass(isPriceActive)}
            >
              가격안내
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('faq')}
              className={getDesktopNavClass(isFaqActive)}
            >
              FAQ
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('regions')}
              className={getDesktopNavClass(isRegionsActive)}
            >
              서비스지역
            </button>

            <button
              type="button"
              onClick={() => handleSectionLink('contact')}
              className={`ml-1 px-3.5 xl:px-4 py-2 text-[15px] xl:text-base font-bold rounded-xl transition-all duration-200 border whitespace-nowrap shrink-0 cursor-pointer ${
                isContactActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border-blue-200 hover:border-blue-600'
              }`}
            >
              무료견적
            </button>
          </div>

          {/* Right Action & Mobile Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${company.phone}`}
              className="hidden sm:flex px-4 xl:px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm xl:text-[15px] font-bold transition-all items-center gap-1.5 shadow-md shadow-blue-500/20 whitespace-nowrap shrink-0 tabular-nums"
            >
              <Phone className="w-4 h-4" />
              <span>{company.phone}</span>
            </a>

            <div className="flex lg:hidden items-center gap-2 shrink-0">
              <a
                href={`tel:${company.phone}`}
                className="w-11 h-11 rounded-xl bg-blue-600 text-white shadow-xs flex items-center justify-center sm:hidden"
                aria-label="전화 걸기"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
                className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 shadow-2xl max-h-[78vh] overflow-y-auto">
            <div className="space-y-1 mb-4">
              <button
                type="button"
                onClick={handleGoHome}
                className={`w-full text-left px-3.5 py-3 text-base font-bold rounded-xl transition-colors ${
                  isHomeActive
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-900 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                홈으로
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('service')}
                className={`w-full text-left px-3.5 py-3 text-base font-bold rounded-xl transition-colors ${
                  isServiceActive
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-800 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                서비스 안내
              </button>
              <div className="pl-3 space-y-1 pb-2">
                {services.map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigateService(srv.id);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg flex items-center justify-between ${
                      currentPage.type === 'service' && currentPage.serviceId === srv.id
                        ? 'text-blue-600 bg-blue-50/70'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'
                    }`}
                  >
                    <span>· {srv.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleSectionLink('process')}
                className={`w-full text-left px-3.5 py-2.5 text-[15px] font-semibold rounded-xl transition-colors ${
                  isProcessActive
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                청소과정
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateGalleryList();
                }}
                className={`w-full text-left px-3.5 py-2.5 text-[15px] font-bold rounded-xl transition-colors ${
                  isGalleryActive
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                작업갤러리 (현장일지)
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('price')}
                className={`w-full text-left px-3.5 py-2.5 text-[15px] font-semibold rounded-xl transition-colors ${
                  isPriceActive
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                가격안내
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('faq')}
                className={`w-full text-left px-3.5 py-2.5 text-[15px] font-semibold rounded-xl transition-colors ${
                  isFaqActive
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                자주 묻는 질문 (FAQ)
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('regions')}
                className={`w-full text-left px-3.5 py-2.5 text-[15px] font-semibold rounded-xl transition-colors ${
                  isRegionsActive
                    ? 'text-blue-600 bg-blue-50/70'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                서비스 지역 안내
              </button>
              <button
                type="button"
                onClick={() => handleSectionLink('contact')}
                className={`w-full text-left px-3.5 py-3 text-base font-bold rounded-xl transition-colors ${
                  isContactActive
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                }`}
              >
                무료 견적 신청하기
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
              <a
                href={`tel:${company.phone}`}
                className="py-3 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>전화 상담</span>
              </a>
              <a
                href={company.kakaoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 rounded-xl bg-[#FEE500] text-[#3c1e1e] font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>카톡 1:1 문의</span>
              </a>
            </div>
          </div>
        )}
    </header>
  );
};

import { useEffect, useState } from 'react';
import { ContactSection } from '@/src/components/ContactSection';
import { FaqSection } from '@/src/components/FaqSection';
import { Footer } from '@/src/components/Footer';
import { GalleryDetailPage } from '@/src/components/GalleryDetailPage';
import { GalleryListPage } from '@/src/components/GalleryListPage';
import { GallerySection } from '@/src/components/GallerySection';
import { Header } from '@/src/components/Header';
import { Hero } from '@/src/components/Hero';
import { MatrixPage } from '@/src/components/MatrixPage';
import { MobileFloatingCta } from '@/src/components/MobileFloatingCta';
import { PricingSection } from '@/src/components/PricingSection';
import { ProcessSection } from '@/src/components/ProcessSection';
import { RegionDetailPage } from '@/src/components/RegionDetailPage';
import { RegionsSection } from '@/src/components/RegionsSection';
import { ReviewsSection } from '@/src/components/ReviewsSection';
import { ServiceDetailPage } from '@/src/components/ServiceDetailPage';
import { ServicesSection } from '@/src/components/ServicesSection';
import { AdminLoginModal } from '@/src/components/admin/AdminLoginModal';
import { AdminToolbar } from '@/src/components/admin/AdminToolbar';
import {
  ImageEditorModal,
  type ImageEditTarget,
} from '@/src/components/admin/ImageEditorModal';
import { InquiriesModal } from '@/src/components/admin/InquiriesModal';
import { SiteSettingsModal } from '@/src/components/admin/SiteSettingsModal';
import { CLEARWORKS_IMAGES, INITIAL_SITE_DATA } from '@/src/data/clearworksData';
import type {
  CompanyInfo,
  GalleryPost,
  HeroData,
  InquiryItem,
  InquiryPayload,
  PageRoute,
  RegionDetail,
  ServiceItem,
  SiteData,
} from '@/src/types/clearworks';
import { applySeoForRoute } from '@/src/utils/seo';

const SITE_DATA_STORAGE_KEY = 'clearworks_site_data_v1';
const INQUIRIES_STORAGE_KEY = 'clearworks_inquiries_v1';
const ADMIN_SESSION_KEY = 'clearworks_admin_session_v1';

function loadInitialSiteData(): SiteData {
  if (typeof window === 'undefined') return INITIAL_SITE_DATA;
  try {
    const raw = localStorage.getItem(SITE_DATA_STORAGE_KEY);
    if (!raw) return INITIAL_SITE_DATA;
    const parsed = JSON.parse(raw) as Partial<SiteData>;
    return {
      ...INITIAL_SITE_DATA,
      ...parsed,
      company: { ...INITIAL_SITE_DATA.company, ...(parsed.company ?? {}) },
      hero: { ...INITIAL_SITE_DATA.hero, ...(parsed.hero ?? {}) },
      services: { ...INITIAL_SITE_DATA.services, ...(parsed.services ?? {}) },
      process: { ...INITIAL_SITE_DATA.process, ...(parsed.process ?? {}) },
      gallery: { ...INITIAL_SITE_DATA.gallery, ...(parsed.gallery ?? {}) },
      pricing: { ...INITIAL_SITE_DATA.pricing, ...(parsed.pricing ?? {}) },
      reviews: { ...INITIAL_SITE_DATA.reviews, ...(parsed.reviews ?? {}) },
      faq: { ...INITIAL_SITE_DATA.faq, ...(parsed.faq ?? {}) },
      regions: {
        ...INITIAL_SITE_DATA.regions,
        ...(parsed.regions ?? {}),
        details: {
          ...INITIAL_SITE_DATA.regions.details,
          ...(parsed.regions?.details ?? {}),
        },
      },
      contactForm: { ...INITIAL_SITE_DATA.contactForm, ...(parsed.contactForm ?? {}) },
    };
  } catch {
    return INITIAL_SITE_DATA;
  }
}

function loadInitialInquiries(): InquiryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INQUIRIES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InquiryItem[]) : [];
  } catch {
    return [];
  }
}

function isAdminHash(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return hash === 'admin';
}

function parseHashRoute(): PageRoute {
  if (typeof window === 'undefined') return { type: 'home' };
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash || hash.toLowerCase() === 'admin') return { type: 'home' };

  const parts = hash.split('/').map((p) => decodeURIComponent(p));
  if (parts[0] === 'service' && parts[1]) {
    return { type: 'service', serviceId: parts[1] };
  }
  if (parts[0] === 'region' && parts[1]) {
    if (parts[2] === 'service' && parts[3]) {
      return { type: 'matrix', regionName: parts[1], serviceId: parts[3] };
    }
    return { type: 'region', regionName: parts[1] };
  }
  if (parts[0] === 'gallery') {
    if (parts[1]) return { type: 'gallery_detail', postId: parts[1] };
    return { type: 'gallery_list' };
  }
  return { type: 'home' };
}

function buildHashForRoute(route: PageRoute): string {
  switch (route.type) {
    case 'home':
      return '';
    case 'service':
      return `#/service/${encodeURIComponent(route.serviceId)}`;
    case 'region':
      return `#/region/${encodeURIComponent(route.regionName)}`;
    case 'matrix':
      return `#/region/${encodeURIComponent(route.regionName)}/service/${encodeURIComponent(route.serviceId)}`;
    case 'gallery_list':
      return '#/gallery';
    case 'gallery_detail':
      return `#/gallery/${encodeURIComponent(route.postId)}`;
  }
}

export default function App() {
  const [siteData, setSiteData] = useState<SiteData>(() => loadInitialSiteData());
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => loadInitialInquiries());
  const [route, setRoute] = useState<PageRoute>(() => parseHashRoute());

  // Strict Visitor vs Admin Mode
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(() => isAdminHash());
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [inquiriesModalOpen, setInquiriesModalOpen] = useState<boolean>(false);
  const [imageEditTarget, setImageEditTarget] = useState<ImageEditTarget | null>(null);

  // Active editing only allowed when authenticated in Admin Mode AND Edit Toggle is ON
  const activeEditMode = isAdminMode && isEditMode;

  useEffect(() => {
    try {
      localStorage.setItem(SITE_DATA_STORAGE_KEY, JSON.stringify(siteData));
    } catch {
      // Ignore storage quota errors
    }
  }, [siteData]);

  useEffect(() => {
    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(inquiries));
    } catch {
      // Ignore storage quota errors
    }
  }, [inquiries]);

  useEffect(() => {
    if (isAdminHash() && !isAdminMode) {
      setLoginModalOpen(true);
    }
  }, [isAdminMode]);

  useEffect(() => {
    const onHashChange = () => {
      if (isAdminHash() && !isAdminMode) {
        setLoginModalOpen(true);
      }
      setRoute(parseHashRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [isAdminMode]);

  useEffect(() => {
    applySeoForRoute(route, siteData);
  }, [route, siteData]);

  const navigateTo = (next: PageRoute) => {
    setRoute(next);
    const nextHash = buildHashForRoute(next);
    if (typeof window !== 'undefined') {
      if (nextHash) {
        window.history.pushState(null, '', nextHash);
      } else {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const scrollToSection = (sectionId: string) => {
    if (route.type !== 'home') {
      navigateTo({ type: 'home' });
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearAdminHash = () => {
    if (typeof window !== 'undefined' && isAdminHash()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminMode(true);
    setIsEditMode(true);
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } catch {
      // Ignore sessionStorage failure
    }
    clearAdminHash();
  };

  const handleLogoutAdmin = () => {
    setIsAdminMode(false);
    setSettingsModalOpen(false);
    setInquiriesModalOpen(false);
    setImageEditTarget(null);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore
    }
    clearAdminHash();
  };

  const handleInquirySubmit = (payload: InquiryPayload) => {
    const newEntry: InquiryItem = {
      ...payload,
      id: `inq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: '대기중',
    };
    setInquiries((prev) => [newEntry, ...prev]);
  };

  // Updaters
  const updateCompany = (field: keyof CompanyInfo, value: string) => {
    setSiteData((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }));
  };

  const updateHero = (field: keyof HeroData, value: string) => {
    setSiteData((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  const updateHeroStat = (statId: string, field: 'value' | 'label', value: string) => {
    setSiteData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        stats: prev.hero.stats.map((s) => (s.id === statId ? { ...s, [field]: value } : s)),
      },
    }));
  };

  const updateServiceField = (
    id: string,
    field: 'title' | 'description' | 'badge',
    val: string
  ) => {
    setSiteData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.map((s) => (s.id === id ? { ...s, [field]: val } : s)),
      },
    }));
  };

  const updateFullService = (updated: ServiceItem) => {
    setSiteData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.map((s) => (s.id === updated.id ? updated : s)),
      },
    }));
  };

  const addService = () => {
    const newItem: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: '새 전문 청소 서비스',
      description: '신규 서비스에 대한 간단한 설명을 입력해 주세요.',
      iconName: 'Sparkles',
      badge: '신규 서비스',
      detail: {
        tagline: '맞춤형 프리미엄 유리창·외벽 케어 솔루션',
        targetAudience: '아파트, 상가, 오피스, 빌딩',
        scopeList: ['기본 오염물 제거 및 유리창 양면 세척', '창틀 및 마감 라인 정밀 클리닝'],
        equipment: ['전문가용 윈도우 스퀴지', '친환경 중성 세정제'],
        duration: '현장 규모별 약 2~4시간 소요',
        priceGuide: '현장 확인 후 무료 견적 산출',
        beforeImage: CLEARWORKS_IMAGES.aptBefore,
        afterImage: CLEARWORKS_IMAGES.aptAfter,
        faqList: [
          {
            q: '상담 후 언제 작업이 가능한가요?',
            a: '일정 조율 후 평일 및 주말 모두 원하시는 날짜에 맞춰 출장 시공이 가능합니다.',
          },
        ],
      },
    };
    setSiteData((prev) => ({
      ...prev,
      services: { ...prev.services, items: [...prev.services.items, newItem] },
    }));
  };

  const deleteService = (id: string) => {
    setSiteData((prev) => ({
      ...prev,
      services: {
        ...prev.services,
        items: prev.services.items.filter((s) => s.id !== id),
      },
    }));
  };

  const updateProcessStep = (stepNum: number, field: 'title' | 'description', val: string) => {
    setSiteData((prev) => ({
      ...prev,
      process: {
        ...prev.process,
        steps: prev.process.steps.map((st) =>
          st.step === stepNum ? { ...st, [field]: val } : st
        ),
      },
    }));
  };

  const updateGalleryPostField = (
    postId: string,
    field: 'title' | 'excerpt' | 'coverImage',
    val: string
  ) => {
    setSiteData((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        posts: prev.gallery.posts.map((p) => {
          if (p.id !== postId) return p;
          if (field === 'coverImage') {
            return { ...p, coverImage: val, afterImage: val };
          }
          return { ...p, [field]: val };
        }),
      },
    }));
  };

  const addGalleryPost = (post: GalleryPost) => {
    setSiteData((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        posts: [post, ...prev.gallery.posts],
      },
    }));
  };

  const updateGalleryPost = (updated: GalleryPost) => {
    setSiteData((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        posts: prev.gallery.posts.map((p) => (p.id === updated.id ? updated : p)),
      },
    }));
  };

  const deleteGalleryPost = (postId: string) => {
    setSiteData((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        posts: prev.gallery.posts.filter((p) => p.id !== postId),
      },
    }));
  };

  const updatePricingRow = (id: string, field: 'category' | 'standard' | 'price', val: string) => {
    setSiteData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        rows: prev.pricing.rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
      },
    }));
  };

  const addPricingRow = () => {
    setSiteData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        rows: [
          ...prev.pricing.rows,
          {
            id: `price-${Date.now()}`,
            category: '새 서비스 항목',
            standard: '기준 설명 입력',
            price: '상담 후 결정',
          },
        ],
      },
    }));
  };

  const deletePricingRow = (id: string) => {
    setSiteData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        rows: prev.pricing.rows.filter((r) => r.id !== id),
      },
    }));
  };

  const updateReview = (id: string, field: 'content' | 'author' | 'tag', val: string) => {
    setSiteData((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        items: prev.reviews.items.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
      },
    }));
  };

  const addReview = () => {
    setSiteData((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        items: [
          ...prev.reviews.items,
          {
            id: `rev-${Date.now()}`,
            content: '시공이 꼼꼼하고 유리창이 새것처럼 투명해져서 매우 만족합니다.',
            author: '서울시 고객님',
            rating: 5,
            tag: '유리창 청소',
          },
        ],
      },
    }));
  };

  const deleteReview = (id: string) => {
    setSiteData((prev) => ({
      ...prev,
      reviews: {
        ...prev.reviews,
        items: prev.reviews.items.filter((r) => r.id !== id),
      },
    }));
  };

  const updateFaq = (id: string, field: 'question' | 'answer', val: string) => {
    setSiteData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.map((f) => (f.id === id ? { ...f, [field]: val } : f)),
      },
    }));
  };

  const addFaq = () => {
    setSiteData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: [
          ...prev.faq.items,
          {
            id: `faq-${Date.now()}`,
            question: '새 질문을 입력해 주세요.',
            answer: '클릭하여 답변 내용을 바로 작성할 수 있습니다.',
          },
        ],
      },
    }));
  };

  const deleteFaq = (id: string) => {
    setSiteData((prev) => ({
      ...prev,
      faq: {
        ...prev.faq,
        items: prev.faq.items.filter((f) => f.id !== id),
      },
    }));
  };

  const addRegion = (name: string) => {
    setSiteData((prev) => {
      if (prev.regions.list.includes(name)) return prev;
      return {
        ...prev,
        regions: {
          ...prev.regions,
          list: [...prev.regions.list, name],
        },
      };
    });
  };

  const removeRegion = (index: number) => {
    setSiteData((prev) => ({
      ...prev,
      regions: {
        ...prev.regions,
        list: prev.regions.list.filter((_, i) => i !== index),
      },
    }));
  };

  const updateRegionDetail = (regionName: string, detail: RegionDetail) => {
    setSiteData((prev) => ({
      ...prev,
      regions: {
        ...prev.regions,
        details: {
          ...prev.regions.details,
          [regionName]: detail,
        },
      },
    }));
  };

  const activeService =
    route.type === 'service' || route.type === 'matrix'
      ? siteData.services.items.find((s) => s.id === route.serviceId) ??
        siteData.services.items[0]
      : siteData.services.items[0];

  const activePost =
    route.type === 'gallery_detail'
      ? siteData.gallery.posts.find((p) => p.id === route.postId) ??
        siteData.gallery.posts[0]
      : siteData.gallery.posts[0];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white bg-white">
      {isAdminMode && (
        <AdminToolbar
          isEditMode={isEditMode}
          inquiryCount={inquiries.length}
          onToggleEditMode={() => setIsEditMode((prev) => !prev)}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenInquiries={() => setInquiriesModalOpen(true)}
          onExitAdmin={handleLogoutAdmin}
        />
      )}

      <Header
        company={siteData.company}
        services={siteData.services.items}
        currentPage={route}
        isEditMode={activeEditMode}
        isAdminMode={isAdminMode}
        onUpdateCompany={updateCompany}
        onOpenAdminLogin={() => setLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        onNavigateHome={() => navigateTo({ type: 'home' })}
        onNavigateService={(serviceId) => navigateTo({ type: 'service', serviceId })}
        onNavigateGalleryList={() => navigateTo({ type: 'gallery_list' })}
        onScrollToSection={scrollToSection}
      />

      <main className="flex-1">
        {route.type === 'home' && (
          <>
            <Hero
              hero={siteData.hero}
              company={siteData.company}
              isEditMode={activeEditMode}
              onUpdateHero={updateHero}
              onUpdateStat={updateHeroStat}
              onEditImage={setImageEditTarget}
              onScrollToContact={() => scrollToSection('contact')}
            />
            <ServicesSection
              sectionTitle={siteData.services.sectionTitle}
              sectionSubtitle={siteData.services.sectionSubtitle}
              services={siteData.services.items}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  services: { ...prev.services, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  services: { ...prev.services, sectionSubtitle: val },
                }))
              }
              onUpdateService={updateServiceField}
              onAddService={addService}
              onDeleteService={deleteService}
              onViewDetail={(serviceId) => navigateTo({ type: 'service', serviceId })}
            />
            <ProcessSection
              sectionTitle={siteData.process.sectionTitle}
              sectionSubtitle={siteData.process.sectionSubtitle}
              steps={siteData.process.steps}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  process: { ...prev.process, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  process: { ...prev.process, sectionSubtitle: val },
                }))
              }
              onUpdateStep={updateProcessStep}
            />
            <GallerySection
              sectionTitle={siteData.gallery.sectionTitle}
              sectionSubtitle={siteData.gallery.sectionSubtitle}
              posts={siteData.gallery.posts}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  gallery: { ...prev.gallery, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  gallery: { ...prev.gallery, sectionSubtitle: val },
                }))
              }
              onUpdatePostField={updateGalleryPostField}
              onEditImage={setImageEditTarget}
              onViewGalleryList={() => navigateTo({ type: 'gallery_list' })}
              onSelectPost={(postId) => navigateTo({ type: 'gallery_detail', postId })}
            />
            <PricingSection
              sectionTitle={siteData.pricing.sectionTitle}
              sectionSubtitle={siteData.pricing.sectionSubtitle}
              footerNote={siteData.pricing.footerNote}
              rows={siteData.pricing.rows}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  pricing: { ...prev.pricing, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  pricing: { ...prev.pricing, sectionSubtitle: val },
                }))
              }
              onUpdateFooterNote={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  pricing: { ...prev.pricing, footerNote: val },
                }))
              }
              onUpdateRow={updatePricingRow}
              onAddRow={addPricingRow}
              onDeleteRow={deletePricingRow}
              onScrollToContact={() => scrollToSection('contact')}
            />
            <ReviewsSection
              sectionTitle={siteData.reviews.sectionTitle}
              sectionSubtitle={siteData.reviews.sectionSubtitle}
              reviews={siteData.reviews.items}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  reviews: { ...prev.reviews, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  reviews: { ...prev.reviews, sectionSubtitle: val },
                }))
              }
              onUpdateReview={updateReview}
              onAddReview={addReview}
              onDeleteReview={deleteReview}
            />
            <FaqSection
              sectionTitle={siteData.faq.sectionTitle}
              sectionSubtitle={siteData.faq.sectionSubtitle}
              items={siteData.faq.items}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  faq: { ...prev.faq, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  faq: { ...prev.faq, sectionSubtitle: val },
                }))
              }
              onUpdateFaq={updateFaq}
              onAddFaq={addFaq}
              onDeleteFaq={deleteFaq}
            />
            <RegionsSection
              sectionTitle={siteData.regions.sectionTitle}
              sectionSubtitle={siteData.regions.sectionSubtitle}
              regions={siteData.regions.list}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  regions: { ...prev.regions, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  regions: { ...prev.regions, sectionSubtitle: val },
                }))
              }
              onAddRegion={addRegion}
              onRemoveRegion={removeRegion}
              onViewRegion={(regionName) => navigateTo({ type: 'region', regionName })}
            />
            <ContactSection
              sectionTitle={siteData.contactForm.sectionTitle}
              sectionSubtitle={siteData.contactForm.sectionSubtitle}
              successMessage={siteData.contactForm.successMessage}
              company={siteData.company}
              isEditMode={activeEditMode}
              onUpdateTitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  contactForm: { ...prev.contactForm, sectionTitle: val },
                }))
              }
              onUpdateSubtitle={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  contactForm: { ...prev.contactForm, sectionSubtitle: val },
                }))
              }
              onUpdateSuccessMessage={(val) =>
                setSiteData((prev) => ({
                  ...prev,
                  contactForm: { ...prev.contactForm, successMessage: val },
                }))
              }
              onSubmitInquiry={handleInquirySubmit}
            />
          </>
        )}

        {route.type === 'service' && (
          <ServiceDetailPage
            service={activeService}
            allServices={siteData.services.items}
            company={siteData.company}
            isEditMode={activeEditMode}
            onUpdateService={updateFullService}
            onEditImage={setImageEditTarget}
            onBack={() => navigateTo({ type: 'home' })}
            onSelectService={(serviceId) => navigateTo({ type: 'service', serviceId })}
            onSubmitInquiry={handleInquirySubmit}
          />
        )}

        {route.type === 'region' && (
          <RegionDetailPage
            regionName={route.regionName}
            regionDetail={siteData.regions.details[route.regionName]}
            allServices={siteData.services.items}
            company={siteData.company}
            isEditMode={activeEditMode}
            onUpdateRegionDetail={updateRegionDetail}
            onBack={() => navigateTo({ type: 'home' })}
            onSelectMatrix={(regionName, serviceId) =>
              navigateTo({ type: 'matrix', regionName, serviceId })
            }
            onSubmitInquiry={handleInquirySubmit}
          />
        )}

        {route.type === 'matrix' && (
          <MatrixPage
            regionName={route.regionName}
            regionDetail={siteData.regions.details[route.regionName]}
            service={activeService}
            company={siteData.company}
            isEditMode={activeEditMode}
            onUpdateService={updateFullService}
            onEditImage={setImageEditTarget}
            onBack={() => navigateTo({ type: 'home' })}
            onNavigateRegion={(regionName) => navigateTo({ type: 'region', regionName })}
            onNavigateService={(serviceId) => navigateTo({ type: 'service', serviceId })}
            onSubmitInquiry={handleInquirySubmit}
          />
        )}

        {route.type === 'gallery_list' && (
          <GalleryListPage
            posts={siteData.gallery.posts}
            isEditMode={activeEditMode}
            onAddPost={addGalleryPost}
            onUpdatePost={updateGalleryPost}
            onDeletePost={deleteGalleryPost}
            onBackHome={() => navigateTo({ type: 'home' })}
            onSelectPost={(postId) => navigateTo({ type: 'gallery_detail', postId })}
          />
        )}

        {route.type === 'gallery_detail' && activePost && (
          <GalleryDetailPage
            post={activePost}
            allPosts={siteData.gallery.posts}
            company={siteData.company}
            isEditMode={activeEditMode}
            onUpdatePost={updateGalleryPost}
            onEditImage={setImageEditTarget}
            onBackToList={() => navigateTo({ type: 'gallery_list' })}
            onSelectPost={(postId) => navigateTo({ type: 'gallery_detail', postId })}
            onSubmitInquiry={handleInquirySubmit}
          />
        )}
      </main>

      <Footer
        company={siteData.company}
        isEditMode={activeEditMode}
        isAdminMode={isAdminMode}
        onUpdateCompany={updateCompany}
        onOpenAdminLogin={() => setLoginModalOpen(true)}
        onLogoutAdmin={handleLogoutAdmin}
        onScrollToSection={scrollToSection}
      />
      <MobileFloatingCta
        company={siteData.company}
        onOpenQuote={() => scrollToSection('contact')}
      />

      {/* Admin Modals (Login modal available for admin sign-in; editing modals strictly gated by isAdminMode) */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        expectedPin={siteData.adminPin}
        onClose={() => {
          setLoginModalOpen(false);
          clearAdminHash();
        }}
        onSuccess={handleAdminLoginSuccess}
      />

      {isAdminMode && (
        <>
          <ImageEditorModal
            target={imageEditTarget}
            onClose={() => setImageEditTarget(null)}
          />
          <InquiriesModal
            isOpen={inquiriesModalOpen}
            inquiries={inquiries}
            onClose={() => setInquiriesModalOpen(false)}
            onToggleStatus={(id) =>
              setInquiries((prev) =>
                prev.map((item) =>
                  item.id === id
                    ? { ...item, status: item.status === '대기중' ? '상담완료' : '대기중' }
                    : item
                )
              )
            }
            onDelete={(id) => setInquiries((prev) => prev.filter((item) => item.id !== id))}
          />
          <SiteSettingsModal
            isOpen={settingsModalOpen}
            siteData={siteData}
            onClose={() => setSettingsModalOpen(false)}
            onUpdateSiteData={setSiteData}
            onResetDefaults={() => setSiteData(INITIAL_SITE_DATA)}
          />
        </>
      )}
    </div>
  );
}

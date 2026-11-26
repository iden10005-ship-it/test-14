export type ServiceIconName =
  | 'Home'
  | 'Store'
  | 'Building2'
  | 'Sparkles'
  | 'Layers'
  | 'ShieldCheck';

export interface CompanyInfo {
  name: string;
  region: string;
  phone: string;
  kakaoLink: string;
  representative: string;
  bizNumber: string;
  address: string;
  operatingHours: string;
  asPeriod: string;
}

export interface HeroStat {
  id: string;
  value: string;
  label: string;
}

export interface HeroData {
  badgeText: string;
  title: string;
  subtitle: string;
  callButtonText: string;
  smsButtonText?: string;
  kakaoButtonText: string;
  beforeAfterNotice: string;
  beforeImage: string;
  afterImage: string;
  beforeLabel: string;
  afterLabel: string;
  stats: HeroStat[];
}

export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceDetail {
  tagline: string;
  targetAudience: string;
  scopeList: string[];
  equipment: string[];
  duration: string;
  priceGuide: string;
  beforeImage: string;
  afterImage: string;
  beforeCaption?: string;
  afterCaption?: string;
  faqList?: ServiceFaq[];
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  iconName: ServiceIconName;
  badge?: string;
  image?: string;
  detail: ServiceDetail;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface CaseItem {
  id: string;
  title: string;
  specs: string;
  category: '아파트' | '상가' | '빌딩';
  beforeImage: string;
  afterImage: string;
  description: string;
}

export type GalleryBlock =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'text'; text: string }
  | {
      id: string;
      type: 'image';
      url: string;
      caption?: string;
      filename?: string;
      sizeInfo?: string;
    };

export interface GalleryPostSeo {
  title?: string;
  description?: string;
  ogTitle?: string;
  keywords?: string;
  autoSync?: boolean;
}

export interface GalleryPost {
  id: string;
  title: string;
  category: string;
  region: string;
  date: string;
  author: string;
  excerpt: string;
  coverImage: string;
  beforeImage: string;
  afterImage: string;
  tags: string[];
  equipmentUsed: string[];
  keyPoints: string[];
  content: string;
  blocks?: GalleryBlock[];
  seo?: GalleryPostSeo;
}

export interface PricingRow {
  id: string;
  category: string;
  standard: string;
  price: string;
  highlight?: boolean;
}

export type ReviewPlatform = 'kakao' | 'soomgo' | 'daangn';

export interface ReviewChatMessage {
  sender: 'customer' | 'company';
  text: string;
  time?: string;
}

export interface ReviewItem {
  id: string;
  content: string;
  author: string;
  rating: number;
  tag?: string;
  subTag?: string;
  highlights?: string[];
  platform?: ReviewPlatform;
  region?: string;
  date?: string;
  contactPhone?: string;
  photos?: string[];
  chatMessages?: ReviewChatMessage[];
  serviceCategory?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface RegionDetail {
  name: string;
  subDistricts: string[];
  description: string;
  leadTime: string;
  popularComplexes: string[];
  notice: string;
}

export interface InquiryPayload {
  name: string;
  phone: string;
  region: string;
  buildingType: string;
  content: string;
}

export interface InquiryItem extends InquiryPayload {
  id: string;
  createdAt: string;
  status: '대기중' | '상담완료';
}

export type PageRoute =
  | { type: 'home' }
  | { type: 'service'; serviceId: string }
  | { type: 'region'; regionName: string }
  | { type: 'matrix'; regionName: string; serviceId: string }
  | { type: 'gallery_list' }
  | { type: 'gallery_detail'; postId: string };

export interface PageSeoMeta {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface SeoSettings {
  defaultOgImage?: string;
  pages: Record<string, PageSeoMeta>;
}

export interface SiteShowcaseItem {
  id: string;
  image: string;
  title: string;
  description: string;
  tag: string;
  region: string;
}

export interface SiteShowcaseData {
  eyebrow?: string;
  sectionTitle: string;
  sectionSubtitle: string;
  items: SiteShowcaseItem[];
}

export interface SiteData {
  adminPin: string;
  siteUrl?: string;
  updatedAt?: string;
  worklogPrompt?: string;
  seo?: SeoSettings;
  company: CompanyInfo;
  hero: HeroData;
  services: {
    sectionTitle: string;
    sectionSubtitle: string;
    items: ServiceItem[];
  };
  siteShowcase?: SiteShowcaseData;
  process: {
    sectionTitle: string;
    sectionSubtitle: string;
    steps: ProcessStep[];
  };
  gallery: {
    sectionTitle: string;
    sectionSubtitle: string;
    categories?: string[];
    posts: GalleryPost[];
  };
  pricing: {
    sectionTitle: string;
    sectionSubtitle: string;
    footerNote: string;
    rows: PricingRow[];
  };
  reviews: {
    sectionTitle: string;
    sectionSubtitle: string;
    items: ReviewItem[];
  };
  faq: {
    sectionTitle: string;
    sectionSubtitle: string;
    items: FaqItem[];
  };
  regions: {
    sectionTitle: string;
    sectionSubtitle: string;
    list: string[];
    details: Record<string, RegionDetail>;
  };
  contactForm: {
    sectionTitle: string;
    sectionSubtitle: string;
    successMessage: string;
  };
}

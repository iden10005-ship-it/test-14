import { INITIAL_SITE_DATA } from '@/src/data/clearworksData';
import type {
  PageRoute,
  PageSeoMeta,
  RegionDetail,
  ServiceItem,
  SiteData,
} from '@/src/types/clearworks';
import { generateNaverSeoFromPost, parseSeoKeywords } from '@/src/utils/naverSeoGenerator';

export const DEFAULT_HOME_KEYWORDS =
  '유리창청소, 아파트외창청소, 외벽청소, 상가유리창청소, 빌딩외벽청소, 고층유리창청소, 서울유리창청소, 경기유리창청소, 인천유리창청소, 창틀청소, 유리발수코팅, 어닝청소, 클리어웍스, 서울 건물 외벽청소 업체, 수도권 상가 유리창청소, 경기 아파트 외창청소 업체, 빌딩 외벽 고압세척, 상가 간판 어닝청소, 매장 유리 시트지 제거, 아파트 외창청소 비용 견적, 상가 유리창 정기청소 비용, 건물 외벽청소 견적 문의, 클리어웍스 유리창청소 후기';

export interface ResolvedSeoMeta {
  pageKey: string;
  title: string;
  description: string;
  keywords: string;
  ogType: 'website' | 'article';
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  geoRegion?: string;
  geoPlacename?: string;
  routeHash: string;
  routePath: string;
  jsonLd: Record<string, unknown> | null;
}

export interface MetroRegionContext {
  raw: string;
  metroShort: '서울' | '경기' | '인천';
  metroFull: '서울특별시' | '경기도' | '인천광역시';
  displayRegion: string;
  shortAlias: string;
  aliases: string[];
}

const SEOUL_DISTRICTS = new Set([
  '강남구',
  '강동구',
  '강북구',
  '강서구',
  '관악구',
  '광진구',
  '구로구',
  '금천구',
  '노원구',
  '도봉구',
  '동대문구',
  '동작구',
  '마포구',
  '서대문구',
  '서초구',
  '성동구',
  '성북구',
  '송파구',
  '양천구',
  '영등포구',
  '용산구',
  '은평구',
  '종로구',
  '중구',
  '중랑구',
]);

const SERVICE_SEO_STEMS: Record<string, string[]> = {
  'srv-1': ['아파트 외창청소', '아파트 유리창청소', '아파트창문청소', '베란다 창틀청소', '외창 물때제거'],
  'srv-2': ['상가 유리창청소', '매장 쇼윈도청소', '사무실 유리청소', '통유리 청소', '매장 외창청소'],
  'srv-3': ['빌딩 외벽청소', '고층 유리창청소', '외벽 고압세척', '건물 외벽청소', '로프 외벽청소'],
  'srv-4': ['간판청소', '어닝청소', '간판 고압세척', '어닝 세척', '매장 간판청소'],
  'srv-5': ['시트지제거', '썬팅지제거', '유리창 필름제거', '유리 본드자국 제거', '매장 시트지제거'],
  'srv-6': ['유리 발수코팅', '유리 백화현상 제거', '조류 배설물 청소', '준공후 외창청소', '특수 유리창청소'],
  apt: ['아파트 외창청소', '아파트 유리창청소', '아파트창문청소', '베란다 창틀청소', '외창 물때제거'],
  shop: ['상가 유리창청소', '매장 쇼윈도청소', '사무실 유리청소', '통유리 청소', '매장 외창청소'],
  building: ['빌딩 외벽청소', '고층 유리창청소', '외벽 고압세척', '건물 외벽청소', '로프 외벽청소'],
  sign: ['간판청소', '어닝청소', '간판 고압세척', '어닝 세척', '매장 간판청소'],
  film: ['시트지제거', '썬팅지제거', '유리창 필름제거', '유리 본드자국 제거', '매장 시트지제거'],
  special: ['유리 발수코팅', '유리 백화현상 제거', '조류 배설물 청소', '준공후 외창청소', '특수 유리창청소'],
};

const DOMAIN_TERM_PATTERNS = [
  '외창청소',
  '유리창청소',
  '통유리청소',
  '창틀청소',
  '샷시',
  '외벽청소',
  '고압세척',
  '간판청소',
  '어닝청소',
  '시트지제거',
  '썬팅제거',
  '필름제거',
  '발수코팅',
  '물때제거',
  '유막제거',
  '백화제거',
  '스카이차',
  '로프작업',
  '커튼월',
  '정기관리',
];

export function getSeoPageKey(route: PageRoute): string {
  switch (route.type) {
    case 'home':
      return 'home';
    case 'service':
      return `service:${route.serviceId}`;
    case 'region':
      return `region:${route.regionName}`;
    case 'matrix':
      return `matrix:${route.regionName}:${route.serviceId}`;
    case 'gallery_list':
      return 'gallery_list';
    case 'gallery_detail':
      return `gallery_detail:${route.postId}`;
  }
}

export function getRoutePath(route: PageRoute): string {
  switch (route.type) {
    case 'home':
      return '/';
    case 'service':
      return `/service/${encodeURIComponent(route.serviceId)}`;
    case 'region':
      return `/region/${encodeURIComponent(route.regionName)}`;
    case 'matrix':
      return `/region/${encodeURIComponent(route.regionName)}/service/${encodeURIComponent(route.serviceId)}`;
    case 'gallery_list':
      return '/gallery';
    case 'gallery_detail':
      return `/gallery/${encodeURIComponent(route.postId)}`;
  }
}

export function getRouteDisplayPath(route: PageRoute): string {
  switch (route.type) {
    case 'home':
      return '/';
    case 'service':
      return `/service/${route.serviceId}`;
    case 'region':
      return `/region/${route.regionName}`;
    case 'matrix':
      return `/region/${route.regionName}/service/${route.serviceId}`;
    case 'gallery_list':
      return '/gallery';
    case 'gallery_detail':
      return `/gallery/${route.postId}`;
  }
}

export function resolveEffectiveRoute(route: PageRoute, siteData: SiteData): PageRoute {
  if (route.type === 'service') {
    const matched =
      siteData.services.items.find((s) => s.id === route.serviceId) ?? siteData.services.items[0];
    return matched ? { type: 'service', serviceId: matched.id } : route;
  }
  if (route.type === 'matrix') {
    const matched =
      siteData.services.items.find((s) => s.id === route.serviceId) ?? siteData.services.items[0];
    const cleanRegion = route.regionName.trim();
    return matched
      ? { type: 'matrix', regionName: cleanRegion, serviceId: matched.id }
      : { ...route, regionName: cleanRegion };
  }
  if (route.type === 'region') {
    return { type: 'region', regionName: route.regionName.trim() };
  }
  if (route.type === 'gallery_detail') {
    const matched =
      siteData.gallery.posts.find((p) => p.id === route.postId) ?? siteData.gallery.posts[0];
    return matched ? { type: 'gallery_detail', postId: matched.id } : route;
  }
  return route;
}

export function getServiceSeoStems(serviceId: string, serviceTitle: string): string[] {
  const mapped = SERVICE_SEO_STEMS[serviceId];
  if (mapped) return mapped;
  if (serviceTitle.includes('아파트') || serviceTitle.includes('외창')) return SERVICE_SEO_STEMS['srv-1'];
  if (serviceTitle.includes('매장') || serviceTitle.includes('상가') || serviceTitle.includes('사무실')) {
    return SERVICE_SEO_STEMS['srv-2'];
  }
  if (serviceTitle.includes('빌딩') || serviceTitle.includes('외벽') || serviceTitle.includes('고층')) {
    return SERVICE_SEO_STEMS['srv-3'];
  }
  if (serviceTitle.includes('간판') || serviceTitle.includes('어닝')) return SERVICE_SEO_STEMS['srv-4'];
  if (serviceTitle.includes('시트지') || serviceTitle.includes('필름') || serviceTitle.includes('썬팅')) {
    return SERVICE_SEO_STEMS['srv-5'];
  }
  if (serviceTitle.includes('특수') || serviceTitle.includes('코팅') || serviceTitle.includes('백화')) {
    return SERVICE_SEO_STEMS['srv-6'];
  }
  const cleaned = serviceTitle
    .split(/[·,/()]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
  return Array.from(new Set([serviceTitle, ...cleaned, '유리창청소', '외벽청소'])).slice(0, 5);
}

function extractRegionAliases(regionName: string): string[] {
  const aliases = new Set<string>();
  const trimmed = regionName.trim();
  if (trimmed) aliases.add(trimmed);
  for (const part of trimmed.split(/[\s·,/]+/)) {
    const clean = part.trim();
    if (!clean) continue;
    aliases.add(clean);
    if (clean.length >= 3 && /[시군구]$/.test(clean)) {
      aliases.add(clean.slice(0, -1));
    }
  }
  return Array.from(aliases).filter((t) => t.length >= 2);
}

export function inferMetroPrefix(regionName: string): MetroRegionContext {
  const raw = regionName.trim();
  const aliases = extractRegionAliases(raw);
  const lastAlias = aliases[aliases.length - 1] || raw;
  const firstToken = raw.split(/\s+/)[0] || raw;

  let metroShort: '서울' | '경기' | '인천' = '경기';
  let metroFull: '서울특별시' | '경기도' | '인천광역시' = '경기도';

  if (raw.startsWith('서울') || SEOUL_DISTRICTS.has(firstToken) || SEOUL_DISTRICTS.has(raw)) {
    metroShort = '서울';
    metroFull = '서울특별시';
  } else if (raw.startsWith('인천')) {
    metroShort = '인천';
    metroFull = '인천광역시';
  }

  const displayRegion = raw.startsWith(metroShort) ? raw : `${metroShort} ${raw}`;
  const shortAlias =
    lastAlias === metroShort && aliases.length >= 2 ? aliases[aliases.length - 2] : lastAlias;

  return {
    raw,
    metroShort,
    metroFull,
    displayRegion,
    shortAlias,
    aliases,
  };
}

function extractServiceCorpusTerms(service: ServiceItem): string[] {
  const combined = [
    service.title,
    service.description,
    service.detail.targetAudience,
    ...(service.detail.scopeList ?? []),
    ...(service.detail.equipment ?? []),
  ]
    .join(' ')
    .replace(/\s+/g, '');

  const found: string[] = [];
  for (const term of DOMAIN_TERM_PATTERNS) {
    if (combined.includes(term.replace(/\s+/g, ''))) {
      found.push(term);
    }
  }
  return found;
}

function dedupeKeywords(items: string[], max = 14): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const clean = raw.replace(/\s+/g, ' ').trim();
    if (!clean || clean.length < 2) continue;
    const key = clean.replace(/\s+/g, '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= max) break;
  }
  return out.join(', ');
}

function clampText(text: string, maxLen: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const limit = Math.max(12, maxLen - 1);
  const sliced = clean.slice(0, limit);
  const lastBreak = Math.max(sliced.lastIndexOf(' '), sliced.lastIndexOf('·'), sliced.lastIndexOf(','));
  const cut = lastBreak >= Math.floor(limit * 0.6) ? sliced.slice(0, lastBreak) : sliced;
  return `${cut.replace(/[,·|/\\-]+$/, '').trim()}…`;
}

function clampTitle(core: string, suffix: string, maxLen = 58): string {
  const cleanCore = core.replace(/\s+/g, ' ').trim();
  const full = `${cleanCore}${suffix}`;
  if (full.length <= maxLen) return full;
  const avail = Math.max(16, maxLen - suffix.length);
  const sliced = cleanCore.slice(0, avail);
  const lastBreak = Math.max(sliced.lastIndexOf(' '), sliced.lastIndexOf('·'));
  const trimmedCore = (lastBreak >= Math.floor(avail * 0.55) ? sliced.slice(0, lastBreak) : sliced)
    .replace(/[,·|/\\-]+$/, '')
    .trim();
  return `${trimmedCore}${suffix}`;
}

function getSiteOrigin(siteData: Pick<SiteData, 'siteUrl'>): string {
  const configured = siteData.siteUrl?.trim().replace(/\/+$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
}

function collectServiceImageUrls(service: ServiceItem, siteData: SiteData): string[] {
  const origin = getSiteOrigin(siteData);
  const raw = [
    service.image,
    service.detail.afterImage,
    service.detail.beforeImage,
    siteData.seo?.defaultOgImage,
    siteData.hero.afterImage,
  ];
  const unique = Array.from(new Set(raw.map((u) => (u || '').trim()).filter(Boolean)));
  return unique.map((u) => (origin ? toAbsoluteUrl(u, origin) : u));
}

function buildServiceFaqEntities(
  service: ServiceItem,
  siteData: SiteData,
  regionContext?: { cleanRegion: string; subDistricts: string[]; leadTime: string }
): Array<Record<string, unknown>> {
  const prefix = regionContext ? `[${regionContext.cleanRegion}] ` : '';
  const baseFaqs = (service.detail.faqList ?? []).map((f) => ({
    '@type': 'Question',
    name: regionContext && !f.q.includes(regionContext.cleanRegion) ? `${prefix}${f.q}` : f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  }));

  const targetSubject = regionContext
    ? `${regionContext.cleanRegion} ${service.title}`
    : service.title;
  const supplemental: Array<{ q: string; a: string }> = [
    {
      q: `${targetSubject} 비용 및 견적 기준은 어떻게 되나요?`,
      a: `${service.detail.priceGuide}. ${siteData.company.name}은(는) 현장 사진 또는 무료 방문 실측을 통해 추가 비용 없는 투명한 확정 견적을 안내해 드립니다.`,
    },
    {
      q: `${targetSubject} 작업 시간과 A/S 보증은 어떻게 되나요?`,
      a: `${service.detail.duration}이며, 작업 완료 후 고객 검수 및 ${siteData.company.asPeriod}일 이내 무상 A/S와 영업배상책임보험을 보장합니다.`,
    },
  ];
  if (regionContext) {
    const areaText =
      regionContext.subDistricts.length > 0
        ? regionContext.subDistricts.join(', ')
        : `${regionContext.cleanRegion} 전지역`;
    supplemental.push({
      q: `${regionContext.cleanRegion} 어느 지역까지 ${service.title} 출장이 가능한가요?`,
      a: `${areaText} 전지역 직영 전담팀이 출장하며, ${regionContext.leadTime}으로 신속하게 방문 시공합니다.`,
    });
  }

  const existingNames = new Set(baseFaqs.map((item) => String(item.name)));
  for (const item of supplemental) {
    if (baseFaqs.length >= 4) break;
    if (!existingNames.has(item.q)) {
      baseFaqs.push({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      });
    }
  }
  return baseFaqs;
}

export function buildServicePageSeo(service: ServiceItem, siteData: SiteData): ResolvedSeoMeta {
  const { company, hero, regions } = siteData;
  const stems = getServiceSeoStems(service.id, service.title);
  const primaryStem = stems[0] || service.title;
  const secondaryStem = stems[1] || '유리창청소';
  const corpusTerms = extractServiceCorpusTerms(service);
  const sampleRegions = regions.list.slice(0, 3);
  const brandSuffix = ` | ${company.name}`;

  const title = clampTitle(`${service.title} 전문 · 서울 경기 인천`, brandSuffix, 58);
  const ogTitle = clampTitle(`${service.title} · 무료 출장견적`, brandSuffix, 48);

  const audienceText = service.detail.targetAudience
    ? service.detail.targetAudience.split(',').slice(0, 3).join('·').trim()
    : '';
  const summaryBody = service.description.replace(/\.$/, '').trim();
  const detailMeta = [service.detail.duration, service.detail.priceGuide]
    .filter(Boolean)
    .join(' · ');

  let description = `${service.title} 전문 ${company.name}. ${summaryBody}${
    audienceText ? ` (${audienceText})` : ''
  }. ${detailMeta ? `${detailMeta}. ` : ''}${company.region} 무료 출장견적·${company.asPeriod}일 A/S.`;
  description = clampText(description, 155);

  const keywords = dedupeKeywords(
    [
      service.title,
      ...stems,
      ...corpusTerms,
      `서울 ${primaryStem}`,
      `경기 ${primaryStem}`,
      `인천 ${primaryStem}`,
      ...sampleRegions.map((reg) => `${reg} ${primaryStem}`),
      `${primaryStem} 비용`,
      `${primaryStem} 견적`,
      `${secondaryStem} 업체`,
      company.name,
    ],
    14
  );

  const ogImage =
    siteData.seo?.defaultOgImage?.trim() ||
    service.image ||
    service.detail.afterImage ||
    hero.afterImage ||
    '';
  const routePath = getRoutePath({ type: 'service', serviceId: service.id });
  const routeHash = `#${routePath}`;
  const origin = getSiteOrigin(siteData);
  const canonicalPathOrUrl = origin ? `${origin}${routePath}` : routePath;

  const images = collectServiceImageUrls(service, siteData);
  const faqEntities = buildServiceFaqEntities(service, siteData);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${canonicalPathOrUrl}#service`,
        name: service.title,
        alternateName: stems,
        serviceType: service.title,
        category: '유리창청소·외벽청소 전문 시공',
        description,
        url: canonicalPathOrUrl,
        ...(images.length > 0 ? { image: images } : {}),
        audience: {
          '@type': 'Audience',
          audienceType: service.detail.targetAudience,
        },
        provider: {
          '@type': 'HomeAndConstructionBusiness',
          name: company.name,
          telephone: company.phone,
          priceRange: '₩₩',
          address: {
            '@type': 'PostalAddress',
            streetAddress: company.address,
            addressCountry: 'KR',
          },
          openingHours: company.operatingHours,
        },
        areaServed: [
          { '@type': 'AdministrativeArea', name: '서울특별시' },
          { '@type': 'AdministrativeArea', name: '경기도' },
          { '@type': 'AdministrativeArea', name: '인천광역시' },
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: `${service.title} 시공 범위`,
          itemListElement: service.detail.scopeList.map((scope, idx) => ({
            '@type': 'Offer',
            position: idx + 1,
            itemOffered: {
              '@type': 'Service',
              name: scope,
            },
          })),
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'KRW',
          description: service.detail.priceGuide,
          availability: 'https://schema.org/InStock',
        },
        additionalProperty: [
          { '@type': 'PropertyValue', name: '평균 소요 시간', value: service.detail.duration },
          { '@type': 'PropertyValue', name: '예상 견적 기준', value: service.detail.priceGuide },
          { '@type': 'PropertyValue', name: '무상 A/S 보증', value: `${company.asPeriod}일` },
          ...(service.detail.equipment.length > 0
            ? [
                {
                  '@type': 'PropertyValue',
                  name: '투입 전문 장비',
                  value: service.detail.equipment.join(', '),
                },
              ]
            : []),
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: origin ? `${origin}/` : '/' },
          { '@type': 'ListItem', position: 2, name: service.title, item: canonicalPathOrUrl },
        ],
      },
      ...(faqEntities.length > 0 ? [{ '@type': 'FAQPage', mainEntity: faqEntities }] : []),
    ],
  };

  return {
    pageKey: `service:${service.id}`,
    title,
    description,
    keywords,
    ogType: 'website',
    ogTitle,
    ogDescription: description,
    ogImage,
    geoRegion: 'KR',
    geoPlacename: company.region || '서울특별시 · 경기도 · 인천광역시',
    routeHash,
    routePath,
    jsonLd,
  };
}

function resolveMatchedService(
  services: ServiceItem[],
  selectedService?: ServiceItem | string
): ServiceItem | undefined {
  if (!selectedService) return undefined;
  if (typeof selectedService !== 'string') return selectedService;
  const query = selectedService.trim();
  if (!query) return undefined;
  return (
    services.find((s) => s.id === query || s.title === query) ??
    services.find((s) => s.title.includes(query) || query.includes(s.title))
  );
}

function buildRegionLocalBusinessNode(options: {
  canonicalUrl: string;
  cleanRegion: string;
  metro: MetroRegionContext;
  description: string;
  images: string[];
  subDistricts: string[];
  popularComplexes: string[];
  leadTime: string;
  notice?: string;
  siteData: SiteData;
  matchedService?: ServiceItem;
}): Record<string, unknown> {
  const {
    canonicalUrl,
    cleanRegion,
    metro,
    description,
    images,
    subDistricts,
    popularComplexes,
    leadTime,
    notice,
    siteData,
    matchedService,
  } = options;
  const { company, services } = siteData;
  const origin = getSiteOrigin(siteData);
  const localBusinessId = `${canonicalUrl}#localbusiness`;

  const areaServedPlaces: Array<Record<string, unknown>> = [
    { '@type': 'AdministrativeArea', name: metro.displayRegion },
    ...(metro.displayRegion !== cleanRegion
      ? [{ '@type': 'AdministrativeArea', name: cleanRegion }]
      : []),
    ...subDistricts.map((d) => ({
      '@type': 'Place',
      name: `${cleanRegion} ${d}`,
    })),
    ...popularComplexes.map((c) => ({
      '@type': 'Place',
      name: `${cleanRegion} ${c}`,
    })),
  ];

  const offerItems = matchedService
    ? matchedService.detail.scopeList.map((scope, idx) => ({
        '@type': 'Offer',
        position: idx + 1,
        itemOffered: {
          '@type': 'Service',
          name: `${cleanRegion} ${scope}`,
        },
      }))
    : services.items.map((srv, idx) => ({
        '@type': 'Offer',
        position: idx + 1,
        priceCurrency: 'KRW',
        description: srv.detail.priceGuide,
        itemOffered: {
          '@type': 'Service',
          name: `${cleanRegion} ${srv.title}`,
          description: srv.description,
          url: origin
            ? `${origin}${getRoutePath({ type: 'matrix', regionName: cleanRegion, serviceId: srv.id })}`
            : getRoutePath({ type: 'matrix', regionName: cleanRegion, serviceId: srv.id }),
        },
      }));

  const sameAsLinks = [
    origin || undefined,
    company.kakaoLink && company.kakaoLink.startsWith('http') && company.kakaoLink !== 'https://open.kakao.com'
      ? company.kakaoLink
      : undefined,
  ].filter((v): v is string => Boolean(v));

  return {
    '@type': ['HomeAndConstructionBusiness', 'LocalBusiness'],
    '@id': localBusinessId,
    name: company.name,
    alternateName: Array.from(
      new Set([
        `${company.name} ${cleanRegion}`,
        `${metro.displayRegion} ${company.name}`,
        `${metro.shortAlias} 유리창청소 ${company.name}`,
        ...(matchedService ? [`${cleanRegion} ${matchedService.title} ${company.name}`] : []),
      ])
    ),
    description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    ...(images.length > 0 ? { image: images } : {}),
    telephone: company.phone,
    priceRange: '₩₩',
    currenciesAccepted: 'KRW',
    paymentAccepted: '현금, 계좌이체, 카드결제, 세금계산서',
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address,
      addressCountry: 'KR',
    },
    areaServed: areaServedPlaces,
    serviceArea: {
      '@type': 'AdministrativeArea',
      name:
        subDistricts.length > 0
          ? `${metro.displayRegion} 전지역 (${subDistricts.slice(0, 6).join(', ')})`
          : `${metro.displayRegion} 전지역`,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: company.phone,
      contactType: 'customer service',
      areaServed: 'KR',
      availableLanguage: ['Korean'],
    },
    openingHours: company.operatingHours,
    ...(sameAsLinks.length > 0 ? { sameAs: sameAsLinks } : {}),
    knowsAbout: Array.from(
      new Set([
        '유리창청소',
        '아파트 외창청소',
        '상가 유리창청소',
        '빌딩 외벽청소',
        '간판·어닝청소 고압세척',
        '시트지 제거',
        '유리 발수코팅',
        ...subDistricts.slice(0, 5),
      ])
    ),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: matchedService
        ? `${cleanRegion} ${matchedService.title} 시공 범위`
        : `${cleanRegion} 전문 유리창·외벽 청소 서비스`,
      itemListElement: offerItems,
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: '출장 방문 지역', value: metro.displayRegion },
      { '@type': 'PropertyValue', name: '방문 실측 일정', value: leadTime },
      { '@type': 'PropertyValue', name: '무상 A/S 보증', value: `${company.asPeriod}일` },
      { '@type': 'PropertyValue', name: '배상책임보험', value: '영업배상책임보험 1억원 가입' },
      ...(popularComplexes.length > 0
        ? [
            {
              '@type': 'PropertyValue',
              name: '주요 출장 단지·상권',
              value: popularComplexes.join(', '),
            },
          ]
        : []),
      ...(notice ? [{ '@type': 'PropertyValue', name: '지역 안내 혜택', value: notice }] : []),
    ],
  };
}

function buildRegionFaqEntities(options: {
  cleanRegion: string;
  metro: MetroRegionContext;
  subDistricts: string[];
  popularComplexes: string[];
  leadTime: string;
  notice?: string;
  siteData: SiteData;
}): Array<Record<string, unknown>> {
  const { cleanRegion, metro, subDistricts, popularComplexes, leadTime, notice, siteData } = options;
  const { company, faq } = siteData;
  const areaText =
    subDistricts.length > 0 ? subDistricts.join(', ') : `${metro.displayRegion} 전지역`;
  const complexText =
    popularComplexes.length > 0 ? ` (${popularComplexes.slice(0, 3).join(', ')} 등)` : '';

  const regionalFaqs: Array<{ q: string; a: string }> = [
    {
      q: `${cleanRegion} 어느 지역까지 출장 유리창청소가 가능한가요?`,
      a: `${areaText}${complexText} 전지역 직영 전담팀이 출장하며, ${leadTime} 일정으로 무료 방문 실측 및 시공이 가능합니다.`,
    },
    {
      q: `${cleanRegion} 유리창·외창청소 비용은 어떻게 산정되나요?`,
      a: `창문 수량과 유리 면적, 오염 정도(물때·백시멘트 등), 작업 높이를 기준으로 산정됩니다. 아파트 외창은 24~34평 기준 240,000원~, 상가 통유리는 ㎡당 8,000원~ 기준이며 사진 또는 무료 방문 견적을 안내해 드립니다.`,
    },
    {
      q: `${cleanRegion} 고층 작업 시 아래층 물 피해나 배상보험·A/S는 어떻게 되나요?`,
      a: `${company.name}은(는) 고밀도 거품 도포 후 스퀴지로 즉시 회수하는 무낙수 공법과 흡수 보양 매트를 사용하며, 1억원 영업배상책임보험 가입 및 시공 후 ${company.asPeriod}일 이내 무상 A/S를 보장합니다.`,
    },
    ...(notice
      ? [
          {
            q: `${cleanRegion} 지역 공동구매나 추가 혜택 안내가 있나요?`,
            a: `${notice}. 자세한 할인 조건은 전화(${company.phone}) 또는 카카오톡 상담 시 바로 안내받으실 수 있습니다.`,
          },
        ]
      : []),
    ...(faq.items.slice(0, 2).map((item) => ({
      q: item.question.includes(cleanRegion) ? item.question : `[${cleanRegion}] ${item.question}`,
      a: item.answer,
    }))),
  ];

  return regionalFaqs.slice(0, 5).map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  }));
}

export function buildRegionPageSeo(
  regionName: string,
  siteData: SiteData,
  selectedService?: ServiceItem | string
): ResolvedSeoMeta {
  const { company, hero, services, regions } = siteData;
  const cleanRegion = regionName.trim();
  const metro = inferMetroPrefix(cleanRegion);
  const detail = regions.details[cleanRegion];
  const subDistricts = detail?.subDistricts ?? [];
  const popularComplexes = detail?.popularComplexes ?? [];
  const brandSuffix = ` | ${company.name}`;
  const matchedService = resolveMatchedService(services.items, selectedService);
  const customServiceLabel =
    !matchedService && typeof selectedService === 'string' && selectedService.trim()
      ? selectedService.trim()
      : '';

  const geoRegion =
    metro.metroShort === '서울' ? 'KR-11' : metro.metroShort === '인천' ? 'KR-28' : 'KR-41';
  const routePath = getRoutePath({ type: 'region', regionName: cleanRegion });
  const routeHash = `#${routePath}`;
  const origin = getSiteOrigin(siteData);
  const canonicalPathOrUrl = origin ? `${origin}${routePath}` : routePath;
  const homePathOrUrl = origin ? `${origin}/` : '/';
  const leadTime = detail?.leadTime || '당일·익일 무료 방문 견적';

  if (matchedService) {
    const stems = getServiceSeoStems(matchedService.id, matchedService.title);
    const primaryStem = stems[0] || matchedService.title;
    const secondaryStem = stems[1] || '유리창청소';
    const corpusTerms = extractServiceCorpusTerms(matchedService);
    const includeGlassTerm =
      !matchedService.title.includes('유리창') && !primaryStem.includes('유리창');

    const titleCore = includeGlassTerm
      ? `${metro.displayRegion} ${matchedService.title}·유리창청소 전문`
      : `${metro.displayRegion} ${matchedService.title} 전문`;
    const title = clampTitle(titleCore, brandSuffix, 58);
    const ogTitle = clampTitle(`${metro.displayRegion} ${primaryStem} · 무료 견적`, brandSuffix, 48);

    const areaList = subDistricts.length > 0 ? `(${subDistricts.slice(0, 3).join('·')})` : '전지역';
    const complexHighlight =
      popularComplexes.length > 0 ? ` ${popularComplexes.slice(0, 2).join('·')} 출장.` : '';
    const descBody = `${metro.displayRegion} ${areaList} ${matchedService.title} 직영 시공.${complexHighlight} ${matchedService.description} ${leadTime} · ${matchedService.detail.priceGuide} · ${company.asPeriod}일 A/S.`;
    const description = clampText(descBody, 155);

    const keywords = dedupeKeywords(
      [
        `${cleanRegion} ${primaryStem}`,
        `${metro.displayRegion} ${primaryStem}`,
        `${cleanRegion} ${matchedService.title}`,
        metro.shortAlias !== cleanRegion ? `${metro.shortAlias} ${primaryStem}` : '',
        `${cleanRegion} ${secondaryStem}`,
        `${cleanRegion} 유리창청소`,
        ...subDistricts.slice(0, 3).map((d) => `${d} ${primaryStem}`),
        ...popularComplexes.slice(0, 2).map((c) => `${c} ${primaryStem}`),
        ...corpusTerms.slice(0, 2).map((term) => `${cleanRegion} ${term}`),
        `${cleanRegion} ${primaryStem} 비용`,
        `${cleanRegion} ${primaryStem} 견적`,
        company.name,
      ],
      14
    );

    const ogImage =
      siteData.seo?.defaultOgImage?.trim() ||
      matchedService.image ||
      matchedService.detail.afterImage ||
      hero.afterImage ||
      '';
    const images = collectServiceImageUrls(matchedService, siteData);
    const localBusinessNode = buildRegionLocalBusinessNode({
      canonicalUrl: canonicalPathOrUrl,
      cleanRegion,
      metro,
      description,
      images,
      subDistricts,
      popularComplexes,
      leadTime,
      notice: detail?.notice,
      siteData,
      matchedService,
    });
    const faqEntities = buildServiceFaqEntities(matchedService, siteData, {
      cleanRegion,
      subDistricts,
      leadTime,
    });

    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@graph': [
        localBusinessNode,
        {
          '@type': 'Service',
          '@id': `${canonicalPathOrUrl}#service`,
          name: `${metro.displayRegion} ${matchedService.title}`,
          serviceType: matchedService.title,
          description,
          url: canonicalPathOrUrl,
          ...(images.length > 0 ? { image: images } : {}),
          areaServed: {
            '@type': 'AdministrativeArea',
            name: metro.displayRegion,
            ...(subDistricts.length > 0
              ? { containsPlace: subDistricts.map((d) => ({ '@type': 'Place', name: d })) }
              : {}),
          },
          provider: {
            '@id': `${canonicalPathOrUrl}#localbusiness`,
          },
          offers: {
            '@type': 'Offer',
            priceCurrency: 'KRW',
            description: `${leadTime} · ${matchedService.detail.priceGuide}`,
            availability: 'https://schema.org/InStock',
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: '홈', item: homePathOrUrl },
            {
              '@type': 'ListItem',
              position: 2,
              name: `${cleanRegion} ${matchedService.title}`,
              item: canonicalPathOrUrl,
            },
          ],
        },
        ...(faqEntities.length > 0 ? [{ '@type': 'FAQPage', mainEntity: faqEntities }] : []),
      ],
    };

    return {
      pageKey: `region:${cleanRegion}`,
      title,
      description,
      keywords,
      ogType: 'website',
      ogTitle,
      ogDescription: description,
      ogImage,
      geoRegion,
      geoPlacename: metro.displayRegion,
      routeHash,
      routePath,
      jsonLd,
    };
  }

  const serviceStems = services.items
    .slice(0, 4)
    .map((s) => getServiceSeoStems(s.id, s.title)[0] || s.title);
  const titleServiceTokens = dedupeKeywords(
    [customServiceLabel, '유리창청소', ...serviceStems.slice(0, 3)].filter(Boolean),
    3
  ).replace(/, /g, '·');

  const title = clampTitle(`${metro.displayRegion} ${titleServiceTokens} 전문`, brandSuffix, 58);
  const ogTitle = clampTitle(
    `${metro.displayRegion} ${customServiceLabel || '유리창청소'} · 무료 출장견적`,
    brandSuffix,
    48
  );

  const serviceHighlight = serviceStems.slice(0, 3).join('·') || '유리창청소·외창·외벽청소';

  let description: string;
  if (detail) {
    const areaList = subDistricts.length > 0 ? `(${subDistricts.slice(0, 4).join('·')})` : '';
    const complexSnippet =
      popularComplexes.length > 0 ? ` ${popularComplexes.slice(0, 2).join('·')} 등` : '';
    description = `${metro.displayRegion}${areaList} ${detail.description}.${complexSnippet} ${
      customServiceLabel ? `${customServiceLabel} · ` : ''
    }${serviceHighlight} 직영 시공, ${detail.leadTime}. 배상보험·${company.asPeriod}일 A/S.`;
  } else {
    description = `${metro.metroFull} ${cleanRegion} 전지역 ${
      customServiceLabel ? `${customServiceLabel}·` : ''
    }${serviceHighlight}·간판·어닝청소 전문 ${company.name}. ${leadTime}, 배상책임보험·${company.asPeriod}일 A/S 보장.`;
  }
  description = clampText(description, 155);

  const keywords = dedupeKeywords(
    [
      `${cleanRegion} 유리창청소`,
      `${metro.displayRegion} 유리창청소`,
      customServiceLabel ? `${cleanRegion} ${customServiceLabel}` : '',
      metro.shortAlias !== cleanRegion ? `${metro.shortAlias} 유리창청소` : '',
      `${cleanRegion} 외창청소`,
      `${cleanRegion} 외벽청소`,
      ...services.items.slice(0, 5).map((srv) => {
        const stem = getServiceSeoStems(srv.id, srv.title)[0] || srv.title;
        return `${cleanRegion} ${stem}`;
      }),
      ...subDistricts.slice(0, 3).map((d) => `${d} 유리창청소`),
      ...popularComplexes.slice(0, 2).map((c) => `${c} 외창청소`),
      `${cleanRegion} 유리창청소 비용`,
      `${cleanRegion} 청소업체`,
      company.name,
    ],
    14
  );

  const ogImage = siteData.seo?.defaultOgImage?.trim() || hero.afterImage || '';
  const regionImages = Array.from(
    new Set(
      [ogImage, hero.afterImage, services.items[0]?.detail.afterImage]
        .map((u) => (u || '').trim())
        .filter(Boolean)
    )
  ).map((u) => (origin ? toAbsoluteUrl(u, origin) : u));

  const localBusinessNode = buildRegionLocalBusinessNode({
    canonicalUrl: canonicalPathOrUrl,
    cleanRegion,
    metro,
    description,
    images: regionImages,
    subDistricts,
    popularComplexes,
    leadTime,
    notice: detail?.notice,
    siteData,
  });

  const faqEntities = buildRegionFaqEntities({
    cleanRegion,
    metro,
    subDistricts,
    popularComplexes,
    leadTime,
    notice: detail?.notice,
    siteData,
  });

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      localBusinessNode,
      {
        '@type': 'Service',
        '@id': `${canonicalPathOrUrl}#service`,
        name: `${metro.displayRegion} 유리창청소·외창청소 전문`,
        serviceType: '유리창청소·외벽청소 전문 시공',
        description,
        url: canonicalPathOrUrl,
        ...(regionImages.length > 0 ? { image: regionImages } : {}),
        areaServed: {
          '@type': 'AdministrativeArea',
          name: metro.displayRegion,
          ...(subDistricts.length > 0
            ? { containsPlace: subDistricts.map((d) => ({ '@type': 'Place', name: d })) }
            : {}),
        },
        provider: {
          '@id': `${canonicalPathOrUrl}#localbusiness`,
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'KRW',
          description: `${leadTime} · 무료 방문 견적 · ${company.asPeriod}일 무상 A/S`,
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: homePathOrUrl },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${cleanRegion} 서비스 지역`,
            item: canonicalPathOrUrl,
          },
        ],
      },
      ...(faqEntities.length > 0 ? [{ '@type': 'FAQPage', mainEntity: faqEntities }] : []),
    ],
  };

  return {
    pageKey: `region:${cleanRegion}`,
    title,
    description,
    keywords,
    ogType: 'website',
    ogTitle,
    ogDescription: description,
    ogImage,
    geoRegion,
    geoPlacename: metro.displayRegion,
    routeHash,
    routePath,
    jsonLd,
  };
}

export function buildMatrixPageSeo(
  regionName: string,
  service: ServiceItem,
  siteData: SiteData,
  regionDetailOverride?: RegionDetail
): ResolvedSeoMeta {
  const { company, hero, regions } = siteData;
  const cleanRegion = regionName.trim();
  const metro = inferMetroPrefix(cleanRegion);
  const detail = regionDetailOverride ?? regions.details[cleanRegion];
  const subDistricts = detail?.subDistricts ?? [];
  const popularComplexes = detail?.popularComplexes ?? [];
  const stems = getServiceSeoStems(service.id, service.title);
  const primaryStem = stems[0] || service.title;
  const secondaryStem = stems[1] || '유리창청소';
  const corpusTerms = extractServiceCorpusTerms(service);
  const leadTime = detail?.leadTime || '당일·익일 무료 방문 견적';
  const brandSuffix = ` | ${company.name}`;

  const includeGlassTerm =
    !service.title.includes('유리창') && !primaryStem.includes('유리창');
  const titleCore = includeGlassTerm
    ? `${metro.displayRegion} ${service.title}·유리창청소 전문`
    : `${metro.displayRegion} ${service.title} 전문`;
  const title = clampTitle(titleCore, brandSuffix, 58);
  const ogTitle = clampTitle(`${metro.displayRegion} ${primaryStem} · 무료 견적`, brandSuffix, 48);

  const areaSnippet = subDistricts.length > 0 ? `(${subDistricts.slice(0, 3).join('·')})` : '전지역';
  const complexSnippet =
    popularComplexes.length > 0 ? ` ${popularComplexes.slice(0, 2).join('·')} 출장.` : '';
  const descBody = `${metro.displayRegion} ${areaSnippet} ${service.title} 직영 출장.${complexSnippet} ${service.description} ${leadTime} · ${service.detail.priceGuide} · ${company.asPeriod}일 A/S.`;
  const description = clampText(descBody, 155);

  const keywords = dedupeKeywords(
    [
      `${cleanRegion} ${primaryStem}`,
      `${metro.displayRegion} ${primaryStem}`,
      `${cleanRegion} ${service.title}`,
      metro.shortAlias !== cleanRegion ? `${metro.shortAlias} ${primaryStem}` : '',
      `${cleanRegion} ${secondaryStem}`,
      `${cleanRegion} 유리창청소`,
      ...subDistricts.slice(0, 3).map((d) => `${d} ${primaryStem}`),
      ...popularComplexes.slice(0, 2).map((c) => `${c} ${primaryStem}`),
      ...corpusTerms.slice(0, 2).map((term) => `${cleanRegion} ${term}`),
      `${cleanRegion} ${primaryStem} 비용`,
      `${cleanRegion} ${primaryStem} 견적`,
      `${cleanRegion} ${primaryStem} 업체`,
      company.name,
    ],
    14
  );

  const ogImage =
    siteData.seo?.defaultOgImage?.trim() ||
    service.image ||
    service.detail.afterImage ||
    hero.afterImage ||
    '';
  const routePath = getRoutePath({ type: 'matrix', regionName: cleanRegion, serviceId: service.id });
  const routeHash = `#${routePath}`;
  const origin = getSiteOrigin(siteData);
  const canonicalPathOrUrl = origin ? `${origin}${routePath}` : routePath;
  const regionPathOrUrl = origin
    ? `${origin}${getRoutePath({ type: 'region', regionName: cleanRegion })}`
    : getRoutePath({ type: 'region', regionName: cleanRegion });

  const images = collectServiceImageUrls(service, siteData);
  const localBusinessNode = buildRegionLocalBusinessNode({
    canonicalUrl: canonicalPathOrUrl,
    cleanRegion,
    metro,
    description,
    images,
    subDistricts,
    popularComplexes,
    leadTime,
    notice: detail?.notice,
    siteData,
    matchedService: service,
  });
  const faqEntities = buildServiceFaqEntities(service, siteData, {
    cleanRegion,
    subDistricts,
    leadTime,
  });

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@graph': [
      localBusinessNode,
      {
        '@type': 'Service',
        '@id': `${canonicalPathOrUrl}#service`,
        name: `${metro.displayRegion} ${service.title}`,
        alternateName: [`${cleanRegion} ${primaryStem}`, `${metro.displayRegion} ${primaryStem}`],
        serviceType: service.title,
        category: `${cleanRegion} 유리창청소·외벽청소`,
        description,
        url: canonicalPathOrUrl,
        ...(images.length > 0 ? { image: images } : {}),
        audience: {
          '@type': 'Audience',
          audienceType: `${cleanRegion} ${service.detail.targetAudience}`,
        },
        areaServed: {
          '@type': 'AdministrativeArea',
          name: metro.displayRegion,
          ...(subDistricts.length > 0
            ? { containsPlace: subDistricts.map((d) => ({ '@type': 'Place', name: d })) }
            : {}),
        },
        provider: {
          '@id': `${canonicalPathOrUrl}#localbusiness`,
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: `${cleanRegion} ${service.title} 작업 범위`,
          itemListElement: service.detail.scopeList.map((scope, idx) => ({
            '@type': 'Offer',
            position: idx + 1,
            itemOffered: {
              '@type': 'Service',
              name: `${cleanRegion} ${scope}`,
            },
          })),
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'KRW',
          description: `${leadTime} · ${service.detail.priceGuide}`,
          availability: 'https://schema.org/InStock',
        },
        additionalProperty: [
          { '@type': 'PropertyValue', name: '출장 방문 일정', value: leadTime },
          { '@type': 'PropertyValue', name: '평균 소요 시간', value: service.detail.duration },
          { '@type': 'PropertyValue', name: '예상 견적 기준', value: service.detail.priceGuide },
          { '@type': 'PropertyValue', name: '무상 A/S 보증', value: `${company.asPeriod}일` },
          ...(popularComplexes.length > 0
            ? [
                {
                  '@type': 'PropertyValue',
                  name: '주요 출장 단지·상권',
                  value: popularComplexes.join(', '),
                },
              ]
            : []),
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: origin ? `${origin}/` : '/' },
          {
            '@type': 'ListItem',
            position: 2,
            name: cleanRegion,
            item: regionPathOrUrl,
          },
          { '@type': 'ListItem', position: 3, name: `${cleanRegion} ${service.title}`, item: canonicalPathOrUrl },
        ],
      },
      ...(faqEntities.length > 0 ? [{ '@type': 'FAQPage', mainEntity: faqEntities }] : []),
    ],
  };

  const geoRegion =
    metro.metroShort === '서울' ? 'KR-11' : metro.metroShort === '인천' ? 'KR-28' : 'KR-41';

  return {
    pageKey: `matrix:${cleanRegion}:${service.id}`,
    title,
    description,
    keywords,
    ogType: 'website',
    ogTitle,
    ogDescription: description,
    ogImage,
    geoRegion,
    geoPlacename: metro.displayRegion,
    routeHash,
    routePath,
    jsonLd,
  };
}

export function getDefaultSeoForRoute(
  route: PageRoute,
  siteData: SiteData = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  const effectiveRoute = resolveEffectiveRoute(route, siteData);
  const { company, hero, services, gallery } = siteData;
  const regionText = company.region.replace(/·/g, ' ');
  const pageKey = getSeoPageKey(effectiveRoute);

  if (effectiveRoute.type === 'service') {
    const service =
      services.items.find((s) => s.id === effectiveRoute.serviceId) ?? services.items[0];
    if (service) {
      return buildServicePageSeo(service, siteData);
    }
  } else if (effectiveRoute.type === 'region') {
    return buildRegionPageSeo(effectiveRoute.regionName, siteData);
  } else if (effectiveRoute.type === 'matrix') {
    const service =
      services.items.find((s) => s.id === effectiveRoute.serviceId) ?? services.items[0];
    if (service) {
      return buildMatrixPageSeo(effectiveRoute.regionName, service, siteData);
    }
  }

  let title = `${regionText} 유리창청소·외벽청소 전문 | ${company.name}`;
  let description = `${company.region} 아파트·상가·빌딩 유리창청소와 건물 외벽청소 전문 ${company.name}. 간판·어닝청소 고압세척, 시트지제거까지 프리미엄 청소전문업체.`;
  let keywords = `${company.name}, ${regionText} 유리창청소, 아파트외창청소, 외벽청소, 상가유리창청소, 빌딩외벽청소`;
  let ogTitle = '';
  let ogImage = siteData.seo?.defaultOgImage?.trim() || hero.afterImage || '';
  let routeHash = '';
  let routePath = '/';
  let jsonLd: Record<string, unknown> | null = null;

  if (effectiveRoute.type === 'gallery_list') {
    title = `현장 작업 갤러리 & 시공사례 | ${company.name}`;
    description =
      '아파트 외창, 상가 통유리, 빌딩 외벽 고소작업, 간판·어닝청소, 썬팅 시트지 제거 실제 시공 일지.';
    keywords = `${company.name} 시공사례, 유리창청소 전후, 외벽청소 후기, 아파트 외창청소 사례`;
    routePath = '/gallery';
    routeHash = '#/gallery';
  } else if (effectiveRoute.type === 'gallery_detail') {
    const post =
      gallery.posts.find((p) => p.id === effectiveRoute.postId) ?? gallery.posts[0];
    if (post) {
      const autoSeo = generateNaverSeoFromPost(post, company.name);
      const useStored = post.seo && post.seo.autoSync === false;
      title =
        (useStored ? post.seo?.title?.trim() : post.seo?.title?.trim() || autoSeo.title) ||
        autoSeo.title;
      description =
        (useStored
          ? post.seo?.description?.trim()
          : post.seo?.description?.trim() || autoSeo.description) || autoSeo.description;
      ogTitle =
        (useStored
          ? post.seo?.ogTitle?.trim()
          : post.seo?.ogTitle?.trim() || autoSeo.ogTitle) || autoSeo.ogTitle;
      keywords =
        (useStored
          ? post.seo?.keywords?.trim()
          : post.seo?.keywords?.trim() || autoSeo.keywords) || autoSeo.keywords;
      ogImage =
        post.coverImage ||
        post.afterImage ||
        siteData.seo?.defaultOgImage?.trim() ||
        hero.afterImage ||
        '';
      routePath = getRoutePath({ type: 'gallery_detail', postId: post.id });
      routeHash = `#${routePath}`;
      const blockImages = (post.blocks ?? [])
        .filter((b): b is Extract<typeof b, { type: 'image' }> => b.type === 'image')
        .map((b) => b.url)
        .filter(Boolean);
      const images = Array.from(
        new Set([ogImage, ...blockImages, post.afterImage, post.beforeImage].filter(Boolean))
      );
      const publishedIso = post.date.replace(/\./g, '-');
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description,
        articleSection: post.category,
        keywords,
        datePublished: publishedIso,
        dateModified: publishedIso,
        image: images,
        articleBody: post.content,
        author: {
          '@type': 'Person',
          name: post.author || company.name,
        },
        publisher: {
          '@type': 'Organization',
          name: company.name,
        },
      };
    }
  } else {
    keywords = DEFAULT_HOME_KEYWORDS.replace(/클리어웍스/g, company.name);
  }

  return {
    pageKey,
    title,
    description,
    keywords,
    ogType: effectiveRoute.type === 'gallery_detail' ? 'article' : 'website',
    ogTitle: ogTitle || title,
    ogDescription: description,
    ogImage,
    geoRegion: 'KR',
    geoPlacename: company.region || '서울특별시 · 경기도 · 인천광역시',
    routeHash,
    routePath,
    jsonLd,
  };
}

function applySeoOverride(
  defaults: ResolvedSeoMeta,
  override: PageSeoMeta | undefined,
  siteData: SiteData
): ResolvedSeoMeta {
  const title = override?.title?.trim() || defaults.title;
  const description = override?.description?.trim() || defaults.description;
  const keywords = override?.keywords?.trim() || defaults.keywords;
  const ogTitle =
    override?.ogTitle?.trim() ||
    (override?.title?.trim() ? override.title.trim() : defaults.ogTitle);
  const ogDescription = override?.ogDescription?.trim() || description;
  const ogImage =
    override?.ogImage?.trim() || siteData.seo?.defaultOgImage?.trim() || defaults.ogImage;

  return {
    ...defaults,
    title,
    description,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
  };
}

export function resolveSeoForRoute(
  route: PageRoute,
  siteData: SiteData = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  const defaults = getDefaultSeoForRoute(route, siteData);
  const override: PageSeoMeta | undefined = siteData.seo?.pages?.[defaults.pageKey];
  return applySeoOverride(defaults, override, siteData);
}

export function resolveServiceDynamicSeo(
  service: ServiceItem,
  siteData: SiteData = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  const defaults = buildServicePageSeo(service, siteData);
  const override: PageSeoMeta | undefined = siteData.seo?.pages?.[defaults.pageKey];
  return applySeoOverride(defaults, override, siteData);
}

export function resolveMatrixDynamicSeo(
  regionName: string,
  service: ServiceItem,
  siteData: SiteData = INITIAL_SITE_DATA,
  regionDetailOverride?: RegionDetail
): ResolvedSeoMeta {
  const defaults = buildMatrixPageSeo(regionName, service, siteData, regionDetailOverride);
  const override: PageSeoMeta | undefined = siteData.seo?.pages?.[defaults.pageKey];
  return applySeoOverride(defaults, override, siteData);
}

export function resolveRegionDynamicSeo(
  regionName: string,
  siteData: SiteData = INITIAL_SITE_DATA,
  selectedService?: ServiceItem | string
): ResolvedSeoMeta {
  const cleanRegion = regionName.trim();
  const matchedService = resolveMatchedService(siteData.services.items, selectedService);
  const defaults = buildRegionPageSeo(cleanRegion, siteData, matchedService ?? selectedService);

  const matrixOverride = matchedService
    ? siteData.seo?.pages?.[`matrix:${cleanRegion}:${matchedService.id}`]
    : undefined;
  const regionOverride = !matchedService
    ? siteData.seo?.pages?.[`region:${cleanRegion}`]
    : undefined;
  return applySeoOverride(defaults, matrixOverride || regionOverride, siteData);
}

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaTag(selector: string) {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) el.remove();
}

function setCanonical(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setDynamicJsonLd(data: Record<string, unknown> | null) {
  const existing = document.getElementById('ld-dynamic');
  if (existing) existing.remove();
  if (!data) return;

  const script = document.createElement('script');
  script.id = 'ld-dynamic';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function setArticleTags(tags: string[]) {
  document.querySelectorAll('meta[property="article:tag"]').forEach((el) => el.remove());
  for (const tag of tags) {
    const meta = document.createElement('meta');
    meta.setAttribute('property', 'article:tag');
    meta.setAttribute('content', tag);
    document.head.appendChild(meta);
  }
}

function toAbsoluteUrl(urlOrPath: string, origin: string): string {
  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  if (!origin) return trimmed;
  return `${origin.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;
}

export function applyResolvedSeoMeta(
  resolved: ResolvedSeoMeta,
  siteData: Pick<SiteData, 'company'> & Partial<Pick<SiteData, 'siteUrl'>> = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  if (typeof document === 'undefined') {
    return resolved;
  }

  const origin =
    siteData.siteUrl?.trim().replace(/\/+$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  document.title = resolved.title;
  setMetaTag('meta[name="description"]', 'name', 'description', resolved.description);
  setMetaTag('meta[name="keywords"]', 'name', 'keywords', resolved.keywords);
  setMetaTag(
    'meta[property="og:site_name"]',
    'property',
    'og:site_name',
    siteData.company?.name || INITIAL_SITE_DATA.company.name
  );
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', resolved.ogType);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', resolved.ogTitle);
  setMetaTag(
    'meta[property="og:description"]',
    'property',
    'og:description',
    resolved.ogDescription
  );
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', resolved.ogTitle);
  setMetaTag(
    'meta[name="twitter:description"]',
    'name',
    'twitter:description',
    resolved.ogDescription
  );

  if (resolved.geoRegion) {
    setMetaTag('meta[name="geo.region"]', 'name', 'geo.region', resolved.geoRegion);
  } else {
    removeMetaTag('meta[name="geo.region"]');
  }
  if (resolved.geoPlacename) {
    setMetaTag('meta[name="geo.placename"]', 'name', 'geo.placename', resolved.geoPlacename);
  } else {
    removeMetaTag('meta[name="geo.placename"]');
  }

  const ogImageUrl = toAbsoluteUrl(resolved.ogImage, origin);
  if (ogImageUrl) {
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImageUrl);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImageUrl);
  } else {
    removeMetaTag('meta[property="og:image"]');
    removeMetaTag('meta[name="twitter:image"]');
  }

  const useCleanUrls = (import.meta.env?.BASE_URL || '/') === '/';
  const canonicalUrl = useCleanUrls
    ? `${origin}${resolved.routePath}`
    : `${origin}${pathname}${resolved.routeHash}`;
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  setCanonical(canonicalUrl);
  setArticleTags(
    resolved.pageKey.startsWith('gallery_detail:') ? parseSeoKeywords(resolved.keywords, 10) : []
  );
  setDynamicJsonLd(resolved.jsonLd);

  return resolved;
}

export function applySeoForRoute(
  route: PageRoute,
  siteData: SiteData = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  const effectiveRoute = resolveEffectiveRoute(route, siteData);
  const resolved = resolveSeoForRoute(effectiveRoute, siteData);
  return applyResolvedSeoMeta(resolved, siteData);
}

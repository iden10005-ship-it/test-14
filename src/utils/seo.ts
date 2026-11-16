import { INITIAL_SITE_DATA } from '@/src/data/clearworksData';
import type { PageRoute, PageSeoMeta, SiteData } from '@/src/types/clearworks';
import { generateNaverSeoFromPost, parseSeoKeywords } from '@/src/utils/naverSeoGenerator';

export const DEFAULT_HOME_KEYWORDS =
  '유리창청소, 아파트외창청소, 외벽청소, 상가유리창청소, 빌딩외벽청소, 고층유리창청소, 서울유리창청소, 경기유리창청소, 인천유리창청소, 창틀청소, 유리발수코팅, 어닝청소, 클리어웍스, 서울 건물 외벽청소 업체, 수도권 상가 유리창청소, 경기 아파트 외창청소 업체, 빌딩 외벽 고압세척, 상가 간판 어닝청소, 매장 유리 시트지 제거, 아파트 외창청소 비용 견적, 상가 유리창 정기청소 비용, 건물 외벽청소 견적 문의, 클리어웍스 유리창청소 후기';

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

export interface ResolvedSeoMeta {
  pageKey: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  routeHash: string;
  routePath: string;
  jsonLd: Record<string, unknown> | null;
}

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

function getServiceSeoStems(serviceId: string, serviceTitle: string): string[] {
  const mapped = SERVICE_SEO_STEMS[serviceId];
  if (mapped) return mapped;
  if (serviceTitle.includes('아파트')) return SERVICE_SEO_STEMS['srv-1'];
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

function dedupeKeywords(items: string[], max = 12): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const clean = raw.replace(/\s+/g, ' ').trim();
    if (!clean || clean.length < 2) continue;
    const key = clean.toLowerCase();
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
  return `${clean.slice(0, maxLen - 1).trim()}…`;
}

export function getDefaultSeoForRoute(
  route: PageRoute,
  siteData: SiteData = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  const { company, hero, services, regions, gallery } = siteData;
  const regionText = company.region.replace(/·/g, ' ');
  const pageKey = getSeoPageKey(route);

  let title = `${regionText} 유리창청소·외벽청소 전문 | ${company.name}`;
  let description = `${company.region} 아파트·상가·빌딩 유리창청소와 건물 외벽청소 전문 ${company.name}. 간판·어닝청소 고압세척, 시트지제거까지 프리미엄 청소전문업체.`;
  let keywords = `${company.name}, ${regionText} 유리창청소, 아파트외창청소, 외벽청소, 상가유리창청소, 빌딩외벽청소`;
  let ogTitle = '';
  let ogImage = siteData.seo?.defaultOgImage?.trim() || hero.afterImage || '';
  let routeHash = '';
  let routePath = '/';
  let jsonLd: Record<string, unknown> | null = null;

  if (route.type === 'service') {
    const service =
      services.items.find((s) => s.id === route.serviceId) ?? services.items[0];
    if (service) {
      const stems = getServiceSeoStems(service.id, service.title);
      title = clampText(`${service.title} 전문 · 서울 경기 인천 | ${company.name}`, 58);
      ogTitle = clampText(`${service.title} · 무료 출장견적 | ${company.name}`, 48);
      description = clampText(
        `${service.detail.tagline} ${service.detail.targetAudience} 맞춤 ${service.title}. ${service.detail.duration} · ${service.detail.priceGuide}. ${company.region} 무료 출장견적.`,
        155
      );
      keywords = dedupeKeywords(
        [
          service.title,
          ...stems,
          `서울 ${stems[0] || service.title}`,
          `경기 ${stems[0] || service.title}`,
          `인천 ${stems[0] || service.title}`,
          `${stems[0] || service.title} 비용`,
          `${stems[0] || service.title} 업체`,
          company.name,
        ],
        12
      );
      ogImage =
        siteData.seo?.defaultOgImage?.trim() || service.detail.afterImage || hero.afterImage || '';
      routePath = `/service/${encodeURIComponent(service.id)}`;
      routeHash = `#${routePath}`;

      const faqEntities = (service.detail.faqList ?? []).map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      }));
      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Service',
            name: service.title,
            serviceType: service.title,
            description,
            provider: {
              '@type': 'HomeAndConstructionBusiness',
              name: company.name,
              telephone: company.phone,
              priceRange: '₩₩',
            },
            areaServed: ['서울특별시', '경기도', '인천광역시'],
          },
          ...(faqEntities.length > 0
            ? [{ '@type': 'FAQPage', mainEntity: faqEntities }]
            : []),
        ],
      };
    }
  } else if (route.type === 'region') {
    const detail = regions.details[route.regionName];
    const subDistricts = detail?.subDistricts ?? [];
    title = clampText(`${route.regionName} 유리창청소·외창청소 전문 | ${company.name}`, 58);
    ogTitle = clampText(`${route.regionName} 유리창청소 · 무료 출장견적 | ${company.name}`, 48);
    description = clampText(
      detail
        ? `${route.regionName}(${subDistricts.slice(0, 5).join(', ')}) ${detail.description}. ${detail.leadTime}.`
        : `${route.regionName} 전지역 아파트 외창·상가 통유리·빌딩 외벽청소 전문 ${company.name}. 당일·익일 무료 출장 견적.`,
      155
    );
    keywords = dedupeKeywords(
      [
        `${route.regionName} 유리창청소`,
        `${route.regionName} 외창청소`,
        `${route.regionName} 외벽청소`,
        `${route.regionName} 아파트 외창청소`,
        `${route.regionName} 상가 유리창청소`,
        `${route.regionName} 간판청소`,
        ...subDistricts.slice(0, 3).map((d) => `${d} 유리창청소`),
        company.name,
      ],
      11
    );
    routePath = `/region/${encodeURIComponent(route.regionName)}`;
    routeHash = `#${routePath}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${route.regionName} 유리창청소 전문`,
      description,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: route.regionName,
        ...(subDistricts.length > 0
          ? { containsPlace: subDistricts.map((d) => ({ '@type': 'Place', name: d })) }
          : {}),
      },
      provider: {
        '@type': 'HomeAndConstructionBusiness',
        name: company.name,
        telephone: company.phone,
        priceRange: '₩₩',
      },
    };
  } else if (route.type === 'matrix') {
    const service =
      services.items.find((s) => s.id === route.serviceId) ?? services.items[0];
    if (service) {
      const detail = regions.details[route.regionName];
      const subDistricts = detail?.subDistricts ?? [];
      const stems = getServiceSeoStems(service.id, service.title);
      const primaryStem = stems[0] || service.title;
      const secondaryStem = stems[1] || '유리창청소';
      const aliases = extractRegionAliases(route.regionName);
      const shortAlias = aliases[aliases.length - 1] || route.regionName;
      const leadTime = detail?.leadTime || '당일·익일 신속 방문';

      title = clampText(`${route.regionName} ${service.title} 전문 | ${company.name}`, 58);
      ogTitle = clampText(`${route.regionName} ${service.title} · 무료 출장견적 | ${company.name}`, 48);
      description = clampText(
        `${route.regionName}${subDistricts.length > 0 ? `(${subDistricts.slice(0, 4).join('·')})` : ''} ${service.title} 직영 출장. ${service.detail.tagline} ${leadTime} · 배상보험 가입.`,
        155
      );
      keywords = dedupeKeywords(
        [
          `${route.regionName} ${service.title}`,
          `${route.regionName} ${primaryStem}`,
          `${route.regionName} ${secondaryStem}`,
          shortAlias !== route.regionName ? `${shortAlias} ${primaryStem}` : '',
          `${route.regionName} 유리창청소`,
          ...subDistricts.slice(0, 3).map((d) => `${d} ${primaryStem}`),
          `${route.regionName} ${primaryStem} 비용`,
          `${route.regionName} ${primaryStem} 업체`,
          stems[2] ? `${route.regionName} ${stems[2]}` : '',
          company.name,
        ],
        12
      );
      ogImage =
        siteData.seo?.defaultOgImage?.trim() || service.detail.afterImage || hero.afterImage || '';
      routePath = `/region/${encodeURIComponent(route.regionName)}/service/${encodeURIComponent(service.id)}`;
      routeHash = `#${routePath}`;

      const faqEntities = (service.detail.faqList ?? []).map((f) => ({
        '@type': 'Question',
        name: f.q.includes(route.regionName) ? f.q : `[${route.regionName}] ${f.q}`,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      }));

      jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Service',
            name: `${route.regionName} ${service.title}`,
            serviceType: service.title,
            description,
            areaServed: {
              '@type': 'AdministrativeArea',
              name: route.regionName,
              ...(subDistricts.length > 0
                ? { containsPlace: subDistricts.map((d) => ({ '@type': 'Place', name: d })) }
                : {}),
            },
            provider: {
              '@type': 'HomeAndConstructionBusiness',
              name: company.name,
              telephone: company.phone,
              priceRange: '₩₩',
            },
          },
          ...(faqEntities.length > 0
            ? [{ '@type': 'FAQPage', mainEntity: faqEntities }]
            : []),
        ],
      };
    }
  } else if (route.type === 'gallery_list') {
    title = `현장 작업 갤러리 & 시공사례 | ${company.name}`;
    description =
      '아파트 외창, 상가 통유리, 빌딩 외벽 고소작업, 간판·어닝청소, 썬팅 시트지 제거 실제 시공 일지.';
    keywords = `${company.name} 시공사례, 유리창청소 전후, 외벽청소 후기, 아파트 외창청소 사례`;
    routePath = '/gallery';
    routeHash = '#/gallery';
  } else if (route.type === 'gallery_detail') {
    const post =
      gallery.posts.find((p) => p.id === route.postId) ?? gallery.posts[0];
    if (post) {
      const autoSeo = generateNaverSeoFromPost(post, company.name);
      const useStored = post.seo && post.seo.autoSync === false;
      title = (useStored ? post.seo?.title?.trim() : post.seo?.title?.trim() || autoSeo.title) || autoSeo.title;
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
      routePath = `/gallery/${encodeURIComponent(post.id)}`;
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
    ogTitle: ogTitle || title,
    ogDescription: description,
    ogImage,
    routeHash,
    routePath,
    jsonLd,
  };
}

export function resolveSeoForRoute(
  route: PageRoute,
  siteData: SiteData = INITIAL_SITE_DATA
): ResolvedSeoMeta {
  const defaults = getDefaultSeoForRoute(route, siteData);
  const override: PageSeoMeta | undefined = siteData.seo?.pages?.[defaults.pageKey];

  const title = override?.title?.trim() || defaults.title;
  const description = override?.description?.trim() || defaults.description;
  const keywords = override?.keywords?.trim() || defaults.keywords;
  const ogTitle =
    override?.ogTitle?.trim() || (override?.title?.trim() ? override.title.trim() : defaults.ogTitle);
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

export function applySeoForRoute(route: PageRoute, siteData: SiteData = INITIAL_SITE_DATA) {
  const origin =
    siteData.siteUrl?.trim().replace(/\/+$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const resolved = resolveSeoForRoute(route, siteData);

  document.title = resolved.title;
  setMetaTag('meta[name="description"]', 'name', 'description', resolved.description);
  setMetaTag('meta[name="keywords"]', 'name', 'keywords', resolved.keywords);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteData.company.name);
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
    route.type === 'gallery_detail' ? parseSeoKeywords(resolved.keywords, 10) : []
  );
  setDynamicJsonLd(resolved.jsonLd);
}


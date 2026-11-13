import { INITIAL_SITE_DATA } from '@/src/data/clearworksData';
import type { PageRoute, SiteData } from '@/src/types/clearworks';

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
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

export function applySeoForRoute(route: PageRoute, siteData: SiteData = INITIAL_SITE_DATA) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const { company, services, regions, gallery } = siteData;

  let title = `서울 경기 인천 유리창청소·외벽청소 전문 | ${company.name}`;
  let description =
    '서울·경기·인천 아파트·상가·빌딩 유리창청소와 건물 외벽청소 전문 클리어웍스. 고층 유리창·외벽 고압세척, 안전한 맞춤 시공과 무료 출장견적을 제공합니다.';
  let routeHash = '';
  let jsonLd: Record<string, unknown> | null = null;

  if (route.type === 'service') {
    const service =
      services.items.find((s) => s.id === route.serviceId) ?? services.items[0];
    title = `${service.title} 전문 | ${company.name}`;
    description = `${service.detail.tagline} ${service.description} ${company.region} 무료 출장 견적.`;
    routeHash = `#/service/${service.id}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.title,
      description,
      provider: {
        '@type': 'LocalBusiness',
        name: company.name,
        telephone: company.phone,
      },
      areaServed: ['서울특별시', '경기도', '인천광역시'],
    };
  } else if (route.type === 'region') {
    const detail = regions.details[route.regionName];
    title = `${route.regionName} 유리창청소·외창청소 전문 | ${company.name}`;
    description = detail
      ? `${route.regionName}(${detail.subDistricts.slice(0, 5).join(', ')}) ${detail.description}. ${detail.leadTime}.`
      : `${route.regionName} 전지역 아파트 외창·상가 통유리·빌딩 외벽청소 전문 ${company.name}. 당일·익일 무료 출장 견적.`;
    routeHash = `#/region/${encodeURIComponent(route.regionName)}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${route.regionName} 유리창청소 전문`,
      description,
      areaServed: {
        '@type': 'AdministrativeArea',
        name: route.regionName,
      },
      provider: {
        '@type': 'LocalBusiness',
        name: company.name,
        telephone: company.phone,
      },
    };
  } else if (route.type === 'matrix') {
    const service =
      services.items.find((s) => s.id === route.serviceId) ?? services.items[0];
    title = `${route.regionName} ${service.title} | ${company.name}`;
    description = `${route.regionName} 전지역 ${service.title} 전문 시공. ${service.detail.tagline}`;
    routeHash = `#/region/${encodeURIComponent(route.regionName)}/service/${service.id}`;
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `${route.regionName} ${service.title}`,
      description,
      areaServed: route.regionName,
    };
  } else if (route.type === 'gallery_list') {
    title = `현장 작업 갤러리 & 시공사례 | ${company.name}`;
    description =
      '아파트 외창, 상가 통유리, 빌딩 외벽 고소작업, 간판·어닝청소, 썬팅 시트지 제거 실제 시공 일지.';
    routeHash = '#/gallery';
  } else if (route.type === 'gallery_detail') {
    const post =
      gallery.posts.find((p) => p.id === route.postId) ?? gallery.posts[0];
    if (post) {
      title = `${post.title} | ${company.name}`;
      description = post.excerpt;
      routeHash = `#/gallery/${post.id}`;
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date.replace(/\./g, '-'),
        author: {
          '@type': 'Organization',
          name: company.name,
        },
      };
    }
  }

  document.title = title;
  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);

  const canonicalUrl = `${origin}${pathname}${routeHash}`;
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
  setCanonical(canonicalUrl);
  setDynamicJsonLd(jsonLd);
}

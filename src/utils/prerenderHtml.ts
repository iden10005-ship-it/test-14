import type { PageRoute, ServiceItem, SiteData } from '../types/clearworks.ts';
import {
  getRoutePath,
  inferMetroPrefix,
  resolveEffectiveRoute,
  type ResolvedSeoMeta,
} from './seo.ts';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function renderSiteHeader(siteData: SiteData): string {
  const { company, services } = siteData;
  return `
  <header class="bg-white border-b border-slate-200">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <a href="/" class="text-lg font-extrabold text-slate-900">${escapeHtml(company.name)}</a>
      <nav aria-label="주요 메뉴" class="hidden md:flex items-center gap-5 text-sm font-semibold text-slate-700">
        ${services.items
          .slice(0, 4)
          .map(
            (srv) =>
              `<a href="${escapeAttr(getRoutePath({ type: 'service', serviceId: srv.id }))}" class="hover:text-blue-600">${escapeHtml(srv.title)}</a>`
          )
          .join('')}
        <a href="/gallery" class="hover:text-blue-600">시공 갤러리</a>
        <a href="tel:${escapeAttr(company.phone)}" class="text-blue-600 font-bold">${escapeHtml(company.phone)}</a>
      </nav>
    </div>
  </header>`.trim();
}

function renderSiteFooter(siteData: SiteData): string {
  const { company } = siteData;
  return `
  <footer class="bg-slate-950 text-slate-400 py-10 border-t border-slate-900 text-xs">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 space-y-2">
      <p class="text-white font-bold text-sm">${escapeHtml(company.name)} · ${escapeHtml(company.region)}</p>
      <p>대표: ${escapeHtml(company.representative)} · 사업자등록번호: ${escapeHtml(company.bizNumber)} · 주소: ${escapeHtml(company.address)}</p>
      <p>전화: <a href="tel:${escapeAttr(company.phone)}">${escapeHtml(company.phone)}</a> · 운영시간: ${escapeHtml(company.operatingHours)} · ${escapeHtml(company.asPeriod)}일 무상 A/S</p>
      <nav aria-label="하단 바로가기" class="pt-2 flex flex-wrap gap-3 text-slate-300">
        <a href="/">홈</a>
        <a href="/gallery">현장 시공 갤러리</a>
        ${siteData.services.items
          .map(
            (s) =>
              `<a href="${escapeAttr(getRoutePath({ type: 'service', serviceId: s.id }))}">${escapeHtml(s.title)}</a>`
          )
          .join('')}
      </nav>
    </div>
  </footer>`.trim();
}

function renderServiceDetailSection(service: ServiceItem, siteData: SiteData): string {
  const { company, regions } = siteData;
  const { detail } = service;
  const otherServices = siteData.services.items.filter((s) => s.id !== service.id);
  const serviceFaqs = detail.faqList ?? [];

  return `
  <div class="bg-slate-50 min-h-screen">
    <nav aria-label="현재 위치" class="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 text-xs text-slate-600">
      <div class="max-w-5xl mx-auto flex items-center gap-2">
        <a href="/" class="hover:underline">홈</a>
        <span>/</span>
        <span>서비스 안내</span>
        <span>/</span>
        <strong class="text-blue-600">${escapeHtml(service.title)}</strong>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200">
        ${service.badge ? `<span class="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3">${escapeHtml(service.badge)}</span>` : ''}
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mb-3">${escapeHtml(service.title)}</h1>
        <p class="text-base sm:text-lg text-blue-600 font-bold mb-3">${escapeHtml(detail.tagline)}</p>
        <p class="text-sm text-slate-600 leading-relaxed mb-4">
          ${escapeHtml(service.description)} · 추천 대상: <strong>${escapeHtml(detail.targetAudience)}</strong>
        </p>
        <p class="text-xs text-slate-700">
          평균 소요 시간: ${escapeHtml(detail.duration)} · 예상 견적 기준: ${escapeHtml(detail.priceGuide)} · ${escapeHtml(company.asPeriod)}일 무상 A/S
        </p>
      </section>

      <section class="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
        <h2 class="text-lg font-extrabold text-slate-900">${escapeHtml(service.title)} 시공 전후 비교</h2>
        <p class="text-xs text-slate-600">
          시공 전: ${escapeHtml(detail.beforeCaption || '오염 및 물때로 시야가 차단된 상태')} / 시공 후: ${escapeHtml(detail.afterCaption || '스퀴지 공법으로 완벽히 투명해진 조망')}
        </p>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section class="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 class="text-lg font-bold text-slate-900 mb-3">시공 범위 및 체크리스트</h2>
          <ul class="space-y-2 text-sm text-slate-700">
            ${detail.scopeList.map((item) => `<li>✓ ${escapeHtml(item)}</li>`).join('')}
          </ul>
        </section>
        <section class="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 class="text-lg font-bold text-slate-900 mb-3">사용 전문 장비 및 공법</h2>
          <ul class="space-y-2 text-sm text-slate-700">
            ${detail.equipment.map((eq) => `<li>• ${escapeHtml(eq)}</li>`).join('')}
          </ul>
        </section>
      </div>

      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900 mb-4">${escapeHtml(service.title)} 자주 묻는 질문</h2>
        <dl class="space-y-3 text-sm">
          ${serviceFaqs
            .map(
              (f) => `
          <div>
            <dt class="font-bold text-slate-900">Q. ${escapeHtml(f.q)}</dt>
            <dd class="text-slate-600 mt-1">A. ${escapeHtml(f.a)}</dd>
          </div>`
            )
            .join('')}
          <div>
            <dt class="font-bold text-slate-900">Q. ${escapeHtml(service.title)} 비용 및 견적 기준은 어떻게 되나요?</dt>
            <dd class="text-slate-600 mt-1">A. ${escapeHtml(detail.priceGuide)}. ${escapeHtml(company.name)}은(는) 무료 방문 실측 또는 사진 견적을 통해 추가 비용 없는 확정 견적을 안내해 드립니다.</dd>
          </div>
          <div>
            <dt class="font-bold text-slate-900">Q. ${escapeHtml(service.title)} 작업 시간과 A/S 보증은 어떻게 되나요?</dt>
            <dd class="text-slate-600 mt-1">A. ${escapeHtml(detail.duration)}이며, 완료 후 ${escapeHtml(company.asPeriod)}일 이내 무상 A/S와 영업배상책임보험을 보장합니다.</dd>
          </div>
        </dl>
      </section>

      ${
        regions.list.length > 0
          ? `
      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900 mb-3">지역별 ${escapeHtml(service.title)} 안내</h2>
        <nav aria-label="지역별 ${escapeAttr(service.title)}" class="flex flex-wrap gap-2 text-xs">
          ${regions.list
            .map(
              (reg) =>
                `<a href="${escapeAttr(getRoutePath({ type: 'matrix', regionName: reg, serviceId: service.id }))}" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold">${escapeHtml(reg)} ${escapeHtml(service.title)}</a>`
            )
            .join('')}
        </nav>
      </section>`
          : ''
      }

      ${
        otherServices.length > 0
          ? `
      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900 mb-3">다른 전문 서비스</h2>
        <nav aria-label="다른 전문 서비스" class="flex flex-wrap gap-2 text-xs">
          ${otherServices
            .map(
              (other) =>
                `<a href="${escapeAttr(getRoutePath({ type: 'service', serviceId: other.id }))}" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold">${escapeHtml(other.title)}</a>`
            )
            .join('')}
        </nav>
      </section>`
          : ''
      }
    </main>
  </div>`.trim();
}

function renderRegionSection(regionName: string, siteData: SiteData): string {
  const { company, services, regions, gallery, faq } = siteData;
  const metro = inferMetroPrefix(regionName);
  const detail = regions.details[regionName];
  const subDistricts = detail?.subDistricts ?? [`${regionName} 전지역`];
  const popularComplexes = detail?.popularComplexes ?? [];
  const leadTime = detail?.leadTime || '당일·익일 무료 방문 견적 가능';
  const regionDescription =
    detail?.description || `${regionName} 전지역 아파트 외창 및 상가 유리창 전문 신속 출장`;
  const otherRegions = regions.list.filter((r) => r !== regionName).slice(0, 18);

  return `
  <div class="bg-slate-50 min-h-screen">
    <nav aria-label="현재 위치" class="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 text-xs text-slate-600">
      <div class="max-w-5xl mx-auto flex items-center gap-2">
        <a href="/" class="hover:underline">홈</a>
        <span>/</span>
        <span>서비스 지역</span>
        <span>/</span>
        <strong class="text-blue-600">${escapeHtml(regionName)}</strong>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200">
        <span class="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold mb-3">${escapeHtml(metro.metroFull)} ${escapeHtml(regionName)} 직영 출장</span>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mb-3">${escapeHtml(metro.displayRegion)} 유리창청소·외창청소 전문 | ${escapeHtml(company.name)}</h1>
        <p class="text-base text-slate-700 font-medium mb-3">${escapeHtml(regionDescription)}</p>
        <p class="text-xs text-slate-600">출장 일정: ${escapeHtml(leadTime)} · 배상책임보험 가입 · ${escapeHtml(company.asPeriod)}일 무상 A/S</p>
        ${detail?.notice ? `<p class="text-xs text-blue-700 mt-2 font-semibold">${escapeHtml(detail.notice)}</p>` : ''}
      </section>

      <section class="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
        <h2 class="text-lg font-bold text-slate-900">${escapeHtml(regionName)} 세부 출장 지역 및 주요 시공 구역</h2>
        <ul class="flex flex-wrap gap-2 text-xs text-slate-700">
          ${subDistricts.map((d) => `<li class="px-3 py-1 rounded-xl bg-slate-100 font-semibold">${escapeHtml(d)}</li>`).join('')}
        </ul>
        ${
          popularComplexes.length > 0
            ? `<p class="text-xs text-slate-600">주요 아파트·상권: ${popularComplexes.map((c) => escapeHtml(c)).join(', ')}</p>`
            : ''
        }
      </section>

      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900 mb-4">${escapeHtml(regionName)} 가능 전문 청소 서비스</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${services.items
            .map(
              (srv) => `
          <article class="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h3 class="font-bold text-slate-900 mb-1">
              <a href="${escapeAttr(getRoutePath({ type: 'matrix', regionName, serviceId: srv.id }))}" class="text-blue-700 hover:underline">${escapeHtml(regionName)} ${escapeHtml(srv.title)}</a>
            </h3>
            <p class="text-xs text-slate-600 mb-1">${escapeHtml(srv.description)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(srv.detail.priceGuide)}</p>
          </article>`
            )
            .join('')}
        </div>
      </section>

      ${
        gallery.posts.length > 0
          ? `
      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900 mb-3">${escapeHtml(company.name)} 현장 시공 사례</h2>
        <ul class="space-y-2 text-sm">
          ${gallery.posts
            .slice(0, 6)
            .map(
              (post) =>
                `<li><a href="${escapeAttr(getRoutePath({ type: 'gallery_detail', postId: post.id }))}" class="text-blue-600 font-semibold hover:underline">[${escapeHtml(post.region)}] ${escapeHtml(post.title)}</a></li>`
            )
            .join('')}
        </ul>
      </section>`
          : ''
      }

      ${
        faq.items.length > 0
          ? `
      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900 mb-4">${escapeHtml(regionName)} 유리창청소 자주 묻는 질문</h2>
        <dl class="space-y-3 text-sm">
          ${faq.items
            .slice(0, 5)
            .map(
              (f) => `
          <div>
            <dt class="font-bold text-slate-900">Q. ${escapeHtml(f.question)}</dt>
            <dd class="text-slate-600 mt-1">A. ${escapeHtml(f.answer)}</dd>
          </div>`
            )
            .join('')}
        </dl>
      </section>`
          : ''
      }

      ${
        otherRegions.length > 0
          ? `
      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-base font-bold text-slate-900 mb-3">인근 출장 가능 지역</h2>
        <nav aria-label="다른 지역 안내" class="flex flex-wrap gap-2 text-xs">
          ${otherRegions
            .map(
              (reg) =>
                `<a href="${escapeAttr(getRoutePath({ type: 'region', regionName: reg }))}" class="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">${escapeHtml(reg)}</a>`
            )
            .join('')}
        </nav>
      </section>`
          : ''
      }
    </main>
  </div>`.trim();
}

function renderMatrixSection(regionName: string, service: ServiceItem, siteData: SiteData): string {
  const { company, services, regions } = siteData;
  const detail = regions.details[regionName];
  const subDistricts = detail?.subDistricts ?? [`${regionName} 전지역`];
  const popularComplexes = detail?.popularComplexes ?? [];
  const leadTime = detail?.leadTime || '당일·익일 무료 방문 견적 가능';
  const siblingServices = services.items.filter((s) => s.id !== service.id);

  return `
  <div class="bg-slate-50 min-h-screen">
    <nav aria-label="현재 위치" class="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 text-xs text-slate-600">
      <div class="max-w-5xl mx-auto flex items-center gap-2">
        <a href="/" class="hover:underline">홈</a>
        <span>/</span>
        <a href="${escapeAttr(getRoutePath({ type: 'region', regionName }))}" class="hover:underline">${escapeHtml(regionName)}</a>
        <span>/</span>
        <a href="${escapeAttr(getRoutePath({ type: 'service', serviceId: service.id }))}" class="hover:underline">${escapeHtml(service.title)}</a>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200">
        <span class="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-3">${escapeHtml(regionName)} 전담팀 직영 출장</span>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mb-3">${escapeHtml(regionName)} ${escapeHtml(service.title)} 전문 | ${escapeHtml(company.name)}</h1>
        <p class="text-base sm:text-lg text-blue-600 font-bold mb-3">${escapeHtml(service.detail.tagline)}</p>
        <p class="text-sm text-slate-600 leading-relaxed">
          ${escapeHtml(regionName)}(${subDistricts.slice(0, 6).map((d) => escapeHtml(d)).join(', ')} 등) 전지역에서 ${escapeHtml(service.title)} 시공을 진행합니다.
          ${escapeHtml(service.detail.duration)} · ${escapeHtml(service.detail.priceGuide)} · ${escapeHtml(leadTime)}
        </p>
      </section>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section class="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 class="text-lg font-bold text-slate-900 mb-3">${escapeHtml(regionName)} ${escapeHtml(service.title)} 작업 범위</h2>
          <ul class="space-y-2 text-sm text-slate-700">
            ${service.detail.scopeList.map((item) => `<li>✓ ${escapeHtml(item)}</li>`).join('')}
          </ul>
        </section>
        <section class="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 class="text-lg font-bold text-slate-900 mb-3">사용 장비 및 안심 보증</h2>
          <ul class="space-y-2 text-sm text-slate-700">
            ${service.detail.equipment.map((eq) => `<li>• ${escapeHtml(eq)}</li>`).join('')}
          </ul>
        </section>
      </div>

      <section class="bg-white rounded-2xl p-6 border border-slate-200 space-y-3">
        <h2 class="text-lg font-bold text-slate-900">${escapeHtml(regionName)} ${escapeHtml(service.title)} 출장 가능 지역 안내</h2>
        <p class="text-xs text-blue-700 font-bold">${escapeHtml(leadTime)}</p>
        <ul class="flex flex-wrap gap-2 text-xs text-slate-700">
          ${subDistricts.map((d) => `<li class="px-3 py-1 rounded-xl bg-slate-100 font-semibold">${escapeHtml(d)}</li>`).join('')}
        </ul>
        ${
          popularComplexes.length > 0
            ? `<p class="text-xs text-slate-600">주요 시공 단지·상권: ${popularComplexes.map((c) => escapeHtml(c)).join(', ')}</p>`
            : ''
        }
      </section>

      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900 mb-4">${escapeHtml(regionName)} ${escapeHtml(service.title)} 자주 묻는 질문</h2>
        <dl class="space-y-3 text-sm">
          ${(service.detail.faqList ?? [])
            .map(
              (f) => `
          <div>
            <dt class="font-bold text-slate-900">Q. [${escapeHtml(regionName)}] ${escapeHtml(f.q)}</dt>
            <dd class="text-slate-600 mt-1">A. ${escapeHtml(f.a)}</dd>
          </div>`
            )
            .join('')}
          <div>
            <dt class="font-bold text-slate-900">Q. ${escapeHtml(regionName)} ${escapeHtml(service.title)} 비용 및 견적 기준은 어떻게 되나요?</dt>
            <dd class="text-slate-600 mt-1">A. ${escapeHtml(service.detail.priceGuide)}. ${escapeHtml(company.name)}은(는) 무료 방문 실측 및 투명한 확정 견적을 안내해 드립니다.</dd>
          </div>
          <div>
            <dt class="font-bold text-slate-900">Q. ${escapeHtml(regionName)} 어느 지역까지 출장이 가능한가요?</dt>
            <dd class="text-slate-600 mt-1">A. ${subDistricts.map((d) => escapeHtml(d)).join(', ')} 전지역 직영 전담팀이 출장하며 ${escapeHtml(leadTime)}으로 방문합니다.</dd>
          </div>
        </dl>
      </section>

      ${
        siblingServices.length > 0
          ? `
      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-lg font-bold text-slate-900 mb-3">${escapeHtml(regionName)}의 다른 전문 청소 서비스</h2>
        <nav aria-label="${escapeAttr(regionName)} 다른 서비스" class="flex flex-wrap gap-2 text-xs">
          ${siblingServices
            .map(
              (other) =>
                `<a href="${escapeAttr(getRoutePath({ type: 'matrix', regionName, serviceId: other.id }))}" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold">${escapeHtml(regionName)} ${escapeHtml(other.title)}</a>`
            )
            .join('')}
        </nav>
      </section>`
          : ''
      }
    </main>
  </div>`.trim();
}

function renderGalleryListSection(siteData: SiteData): string {
  const { gallery } = siteData;
  return `
  <div class="bg-slate-50 min-h-screen">
    <nav aria-label="현재 위치" class="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 text-xs text-slate-600">
      <div class="max-w-5xl mx-auto flex items-center gap-2">
        <a href="/" class="hover:underline">홈</a>
        <span>/</span>
        <strong class="text-blue-600">현장 작업 갤러리</strong>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200">
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mb-2">${escapeHtml(gallery.sectionTitle)}</h1>
        <p class="text-sm text-slate-600">${escapeHtml(gallery.sectionSubtitle)}</p>
      </section>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        ${gallery.posts
          .map(
            (post) => `
        <article class="bg-white rounded-2xl p-5 border border-slate-200 space-y-2">
          <div class="text-xs text-slate-500">${escapeHtml(post.category)} · ${escapeHtml(post.region)} · ${escapeHtml(post.date)}</div>
          <h2 class="text-lg font-bold text-slate-900">
            <a href="${escapeAttr(getRoutePath({ type: 'gallery_detail', postId: post.id }))}" class="hover:text-blue-600">${escapeHtml(post.title)}</a>
          </h2>
          <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(post.excerpt)}</p>
        </article>`
          )
          .join('')}
      </div>
    </main>
  </div>`.trim();
}

function renderGalleryDetailSection(postId: string, siteData: SiteData): string {
  const post = siteData.gallery.posts.find((p) => p.id === postId) ?? siteData.gallery.posts[0];
  if (!post) return renderGalleryListSection(siteData);
  const otherPosts = siteData.gallery.posts.filter((p) => p.id !== post.id).slice(0, 6);

  const blocksHtml = (post.blocks ?? [])
    .map((block) => {
      if (block.type === 'heading') {
        return `<h2 class="text-lg font-bold text-slate-900 pt-2">${escapeHtml(block.text)}</h2>`;
      }
      if (block.type === 'text') {
        return `<p class="text-sm text-slate-700 leading-relaxed">${escapeHtml(block.text)}</p>`;
      }
      return `<figure class="space-y-1"><img src="${escapeAttr(block.url)}" alt="${escapeAttr(block.caption || post.title)}" class="w-full rounded-xl" />${
        block.caption ? `<figcaption class="text-xs text-slate-500">${escapeHtml(block.caption)}</figcaption>` : ''
      }</figure>`;
    })
    .join('');

  return `
  <div class="bg-slate-50 min-h-screen">
    <nav aria-label="현재 위치" class="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 text-xs text-slate-600">
      <div class="max-w-4xl mx-auto flex items-center gap-2">
        <a href="/" class="hover:underline">홈</a>
        <span>/</span>
        <a href="/gallery" class="hover:underline">시공 갤러리</a>
        <span>/</span>
        <strong class="text-blue-600">${escapeHtml(post.title)}</strong>
      </div>
    </nav>
    <main class="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <article class="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-4">
        <div class="text-xs text-slate-500">${escapeHtml(post.category)} · ${escapeHtml(post.region)} · ${escapeHtml(post.date)} · ${escapeHtml(post.author)}</div>
        <h1 class="text-2xl sm:text-3xl font-black text-slate-900">${escapeHtml(post.title)}</h1>
        <p class="text-sm sm:text-base text-slate-600 font-medium">${escapeHtml(post.excerpt)}</p>
        ${blocksHtml || `<p class="text-sm text-slate-700 leading-relaxed">${escapeHtml(post.content)}</p>`}
        ${
          post.equipmentUsed.length > 0
            ? `
        <section class="pt-4 border-t border-slate-100">
          <h2 class="text-base font-bold text-slate-900 mb-2">투입 장비</h2>
          <ul class="text-sm text-slate-700 space-y-1">
            ${post.equipmentUsed.map((eq) => `<li>• ${escapeHtml(eq)}</li>`).join('')}
          </ul>
        </section>`
            : ''
        }
        ${
          post.keyPoints.length > 0
            ? `
        <section class="pt-4 border-t border-slate-100">
          <h2 class="text-base font-bold text-slate-900 mb-2">핵심 시공 포인트</h2>
          <ul class="text-sm text-slate-700 space-y-1">
            ${post.keyPoints.map((kp) => `<li>✓ ${escapeHtml(kp)}</li>`).join('')}
          </ul>
        </section>`
            : ''
        }
      </article>
      ${
        otherPosts.length > 0
          ? `
      <section class="bg-white rounded-2xl p-6 border border-slate-200">
        <h2 class="text-base font-bold text-slate-900 mb-3">다른 현장 시공 일지</h2>
        <ul class="space-y-2 text-sm">
          ${otherPosts
            .map(
              (other) =>
                `<li><a href="${escapeAttr(getRoutePath({ type: 'gallery_detail', postId: other.id }))}" class="text-blue-600 font-semibold hover:underline">[${escapeHtml(other.region)}] ${escapeHtml(other.title)}</a></li>`
            )
            .join('')}
        </ul>
      </section>`
          : ''
      }
    </main>
  </div>`.trim();
}

function renderHomeSection(siteData: SiteData): string {
  const { hero, services, process, gallery, pricing, reviews, faq, regions, company } = siteData;
  return `
  <main class="bg-white">
    <section class="bg-slate-950 text-white py-16 px-4 sm:px-6">
      <div class="max-w-5xl mx-auto space-y-4">
        <span class="inline-block text-xs font-bold text-sky-400">${escapeHtml(hero.badgeText)}</span>
        <h1 class="text-3xl sm:text-5xl font-black leading-tight">${escapeHtml(hero.title).replace(/\n/g, '<br />')}</h1>
        <p class="text-sm sm:text-base text-slate-300 leading-relaxed">${escapeHtml(hero.subtitle).replace(/\n/g, '<br />')}</p>
        <div class="flex flex-wrap gap-3 pt-2 text-sm font-bold">
          <a href="tel:${escapeAttr(company.phone)}" class="px-5 py-3 rounded-xl bg-blue-600 text-white">${escapeHtml(hero.callButtonText)} (${escapeHtml(company.phone)})</a>
          <a href="#service" class="px-5 py-3 rounded-xl bg-white/10 text-white">서비스 안내</a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          ${hero.stats
            .map(
              (st) => `
          <div class="p-3 rounded-xl bg-white/10">
            <div class="text-lg font-black text-white">${escapeHtml(st.value)}</div>
            <div class="text-xs text-slate-300">${escapeHtml(st.label)}</div>
          </div>`
            )
            .join('')}
        </div>
      </div>
    </section>

    <section id="service" class="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">${escapeHtml(services.sectionTitle)}</h2>
        <p class="text-sm text-slate-600 mt-1">${escapeHtml(services.sectionSubtitle)}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${services.items
          .map(
            (srv) => `
        <article class="rounded-2xl p-5 border border-slate-200 bg-white space-y-2">
          <h3 class="text-lg font-bold text-slate-900">
            <a href="${escapeAttr(getRoutePath({ type: 'service', serviceId: srv.id }))}" class="hover:text-blue-600">${escapeHtml(srv.title)}</a>
          </h3>
          <p class="text-sm text-slate-600">${escapeHtml(srv.description)}</p>
        </article>`
          )
          .join('')}
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100 space-y-4">
      <h2 class="text-2xl font-extrabold text-slate-900">${escapeHtml(process.sectionTitle)}</h2>
      <p class="text-sm text-slate-600">${escapeHtml(process.sectionSubtitle)}</p>
      <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        ${process.steps
          .map(
            (st) => `
        <li class="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <strong class="block text-slate-900">${st.step}. ${escapeHtml(st.title)}</strong>
          <span class="text-slate-600 text-xs">${escapeHtml(st.description)}</span>
        </li>`
          )
          .join('')}
      </ol>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-extrabold text-slate-900">${escapeHtml(gallery.sectionTitle)}</h2>
          <p class="text-sm text-slate-600">${escapeHtml(gallery.sectionSubtitle)}</p>
        </div>
        <a href="/gallery" class="text-sm font-bold text-blue-600">전체 작업일지 보러가기</a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${gallery.posts
          .slice(0, 6)
          .map(
            (post) => `
        <article class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div class="text-xs text-slate-500">${escapeHtml(post.category)} · ${escapeHtml(post.region)}</div>
          <h3 class="font-bold text-slate-900 text-sm">
            <a href="${escapeAttr(getRoutePath({ type: 'gallery_detail', postId: post.id }))}" class="hover:text-blue-600">${escapeHtml(post.title)}</a>
          </h3>
          <p class="text-xs text-slate-600">${escapeHtml(post.excerpt)}</p>
        </article>`
          )
          .join('')}
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100 space-y-4">
      <h2 class="text-2xl font-extrabold text-slate-900">${escapeHtml(pricing.sectionTitle)}</h2>
      <p class="text-sm text-slate-600">${escapeHtml(pricing.sectionSubtitle)}</p>
      <ul class="space-y-2 text-sm text-slate-700">
        ${pricing.rows
          .map(
            (r) =>
              `<li><strong>${escapeHtml(r.category)}</strong> (${escapeHtml(r.standard)}): ${escapeHtml(r.price)}</li>`
          )
          .join('')}
      </ul>
      <p class="text-xs text-slate-500">${escapeHtml(pricing.footerNote)}</p>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100 space-y-4">
      <h2 class="text-2xl font-extrabold text-slate-900">${escapeHtml(reviews.sectionTitle)}</h2>
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700">
        ${reviews.items
          .slice(0, 6)
          .map(
            (rv) =>
              `<li class="p-4 rounded-xl bg-slate-50 border border-slate-200">"${escapeHtml(rv.content)}" — ${escapeHtml(rv.author)}</li>`
          )
          .join('')}
      </ul>
    </section>

    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100 space-y-4">
      <h2 class="text-2xl font-extrabold text-slate-900">${escapeHtml(faq.sectionTitle)}</h2>
      <dl class="space-y-3 text-sm">
        ${faq.items
          .map(
            (f) => `
        <div>
          <dt class="font-bold text-slate-900">Q. ${escapeHtml(f.question)}</dt>
          <dd class="text-slate-600 mt-1">A. ${escapeHtml(f.answer)}</dd>
        </div>`
          )
          .join('')}
      </dl>
    </section>

    <section id="regions" class="max-w-6xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-100 space-y-4">
      <h2 class="text-2xl font-extrabold text-slate-900">${escapeHtml(regions.sectionTitle)}</h2>
      <p class="text-sm text-slate-600">${escapeHtml(regions.sectionSubtitle)}</p>
      <nav aria-label="전체 서비스 지역" class="flex flex-wrap gap-2 text-xs">
        ${regions.list
          .map(
            (reg) =>
              `<a href="${escapeAttr(getRoutePath({ type: 'region', regionName: reg }))}" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">${escapeHtml(reg)}</a>`
          )
          .join('')}
      </nav>
    </section>
  </main>`.trim();
}

export function buildPrerenderBodyHtml(
  route: PageRoute,
  siteData: SiteData,
  _meta?: ResolvedSeoMeta
): string {
  const effective = resolveEffectiveRoute(route, siteData);
  const header = renderSiteHeader(siteData);
  const footer = renderSiteFooter(siteData);

  let bodyContent = '';
  switch (effective.type) {
    case 'service': {
      const srv =
        siteData.services.items.find((s) => s.id === effective.serviceId) ??
        siteData.services.items[0];
      bodyContent = srv ? renderServiceDetailSection(srv, siteData) : renderHomeSection(siteData);
      break;
    }
    case 'region': {
      bodyContent = renderRegionSection(effective.regionName, siteData);
      break;
    }
    case 'matrix': {
      const srv =
        siteData.services.items.find((s) => s.id === effective.serviceId) ??
        siteData.services.items[0];
      bodyContent = srv
        ? renderMatrixSection(effective.regionName, srv, siteData)
        : renderRegionSection(effective.regionName, siteData);
      break;
    }
    case 'gallery_list': {
      bodyContent = renderGalleryListSection(siteData);
      break;
    }
    case 'gallery_detail': {
      bodyContent = renderGalleryDetailSection(effective.postId, siteData);
      break;
    }
    default: {
      bodyContent = renderHomeSection(siteData);
      break;
    }
  }

  return `${header}\n${bodyContent}\n${footer}`;
}

import fs from 'node:fs/promises';
import path from 'node:path';
import type { PageRoute, SiteData } from '../src/types/clearworks.ts';
import { getPostBlocks, getPostCoverImage } from '../src/utils/galleryBlocks.ts';
import { parseSeoKeywords } from '../src/utils/naverSeoGenerator.ts';
import { resolveSeoForRoute } from '../src/utils/seo.ts';
import { normalizeBaseUrl } from '../src/utils/sitemap.ts';

const ROOT_DIR = process.cwd();
const SITE_CONTENT_PATH = path.resolve(ROOT_DIR, 'src/data/siteContent.json');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const DIST_INDEX_PATH = path.resolve(DIST_DIR, 'index.html');

function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toAbsoluteUrl(urlOrPath: string, baseUrl: string): string {
  const trimmed = urlOrPath.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;
  return `${baseUrl.replace(/\/+$/, '')}/${trimmed.replace(/^\/+/, '')}`;
}

function injectPageSeoHtml(
  templateHtml: string,
  options: {
    baseUrl: string;
    route: PageRoute;
    siteData: SiteData;
    prerenderBodyHtml: string;
  }
): string {
  const { baseUrl, route, siteData, prerenderBodyHtml } = options;
  const meta = resolveSeoForRoute(route, siteData);
  const canonicalUrl = `${baseUrl}${meta.routePath}`;
  const ogImageAbs = meta.ogImage ? toAbsoluteUrl(meta.ogImage, baseUrl) : '';

  let html = templateHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtmlText(meta.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtmlAttr(meta.description)}" />`
  );
  html = html.replace(
    /<meta\s+name="keywords"[\s\S]*?\/>/,
    `<meta name="keywords" content="${escapeHtmlAttr(meta.keywords)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${escapeHtmlAttr(meta.ogTitle)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escapeHtmlAttr(meta.ogDescription)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${escapeHtmlAttr(meta.ogTitle)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${escapeHtmlAttr(meta.ogDescription)}" />`
  );

  // Remove old canonical / og:url / og:image / twitter:image if present
  html = html.replace(/\s*<link\s+rel="canonical"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+property="og:url"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+property="og:image"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+name="twitter:image"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+property="article:tag"[^>]*>/g, '');
  html = html.replace(/\s*<script[^>]*id="ld-dynamic"[^>]*>[\s\S]*?<\/script>/g, '');

  const articleTags =
    route.type === 'gallery_detail'
      ? parseSeoKeywords(meta.keywords, 10).map(
          (kw) => `<meta property="article:tag" content="${escapeHtmlAttr(kw)}" />`
        )
      : [];

  const extraHeadTags = [
    `<link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}" />`,
    ogImageAbs ? `<meta property="og:image" content="${escapeHtmlAttr(ogImageAbs)}" />` : '',
    ogImageAbs ? `<meta name="twitter:image" content="${escapeHtmlAttr(ogImageAbs)}" />` : '',
    ...articleTags,
    meta.jsonLd
      ? `<script type="application/ld+json" id="ld-dynamic">${JSON.stringify({
          ...meta.jsonLd,
          mainEntityOfPage: canonicalUrl,
        })}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  html = html.replace('</head>', `    ${extraHeadTags}\n  </head>`);
  if (prerenderBodyHtml) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${prerenderBodyHtml}</div>`
    );
  }
  return html;
}

const SUBPAGE_PRERENDER_STYLE = `<style>
  .cw-pre{min-height:100vh;background:#f8fafc;padding:88px 16px 64px;font-family:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,system-ui,sans-serif;color:#0f172a;line-height:1.7;}
  .cw-pre-card{max-width:896px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px 24px;box-shadow:0 1px 3px rgba(15,23,42,.04);}
  .cw-pre-meta{font-size:13px;font-weight:600;color:#2563eb;margin:0 0 10px;}
  .cw-pre h1{font-size:26px;font-weight:800;letter-spacing:-0.02em;line-height:1.35;margin:0 0 14px;color:#0f172a;}
  .cw-pre h2{font-size:19px;font-weight:700;margin:28px 0 10px;color:#0f172a;}
  .cw-pre p{font-size:15px;color:#334155;margin:0 0 14px;}
  .cw-pre figure{margin:20px 0;}
  .cw-pre figcaption{font-size:13px;color:#64748b;margin-top:8px;text-align:center;}
  .cw-pre img{width:100%;max-height:520px;object-fit:cover;border-radius:16px;display:block;margin:18px 0;}
  .cw-pre-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;font-size:13px;color:#475569;}
  .cw-pre-list{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:12px;}
  .cw-pre-list li{border:1px solid #e2e8f0;border-radius:16px;padding:16px;background:#fff;}
  .cw-pre-list a{font-size:16px;font-weight:700;color:#0f172a;text-decoration:none;}
</style>`;

function wrapSubpagePrerender(innerHtml: string): string {
  return `${SUBPAGE_PRERENDER_STYLE}<div class="cw-pre"><main class="cw-pre-card">${innerHtml}</main></div>`;
}

function buildGalleryPostHtml(siteData: SiteData, postId: string): string {
  const post = siteData.gallery.posts.find((p) => p.id === postId);
  if (!post) return '';
  const blocks = getPostBlocks(post);
  const cover = getPostCoverImage(post);

  const blocksHtml = blocks
    .map((b) => {
      if (b.type === 'heading') {
        return `<h2>${escapeHtmlText(b.text)}</h2>`;
      }
      if (b.type === 'text') {
        return `<p>${escapeHtmlText(b.text).replace(/\n/g, '<br />')}</p>`;
      }
      return `<figure><img src="${escapeHtmlAttr(b.url)}" alt="${escapeHtmlAttr(
        b.caption || post.title
      )}" />${b.caption ? `<figcaption>${escapeHtmlText(b.caption)}</figcaption>` : ''}</figure>`;
    })
    .join('\n');

  const tagsHtml = post.tags.map((t) => `<span>#${escapeHtmlText(t)}</span>`).join(' ');

  return wrapSubpagePrerender(`<article>
    <p class="cw-pre-meta">${escapeHtmlText(post.category)} · ${escapeHtmlText(post.region)} · ${escapeHtmlText(post.date)}</p>
    <h1>${escapeHtmlText(post.title)}</h1>
    <p>${escapeHtmlText(post.excerpt)}</p>
    ${cover ? `<img src="${escapeHtmlAttr(cover)}" alt="${escapeHtmlAttr(post.title)}" />` : ''}
    ${blocksHtml}
    <div class="cw-pre-tags">${tagsHtml}</div>
    <p>${escapeHtmlText(siteData.company.name)} 무료 견적 문의: ${escapeHtmlText(siteData.company.phone)}</p>
  </article>`);
}

function buildGalleryListHtml(siteData: SiteData): string {
  const items = siteData.gallery.posts
    .map(
      (post) =>
        `<li><a href="/gallery/${encodeURIComponent(post.id)}">${escapeHtmlText(post.title)}</a><p>${escapeHtmlText(post.region)} · ${escapeHtmlText(post.category)} — ${escapeHtmlText(post.excerpt)}</p></li>`
    )
    .join('\n');
  return wrapSubpagePrerender(`
    <p class="cw-pre-meta">${escapeHtmlText(siteData.company.name)} 작업 갤러리</p>
    <h1>${escapeHtmlText(siteData.company.name)} 현장 작업 갤러리 &amp; 시공사례</h1>
    <p>${escapeHtmlText(siteData.gallery.sectionSubtitle)}</p>
    <ul class="cw-pre-list">${items}</ul>
  `);
}

async function writeStaticRoute(routeDir: string, html: string): Promise<void> {
  const outDir = path.resolve(DIST_DIR, routeDir);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.resolve(outDir, 'index.html'), html, 'utf-8');
}

async function main() {
  if (process.env.GITHUB_PAGES === 'true') {
    console.log('Skipping clean-path static prerender for GitHub Pages subpath build.');
    return;
  }

  const raw = await fs.readFile(SITE_CONTENT_PATH, 'utf-8');
  const siteData = JSON.parse(raw) as SiteData;
  const templateHtml = await fs.readFile(DIST_INDEX_PATH, 'utf-8');

  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '';
  const baseUrl = normalizeBaseUrl(
    process.env.SITE_URL || siteData.siteUrl || vercelProdUrl || 'https://clearworks.kr'
  );

  // 1. Prerender /gallery
  await writeStaticRoute(
    'gallery',
    injectPageSeoHtml(templateHtml, {
      baseUrl,
      route: { type: 'gallery_list' },
      siteData,
      prerenderBodyHtml: buildGalleryListHtml(siteData),
    })
  );

  // 2. Prerender every /gallery/<postId> blog post
  for (const post of siteData.gallery.posts) {
    await writeStaticRoute(
      path.join('gallery', post.id),
      injectPageSeoHtml(templateHtml, {
        baseUrl,
        route: { type: 'gallery_detail', postId: post.id },
        siteData,
        prerenderBodyHtml: buildGalleryPostHtml(siteData, post.id),
      })
    );
  }

  // 3. Prerender /service/<serviceId>
  for (const srv of siteData.services.items) {
    await writeStaticRoute(
      path.join('service', srv.id),
      injectPageSeoHtml(templateHtml, {
        baseUrl,
        route: { type: 'service', serviceId: srv.id },
        siteData,
        prerenderBodyHtml: wrapSubpagePrerender(
          `<p class="cw-pre-meta">${escapeHtmlText(siteData.company.name)} 서비스 안내</p><h1>${escapeHtmlText(srv.title)}</h1><p>${escapeHtmlText(srv.detail.tagline)}</p><p>${escapeHtmlText(srv.description)}</p>`
        ),
      })
    );
  }

  // 4. Prerender /region/<regionName>
  for (const regionName of siteData.regions.list) {
    const detail = siteData.regions.details[regionName];
    await writeStaticRoute(
      path.join('region', regionName),
      injectPageSeoHtml(templateHtml, {
        baseUrl,
        route: { type: 'region', regionName },
        siteData,
        prerenderBodyHtml: wrapSubpagePrerender(
          `<p class="cw-pre-meta">${escapeHtmlText(siteData.company.name)} 출장 가능 지역</p><h1>${escapeHtmlText(regionName)} 유리창청소·외창청소 전문 | ${escapeHtmlText(siteData.company.name)}</h1><p>${escapeHtmlText(detail?.description || `${regionName} 전지역 아파트 외창·상가 통유리·빌딩 외벽청소`)}</p>`
        ),
      })
    );
  }

  // 5. Update root dist/index.html head tags (canonical, og:url, og:image) while keeping #root empty
  //    so first-time visitors never see unstyled prerender text flash before React mounts.
  const enhancedHome = injectPageSeoHtml(templateHtml, {
    baseUrl,
    route: { type: 'home' },
    siteData,
    prerenderBodyHtml: '',
  });
  await fs.writeFile(DIST_INDEX_PATH, enhancedHome, 'utf-8');

  console.log(
    `Generated static SEO pages for ${siteData.gallery.posts.length} gallery posts, ${siteData.services.items.length} services, and ${siteData.regions.list.length} regions.`
  );
}

main().catch((err) => {
  console.error('Failed to generate static SEO pages:', err);
  process.exit(1);
});

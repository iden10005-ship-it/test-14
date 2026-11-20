import fs from 'node:fs/promises';
import path from 'node:path';
import type { PageRoute, SiteData } from '../src/types/clearworks.ts';
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
  }
): string {
  const { baseUrl, route, siteData } = options;
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
    /<meta\s+property="og:type"[\s\S]*?\/>/,
    `<meta property="og:type" content="${escapeHtmlAttr(meta.ogType)}" />`
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

  // Remove old canonical / og:url / og:image / twitter:image / geo tags if present
  html = html.replace(/\s*<link\s+rel="canonical"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+property="og:url"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+property="og:image"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+name="twitter:image"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+name="geo\.region"[^>]*>/g, '');
  html = html.replace(/\s*<meta\s+name="geo\.placename"[^>]*>/g, '');
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
    meta.geoRegion ? `<meta name="geo.region" content="${escapeHtmlAttr(meta.geoRegion)}" />` : '',
    meta.geoPlacename
      ? `<meta name="geo.placename" content="${escapeHtmlAttr(meta.geoPlacename)}" />`
      : '',
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
  return html;
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

  // Keep #root empty across ALL routes so human visitors never see unstyled fallback text
  // flash before React mounts, while preserving route-specific <head> SEO tags and JSON-LD.

  // 1. /gallery
  await writeStaticRoute(
    'gallery',
    injectPageSeoHtml(templateHtml, {
      baseUrl,
      route: { type: 'gallery_list' },
      siteData,
    })
  );

  // 2. Every /gallery/<postId> blog post
  for (const post of siteData.gallery.posts) {
    await writeStaticRoute(
      path.join('gallery', post.id),
      injectPageSeoHtml(templateHtml, {
        baseUrl,
        route: { type: 'gallery_detail', postId: post.id },
        siteData,
      })
    );
  }

  // 3. /service/<serviceId>
  for (const srv of siteData.services.items) {
    await writeStaticRoute(
      path.join('service', srv.id),
      injectPageSeoHtml(templateHtml, {
        baseUrl,
        route: { type: 'service', serviceId: srv.id },
        siteData,
      })
    );
  }

  // 4. /region/<regionName>
  for (const regionName of siteData.regions.list) {
    await writeStaticRoute(
      path.join('region', regionName),
      injectPageSeoHtml(templateHtml, {
        baseUrl,
        route: { type: 'region', regionName },
        siteData,
      })
    );
  }

  // 5. Every /region/<regionName>/service/<serviceId> matrix landing page
  let matrixCount = 0;
  for (const regionName of siteData.regions.list) {
    await Promise.all(
      siteData.services.items.map(async (srv) => {
        matrixCount += 1;
        await writeStaticRoute(
          path.join('region', regionName, 'service', srv.id),
          injectPageSeoHtml(templateHtml, {
            baseUrl,
            route: { type: 'matrix', regionName, serviceId: srv.id },
            siteData,
          })
        );
      })
    );
  }

  // 6. Root dist/index.html
  const enhancedHome = injectPageSeoHtml(templateHtml, {
    baseUrl,
    route: { type: 'home' },
    siteData,
  });
  await fs.writeFile(DIST_INDEX_PATH, enhancedHome, 'utf-8');

  console.log(
    `Generated static SEO head pages for ${siteData.gallery.posts.length} gallery posts, ${siteData.services.items.length} services, ${siteData.regions.list.length} regions, and ${matrixCount} region+service pages.`
  );
}

main().catch((err) => {
  console.error('Failed to generate static SEO pages:', err);
  process.exit(1);
});

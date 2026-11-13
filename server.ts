import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { SiteData } from './src/types/clearworks.ts';
import {
  buildSitemapEntries,
  generateRobotsTxt,
  generateSitemapXml,
  normalizeBaseUrl,
} from './src/utils/sitemap.ts';

const ROOT_DIR = process.cwd();
const SITE_CONTENT_PATH = path.resolve(ROOT_DIR, 'src/data/siteContent.json');
const INDEX_HTML_PATH = path.resolve(ROOT_DIR, 'index.html');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const SITEMAP_PATH = path.resolve(PUBLIC_DIR, 'sitemap.xml');
const ROBOTS_PATH = path.resolve(PUBLIC_DIR, 'robots.txt');
const UPLOAD_DIR = path.resolve(ROOT_DIR, 'public/uploads');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const PORT = Number(process.env.PORT || 3000);

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

async function readSiteContent(): Promise<SiteData> {
  const raw = await fs.readFile(SITE_CONTENT_PATH, 'utf-8');
  return JSON.parse(raw) as SiteData;
}

async function writeIfChanged(filePath: string, nextContent: string): Promise<void> {
  try {
    const existing = await fs.readFile(filePath, 'utf-8');
    if (existing === nextContent) return;
  } catch {
    // File doesn't exist yet
  }
  await fs.writeFile(filePath, nextContent, 'utf-8');
}

async function syncIndexHtmlSeo(data: SiteData): Promise<void> {
  try {
    const origHtml = await fs.readFile(INDEX_HTML_PATH, 'utf-8');
    let html = origHtml;
    const { company, hero, services, faq, seo } = data;
    const regionText = company.region.replace(/·/g, ' ');
    const homeSeo = seo?.pages?.home;

    const defaultTitle = `${regionText} 유리창청소·외벽청소 전문 | ${company.name}`;
    const defaultDesc = `${company.region} 아파트·상가·빌딩 유리창청소와 건물 외벽청소 전문 ${company.name}. ${hero.subtitle}`;
    const defaultKeywords = `유리창청소, 아파트외창청소, 외벽청소, 상가유리창청소, 빌딩외벽청소, 고층유리창청소, 서울유리창청소, 경기유리창청소, 인천유리창청소, 창틀청소, 유리발수코팅, 어닝청소, ${company.name}`;

    const seoTitle = homeSeo?.title?.trim() || defaultTitle;
    const seoDesc = homeSeo?.description?.trim() || defaultDesc;
    const seoKeywords = homeSeo?.keywords?.trim() || defaultKeywords;
    const ogTitle = homeSeo?.ogTitle?.trim() || seoTitle;
    const ogDesc = homeSeo?.ogDescription?.trim() || seoDesc;
    const rawOgImage = homeSeo?.ogImage?.trim() || seo?.defaultOgImage?.trim() || '';
    const baseUrl = normalizeBaseUrl(data.siteUrl || process.env.APP_URL || '');
    const ogImage =
      rawOgImage && !/^https?:\/\//i.test(rawOgImage) && baseUrl
        ? `${baseUrl}/${rawOgImage.replace(/^\/+/, '')}`
        : rawOgImage;

    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtmlText(seoTitle)}</title>`);
    html = html.replace(
      /<meta\s+name="description"[\s\S]*?\/>/,
      `<meta\n      name="description"\n      content="${escapeHtmlAttr(seoDesc)}"\n    />`
    );
    html = html.replace(
      /<meta\s+name="keywords"[\s\S]*?\/>/,
      `<meta\n      name="keywords"\n      content="${escapeHtmlAttr(seoKeywords)}"\n    />`
    );
    html = html.replace(
      /<meta\s+name="author"\s+content="[^"]*"\s*\/>/,
      `<meta name="author" content="${escapeHtmlAttr(company.name)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:site_name"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:site_name" content="${escapeHtmlAttr(company.name)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${escapeHtmlAttr(ogTitle)}" />`
    );
    html = html.replace(
      /<meta\s+property="og:description"[\s\S]*?\/>/,
      `<meta\n      property="og:description"\n      content="${escapeHtmlAttr(ogDesc)}"\n    />`
    );
    html = html.replace(/\s*<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/g, '');
    if (ogImage) {
      html = html.replace(
        /(<meta\s+property="og:description"[\s\S]*?\/>)/,
        `$1\n    <meta property="og:image" content="${escapeHtmlAttr(ogImage)}" />`
      );
    }

    html = html.replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${escapeHtmlAttr(ogTitle)}" />`
    );
    html = html.replace(
      /<meta\s+name="twitter:description"[\s\S]*?\/>/,
      `<meta\n      name="twitter:description"\n      content="${escapeHtmlAttr(ogDesc)}"\n    />`
    );
    html = html.replace(/\s*<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/>/g, '');
    if (ogImage) {
      html = html.replace(
        /(<meta\s+name="twitter:description"[\s\S]*?\/>)/,
        `$1\n    <meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}" />`
      );
    }

    const businessLd = {
      '@context': 'https://schema.org',
      '@type': 'HomeAndConstructionBusiness',
      name: company.name,
      description: seoDesc,
      telephone: company.phone,
      priceRange: '₩₩',
      address: {
        '@type': 'PostalAddress',
        streetAddress: company.address,
        addressCountry: 'KR',
      },
      areaServed: [
        { '@type': 'City', name: '서울특별시' },
        { '@type': 'State', name: '경기도' },
        { '@type': 'City', name: '인천광역시' },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '3500',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `${company.name} 전문 서비스`,
        itemListElement: services.items.map((srv) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: srv.title },
        })),
      },
    };

    const faqLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.items.slice(0, 8).map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    const businessJson = JSON.stringify(businessLd, null, 2)
      .split('\n')
      .map((line) => `      ${line}`)
      .join('\n');
    const faqJson = JSON.stringify(faqLd, null, 2)
      .split('\n')
      .map((line) => `      ${line}`)
      .join('\n');

    html = html.replace(
      /<script type="application\/ld\+json" id="ld-business">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" id="ld-business">\n${businessJson}\n    </script>`
    );
    html = html.replace(
      /<script type="application\/ld\+json" id="ld-faq">[\s\S]*?<\/script>/,
      `<script type="application/ld+json" id="ld-faq">\n${faqJson}\n    </script>`
    );

    if (html !== origHtml) {
      await fs.writeFile(INDEX_HTML_PATH, html, 'utf-8');
    }
  } catch (err) {
    console.warn('index.html SEO sync skipped:', err);
  }
}

async function writeSitemapFiles(
  data: SiteData,
  overrideBaseUrl?: string,
  includeMatrix = true
): Promise<number> {
  const baseUrl = normalizeBaseUrl(
    overrideBaseUrl || data.siteUrl || process.env.APP_URL || 'https://www.clearworks.kr'
  );
  const entries = buildSitemapEntries(data, { baseUrl, includeMatrix });
  const xml = generateSitemapXml(data, { baseUrl, includeMatrix });
  const robots = generateRobotsTxt(baseUrl);
  await fs.mkdir(PUBLIC_DIR, { recursive: true });
  await writeIfChanged(SITEMAP_PATH, xml);
  await writeIfChanged(ROBOTS_PATH, robots);
  return entries.length;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Dynamic SEO endpoints for Google & Naver crawlers
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const data = await readSiteContent();
      const requestOrigin = req.get('host')
        ? `${req.protocol}://${req.get('host')}`
        : undefined;
      const baseUrl = normalizeBaseUrl(data.siteUrl || process.env.APP_URL || requestOrigin);
      const xml = generateSitemapXml(data, { baseUrl, includeMatrix: true });
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(xml);
    } catch {
      res.status(500).send('Failed to generate sitemap');
    }
  });

  app.get('/robots.txt', async (req, res) => {
    try {
      const data = await readSiteContent();
      const requestOrigin = req.get('host')
        ? `${req.protocol}://${req.get('host')}`
        : undefined;
      const baseUrl = normalizeBaseUrl(data.siteUrl || process.env.APP_URL || requestOrigin);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(generateRobotsTxt(baseUrl));
    } catch {
      res.status(500).send('User-agent: *\nAllow: /\n');
    }
  });

  // Admin capabilities check
  app.get('/api/admin/capabilities', (_req, res) => {
    res.json({ canWriteCode: true });
  });

  // Read freshest site data from codebase JSON
  app.get('/api/admin/site-data', async (_req, res) => {
    try {
      const data = await readSiteContent();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Read failed' });
    }
  });

  // Save updated site data directly into codebase JSON, index.html SEO & sitemap.xml
  app.post('/api/admin/save-site-data', async (req, res) => {
    try {
      const providedPin = String(req.headers['x-admin-pin'] ?? '');
      const current = await readSiteContent();
      if (!providedPin || providedPin !== current.adminPin) {
        res.status(401).json({ error: '관리자 비밀번호 인증에 실패했습니다.' });
        return;
      }

      const nextData = req.body as SiteData;
      if (!nextData || !nextData.company || !nextData.hero || !nextData.services) {
        res.status(400).json({ error: '유효하지 않은 사이트 데이터입니다.' });
        return;
      }

      await fs.writeFile(SITE_CONTENT_PATH, `${JSON.stringify(nextData, null, 2)}\n`, 'utf-8');
      await syncIndexHtmlSeo(nextData);
      await writeSitemapFiles(nextData);
      res.json({ ok: true, savedAt: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Save failed' });
    }
  });

  // On-demand sitemap.xml & robots.txt regeneration from Admin Settings
  app.post('/api/admin/generate-sitemap', async (req, res) => {
    try {
      const providedPin = String(req.headers['x-admin-pin'] ?? '');
      const current = await readSiteContent();
      if (!providedPin || providedPin !== current.adminPin) {
        res.status(401).json({ error: '관리자 비밀번호 인증에 실패했습니다.' });
        return;
      }

      const { baseUrl, includeMatrix } = req.body as {
        baseUrl?: string;
        includeMatrix?: boolean;
      };
      const normalized = normalizeBaseUrl(baseUrl || current.siteUrl);
      const updated: SiteData = { ...current, siteUrl: normalized };
      await fs.writeFile(SITE_CONTENT_PATH, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8');
      const count = await writeSitemapFiles(updated, normalized, includeMatrix ?? true);
      res.json({ ok: true, count, baseUrl: normalized });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Sitemap failed' });
    }
  });

  // Save uploaded image file directly into public/uploads/
  app.post('/api/admin/upload-image', async (req, res) => {
    try {
      const providedPin = String(req.headers['x-admin-pin'] ?? '');
      const current = await readSiteContent();
      if (!providedPin || providedPin !== current.adminPin) {
        res.status(401).json({ error: '관리자 비밀번호 인증에 실패했습니다.' });
        return;
      }

      const { dataUrl, nameHint } = req.body as { dataUrl?: string; nameHint?: string };
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ error: '이미지 데이터가 없습니다.' });
        return;
      }

      const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
      if (!match) {
        res.status(400).json({ error: '지원되지 않는 이미지 형식입니다.' });
        return;
      }

      const rawExt = match[1].toLowerCase();
      const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
      const base64Data = match[2];
      const safeHint = (nameHint || 'image')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 24) || 'image';

      const filename = `${safeHint}-${Date.now()}.${ext}`;
      const filePath = path.resolve(UPLOAD_DIR, filename);
      await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));

      res.json({ ok: true, url: `/uploads/${filename}` });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Upload failed' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Clearworks server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

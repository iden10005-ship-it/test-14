import type { GalleryBlock, GalleryPost } from '@/src/types/clearworks';

export interface NaverSeoAnalysisInput {
  title: string;
  category?: string;
  region?: string;
  excerpt?: string;
  content?: string;
  blocks?: GalleryBlock[];
  tags?: string[];
  companyName?: string;
}

export interface MetaLengthStatus {
  length: number;
  min: number;
  max: number;
  status: 'good' | 'short' | 'long';
  label: string;
}

export const MAX_SEO_KEYWORDS = 10;

export function parseSeoKeywords(raw: string, max = MAX_SEO_KEYWORDS): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,#\n]+/)) {
    const cleaned = part.trim();
    if (!cleaned) continue;
    const norm = cleaned.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(cleaned);
    if (out.length >= max) break;
  }
  return out;
}

export function formatSeoKeywords(items: string[], max = MAX_SEO_KEYWORDS): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const cleaned = item.replace(/^#+/, '').trim();
    if (!cleaned) continue;
    const norm = cleaned.toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(cleaned);
    if (out.length >= max) break;
  }
  return out.join(', ');
}

export interface GeneratedNaverPostSeo {
  title: string;
  description: string;
  ogTitle: string;
  keywords: string;
  extractedKeywords: string[];
  suggestedKeywords: string[];
  detectedLocations: string[];
  detectedServices: string[];
  titleStatus: MetaLengthStatus;
  descriptionStatus: MetaLengthStatus;
  ogTitleStatus: MetaLengthStatus;
}

const DOMAIN_SERVICE_TERMS = [
  '외창청소',
  '유리창청소',
  '통유리청소',
  '외벽청소',
  '고압세척',
  '어닝청소',
  '간판청소',
  '시트지제거',
  '썬팅제거',
  '고소작업차',
  '스카이차',
  '로프작업',
  '물때제거',
  '백화제거',
  '유막제거',
  '발수코팅',
  '창틀청소',
  '난간청소',
  '준공청소',
  '정기청소',
  '친환경 세제',
  '친환경 약품',
  '스퀴지',
  '빗물자국',
  '미세먼지',
  '필름제거',
  '스티커제거',
];

const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  아파트: '아파트 외창청소',
  상가: '상가 유리창청소',
  빌딩: '빌딩 외벽청소',
  '간판,어닝청소': '간판·어닝청소',
  '간판·어닝청소': '간판·어닝청소',
  시트지제거: '시트지·썬팅 제거',
  기타: '특수 외창·외벽청소',
};

const CATEGORY_RELATED_KEYWORDS: Record<string, string[]> = {
  아파트: ['아파트 외창청소', '유리창청소', '창틀청소', '물때제거', '유리발수코팅', '베란다 유리창청소'],
  상가: ['상가 유리창청소', '매장 통유리청소', '유리창청소', '유막제거', '어닝청소', '정기 유리창청소'],
  빌딩: ['빌딩 외벽청소', '고층 유리창청소', '외벽 고압세척', '로프 외벽청소', '고소작업차 시공', '백화제거'],
  '간판,어닝청소': ['어닝청소', '간판청소', '친환경 세제', '상가 외관청소', '고압세척', '오염 제거'],
  '간판·어닝청소': ['어닝청소', '간판청소', '친환경 세제', '상가 외관청소', '고압세척', '오염 제거'],
  시트지제거: ['시트지제거', '썬팅제거', '유리 필름제거', '스티커 본드제거', '상가 유리창 복원', '스크래퍼 작업'],
  기타: ['특수 외창청소', '외벽청소', '고압세척', '물때제거', '유리창청소', '친환경 약품'],
};

const LOCATION_STOPLIST = new Set([
  '시공',
  '작업시',
  '필요시',
  '완료시',
  '우천시',
  '이동',
  '자동',
  '수동',
  '공동',
  '활동',
  '변동',
  '작동',
  '연동',
  '진동',
  '전역',
  '구역',
  '장구',
  '기구',
  '도구',
  '청구',
  '입구',
  '출구',
  '문구',
  '창구',
  '내면',
  '외면',
  '표면',
  '단면',
  '전면',
  '후면',
  '측면',
  '화면',
  '지면',
  '바닥면',
]);

function normalizeWhitespace(input: string): string {
  return input
    .replace(/[■▶★●◆•✓]/g, ' ')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateClean(text: string, maxLen: number, ellipsis = ''): string {
  const clean = text.trim();
  if (clean.length <= maxLen) return clean;
  const limit = Math.max(10, maxLen - ellipsis.length);
  const sliced = clean.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace >= Math.floor(limit * 0.65) ? sliced.slice(0, lastSpace) : sliced;
  return `${cut.replace(/[,·|/\\-]+$/, '').trim()}${ellipsis}`;
}

function evaluateLength(length: number, min: number, max: number): MetaLengthStatus {
  if (length < min) {
    return { length, min, max, status: 'short', label: `조금 짧음 (${length}/${max}자)` };
  }
  if (length > max) {
    return { length, min, max, status: 'long', label: `길이 초과 (${length}/${max}자)` };
  }
  return { length, min, max, status: 'good', label: `네이버 최적화 (${length}/${max}자)` };
}

function extractLocations(region: string, fullText: string): string[] {
  const results: string[] = [];
  const pushUnique = (val: string) => {
    const v = val.trim();
    if (v && !results.includes(v)) results.push(v);
  };

  if (region.trim()) {
    pushUnique(region.trim());
    region
      .split(/[\s·,/]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2)
      .forEach(pushUnique);
  }

  const locRegex = /([가-힣]{1,5}(?:특별시|광역시|자치시|시|군|구|동|읍|면|역))/g;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(fullText)) !== null) {
    const token = match[1];
    if (token.length < 2 || LOCATION_STOPLIST.has(token)) continue;
    // Skip suffix-only noise like "일시", "주시", "모시"
    if (/^(일|주|모|가|나|다|사|자|차|하|그|이|저)(시|구|동|군|면|역)$/.test(token)) continue;
    pushUnique(token);
  }

  return results.slice(0, 6);
}

function extractServices(title: string, bodyText: string, category: string, tags: string[]): string[] {
  const found: string[] = [];
  const pushUnique = (val: string) => {
    const v = val.trim();
    if (v && !found.includes(v)) found.push(v);
  };

  const normalizedTitle = title.replace(/\s+/g, '');
  const normalizedAll = `${title} ${bodyText} ${tags.join(' ')}`.replace(/\s+/g, '');

  // Prioritize terms mentioned in title first
  for (const term of DOMAIN_SERVICE_TERMS) {
    if (normalizedTitle.includes(term.replace(/\s+/g, ''))) {
      pushUnique(term);
    }
  }
  for (const term of DOMAIN_SERVICE_TERMS) {
    if (normalizedAll.includes(term.replace(/\s+/g, ''))) {
      pushUnique(term);
    }
  }

  const catDefault = CATEGORY_KEYWORD_MAP[category];
  if (catDefault && found.length === 0) {
    pushUnique(catDefault);
  }

  return found.slice(0, 8);
}

function extractBodyCorpus(input: NaverSeoAnalysisInput): {
  headings: string[];
  paragraphs: string[];
  captions: string[];
  combined: string;
} {
  const headings: string[] = [];
  const paragraphs: string[] = [];
  const captions: string[] = [];

  if (Array.isArray(input.blocks) && input.blocks.length > 0) {
    for (const block of input.blocks) {
      if (block.type === 'heading' && block.text?.trim()) {
        headings.push(normalizeWhitespace(block.text.replace(/^\d+\.\s*/, '')));
      } else if (block.type === 'text' && block.text?.trim()) {
        paragraphs.push(normalizeWhitespace(block.text));
      } else if (block.type === 'image' && block.caption?.trim()) {
        captions.push(normalizeWhitespace(block.caption));
      }
    }
  }

  if (paragraphs.length === 0 && input.content?.trim()) {
    const chunks = input.content
      .split(/\n{2,}/)
      .map((c) => c.trim())
      .filter(Boolean);
    for (const chunk of chunks) {
      const clean = normalizeWhitespace(chunk);
      if (chunk.startsWith('■') || chunk.startsWith('##')) {
        headings.push(clean);
      } else if (clean) {
        paragraphs.push(clean);
      }
    }
  }

  const combined = [...headings, ...paragraphs, ...captions].join(' ').trim();
  return { headings, paragraphs, captions, combined };
}

function splitIntoSentences(text: string): string[] {
  if (!text.trim()) return [];
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => normalizeWhitespace(s))
    .filter((s) => s.length >= 10);
}

export function generateNaverPostSeo(
  input: NaverSeoAnalysisInput
): GeneratedNaverPostSeo {
  const companyName = input.companyName?.trim() || '클리어웍스';
  const rawTitle = normalizeWhitespace(input.title || '');
  const region = normalizeWhitespace(input.region || '서울·수도권');
  const category = (input.category || '기타').trim();
  const tags = (input.tags ?? []).map((t) => t.trim()).filter(Boolean);

  const corpus = extractBodyCorpus(input);
  const fullText = `${rawTitle} ${input.excerpt || ''} ${corpus.combined} ${tags.join(' ')}`;

  const detectedLocations = extractLocations(region, fullText);
  const detectedServices = extractServices(rawTitle, corpus.combined, category, tags);
  const categoryFallback = CATEGORY_KEYWORD_MAP[category] || '유리창·외벽청소';

  // 1. Build Naver-optimized <title> (ideal: 28~58 chars)
  const regionTokens = region
    .split(/[\s·,/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const hasRegionInTitle = regionTokens.some((tok) => rawTitle.includes(tok));
  const hasServiceWordInTitle =
    /(청소|세척|제거|코팅|시공|작업일지|사례)/.test(rawTitle);

  let titleCore = rawTitle || `${region} ${categoryFallback} 현장 작업일지`;
  if (rawTitle && !hasRegionInTitle && region) {
    titleCore = `${region} ${titleCore}`;
  }
  if (rawTitle && !hasServiceWordInTitle) {
    const primaryService = detectedServices[0] || categoryFallback;
    if (!titleCore.includes(primaryService)) {
      titleCore = `${titleCore} ${primaryService}`;
    }
  }

  const brandSuffix = ` | ${companyName}`;
  const maxTitleTotal = 58;
  const maxCoreForTitle = Math.max(18, maxTitleTotal - brandSuffix.length);
  const seoTitle = `${truncateClean(titleCore, maxCoreForTitle)}${brandSuffix}`;

  // 2. Build Naver-optimized og:title (ideal: 22~46 chars, clean social/blog card headline)
  let ogCore = rawTitle || `${region} ${categoryFallback} 현장 사례`;
  if (rawTitle && !hasRegionInTitle && region && !ogCore.startsWith('[')) {
    ogCore = `[${region}] ${ogCore}`;
  }
  const ogTitle = truncateClean(ogCore, 46);

  // 3. Build Naver-optimized <meta name="description"> (ideal: 85~155 chars)
  const bodySentences = splitIntoSentences(corpus.paragraphs.join(' '));
  const scoredSentences = bodySentences
    .map((sentence, idx) => {
      let score = idx === 0 ? 3 : 0;
      for (const loc of detectedLocations) {
        if (sentence.includes(loc)) score += 2;
      }
      for (const srv of detectedServices) {
        if (sentence.replace(/\s+/g, '').includes(srv.replace(/\s+/g, ''))) score += 3;
      }
      if (sentence.length >= 25 && sentence.length <= 95) score += 2;
      return { sentence, score, idx };
    })
    .sort((a, b) => b.score - a.score || a.idx - b.idx);

  const excerptClean = normalizeWhitespace(input.excerpt || '');
  const leadParts: string[] = [];

  if (excerptClean.length >= 20) {
    leadParts.push(excerptClean.endsWith('.') ? excerptClean : `${excerptClean}.`);
  } else if (scoredSentences.length > 0) {
    const first = scoredSentences[0].sentence;
    const firstNeedsRegion =
      region && !regionTokens.some((tok) => first.includes(tok));
    const formattedFirst = firstNeedsRegion ? `${region} ${first}` : first;
    leadParts.push(formattedFirst.endsWith('.') ? formattedFirst : `${formattedFirst}.`);
  } else {
    const mainSrv = detectedServices[0] || categoryFallback;
    leadParts.push(`${region} ${rawTitle || mainSrv} 현장 시공 일지입니다.`);
  }

  // Add second high-signal sentence or heading summary if length allows
  let description = leadParts.join(' ');
  if (description.length < 105 && scoredSentences.length > 1) {
    const second = scoredSentences.find(
      (item) => !description.includes(item.sentence.slice(0, 15))
    );
    if (second) {
      const candidate = `${description} ${second.sentence}`;
      if (candidate.length <= 155) {
        description = candidate;
      } else if (description.length < 85) {
        description = truncateClean(candidate, 152, '...');
      }
    }
  }

  if (description.length < 95 && corpus.headings.length > 0) {
    const headingSummary = corpus.headings.slice(0, 3).join(' · ');
    const withHeadings = `${description} 주요 공정: ${headingSummary}.`;
    if (withHeadings.length <= 155) {
      description = withHeadings;
    }
  }

  const ctaSuffix = ` ${companyName} 무료 출장견적 문의.`;
  if (description.length + ctaSuffix.length <= 155) {
    description = `${description}${ctaSuffix}`;
  } else if (description.length < 60) {
    const fallbackTail = ` ${region} ${detectedServices[0] || categoryFallback} 전문 ${companyName} 실제 시공 사례와 작업 과정을 확인하세요.`;
    description = truncateClean(`${description}${fallbackTail}`, 155);
  }

  description = truncateClean(description, 155, '...');

  // 4. Build extracted & deduplicated SEO keywords (8~10 curated terms, max 10 for spam prevention)
  const keywordCandidates: string[] = [];
  const seenNorm = new Set<string>();
  const addKw = (k: string) => {
    const cleaned = k.replace(/^#+/, '').trim();
    if (!cleaned) return;
    const norm = cleaned.replace(/\s+/g, '').toLowerCase();
    if (seenNorm.has(norm)) return;
    seenNorm.add(norm);
    keywordCandidates.push(cleaned);
  };

  const primaryService = detectedServices[0] || categoryFallback;
  const specificDistrict =
    detectedLocations.find((l) => /(구|동|읍|면|역)$/.test(l)) ||
    detectedLocations.find((l) => /시$/.test(l) && l !== region) ||
    detectedLocations.find((l) => l !== region) ||
    '';

  if (region && primaryService) {
    addKw(`${region} ${primaryService}`);
  }
  if (specificDistrict && primaryService) {
    addKw(`${specificDistrict} ${primaryService}`);
  }
  const cityToken = detectedLocations.find((l) => /시$/.test(l));
  if (cityToken && cityToken !== specificDistrict && primaryService) {
    addKw(`${cityToken} ${primaryService}`);
  }

  // Detected services from title & body
  detectedServices.forEach(addKw);
  // User-entered visible tags
  tags.forEach(addKw);

  // Fill up to 9~10 with relevant category search keywords & specific location tokens
  const categoryExtras = CATEGORY_RELATED_KEYWORDS[category] || CATEGORY_RELATED_KEYWORDS['기타'];
  for (const extra of categoryExtras) {
    if (keywordCandidates.length >= 9) break;
    addKw(extra);
  }
  if (specificDistrict && keywordCandidates.length < 10) {
    addKw(`${specificDistrict} 청소업체`);
  }
  addKw(companyName);

  const extractedKeywords = keywordCandidates.slice(0, MAX_SEO_KEYWORDS);
  const suggestedKeywords = [
    ...categoryExtras,
    ...(specificDistrict ? [`${specificDistrict} 유리창청소`, `${specificDistrict} 외벽청소`] : []),
    `${region} 청소견적`,
  ].filter((item, idx, arr) => arr.indexOf(item) === idx && !extractedKeywords.includes(item));

  return {
    title: seoTitle,
    description,
    ogTitle,
    keywords: extractedKeywords.join(', '),
    extractedKeywords,
    suggestedKeywords: suggestedKeywords.slice(0, 6),
    detectedLocations,
    detectedServices,
    titleStatus: evaluateLength(seoTitle.length, 22, 60),
    descriptionStatus: evaluateLength(description.length, 75, 155),
    ogTitleStatus: evaluateLength(ogTitle.length, 16, 48),
  };
}

export function generateNaverSeoFromPost(
  post: GalleryPost,
  companyName = '클리어웍스'
): GeneratedNaverPostSeo {
  return generateNaverPostSeo({
    title: post.title,
    category: post.category,
    region: post.region,
    excerpt: post.excerpt,
    content: post.content,
    blocks: post.blocks,
    tags: post.tags,
    companyName,
  });
}

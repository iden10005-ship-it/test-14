export interface WorkLogImageNameInput {
  region?: string;
  category?: string;
  title?: string;
}

export type WatermarkTrimPreset = 'none' | 'bottom-8' | 'bottom-14' | 'bottom-20';
export type ImageEnhancementMode = 'natural' | 'contamination' | 'clarity-after';

export interface WorkLogImageOptimizeOptions {
  /** 하단 연락처·타사 배너 워터마크만 최소 범위로 제거하는 비율 프리셋 */
  watermarkTrim?: WatermarkTrimPreset;
  /** 필요 시 상단/하단 여백 추가 미세 트림 비율 (0~30%) */
  topTrimPercent?: number;
  bottomTrimPercent?: number;
  /** 현장 사진 용도별 화질 보정 모드 */
  enhancementMode?: ImageEnhancementMode;
  /** 최대 장변 해상도 (기본 1440px — 전체 배경 디테일 보존) */
  maxDimension?: number;
}

export interface GalleryImageGuidelineRule {
  id: 'watermark' | 'aspect-ratio' | 'context' | 'contamination';
  title: string;
  summary: string;
  checklist: string[];
}

/**
 * 작업갤러리 현장 사진 처리 4대 표준 가이드라인
 * - 워터마크 최소 영역 제거 · 원본 비율 유지 · 전체 배경 현장감 확보 · 오염 강조 보정
 */
export const GALLERY_IMAGE_GUIDELINES: readonly GalleryImageGuidelineRule[] = [
  {
    id: 'watermark',
    title: '1. 워터마크·타사 배너 최소 영역 제거',
    summary:
      '타사 연락처·로고 워터마크만 최소 범위(하단 8~20%)로 정밀 절단하고, 홍보용 PNG 배너는 본문에서 제외합니다.',
    checklist: [
      '가로형 현장 사진 하단 연락처는 하단 8~14% 트림으로 창틀·바닥 피사체 손실 방지',
      '세로형 현장 사진 하단 연락처는 하단 20% 트림 후 경계선 재검수',
      '상호·전화번호가 크게 들어간 안내 배너 PNG는 작업일지 본문 사진으로 사용하지 않음',
    ],
  },
  {
    id: 'aspect-ratio',
    title: '2. 원본 비율(Aspect Ratio) 무왜곡 유지',
    summary:
      '1:1이나 16:9 등 임의 비율로 강제 절단하지 않고 워터마크 제거 후 남은 원본 구도·비율을 그대로 유지합니다.',
    checklist: [
      '리사이징 시 가로/세로 비율을 100% 동일하게 스케일링(최대 1440px, 240KB 이하)',
      '상세 페이지·편집기 미리보기에서도 object-contain 기반으로 전체 구도 손실 방지',
      '불필요한 확대(줌인)나 찌그러짐 없이 촬영 당시 시야각 그대로 전달',
    ],
  },
  {
    id: 'context',
    title: '3. 전체 배경과 공간 현장감 확보',
    summary:
      '아파트 거실 통창이나 매장 전면처럼 공간 전체 변화를 보여줘야 하는 사진은 주변 프레임과 외부 배경까지 온전히 담습니다.',
    checklist: [
      '아파트 창문청소는 거실 통창 전체 전·후 비교 컷을 반드시 포함해 채광·뷰 변화 입증',
      '상가·간판·어닝 청소는 주변 출입구·도로변 배경이 보이는 전체 전경 컷을 대표 썸네일로 배치',
      '시공 전 → 작업 공정(약제도포·브러싱·박리·스퀴지) → 시공 후 전경 순으로 스토리 구성',
    ],
  },
  {
    id: 'contamination',
    title: '4. 시공 전·공정 사진의 오염 디테일 강조',
    summary:
      '분진·물때·매연·거미줄·본드 잔여물처럼 웹 압축 시 뭉개지기 쉬운 오염 텍스처를 과도한 왜곡 없이 선명하게 살립니다.',
    checklist: [
      '시공 전·작업 중 사진에는 오염 강조 모드(미세 대비·음영 분리·경량 선명화) 적용',
      '시공 후 완료 사진은 과장된 필터 대신 무보정 원본 또는 가벼운 투명감 보정으로 신뢰성 유지',
      '실내 창틀·유리 틈새·어닝 고정바 등 체감 만족 포인트의 디테일을 또렷하게 전달',
    ],
  },
] as const;

export const WATERMARK_TRIM_OPTIONS: ReadonlyArray<{
  value: WatermarkTrimPreset;
  label: string;
  percent: number;
  hint: string;
}> = [
  { value: 'none', label: '원본 유지 (워터마크 없음)', percent: 0, hint: '잘라내지 않고 원본 전체 사용' },
  { value: 'bottom-8', label: '하단 8% 제거 (미세 워터마크)', percent: 8, hint: '가로 사진 하단 바닥 여백 문구 제거' },
  { value: 'bottom-14', label: '하단 14% 제거 (표준 워터마크)', percent: 14, hint: '일반 가로·정방 사진 하단 연락처 제거' },
  { value: 'bottom-20', label: '하단 20% 제거 (세로형 연락처)', percent: 20, hint: '세로형 사진 하단 050 번호 등 완전 제거' },
];

export const ENHANCEMENT_MODE_OPTIONS: ReadonlyArray<{
  value: ImageEnhancementMode;
  label: string;
  hint: string;
}> = [
  {
    value: 'natural',
    label: '무보정 원본 화질 (기본)',
    hint: '색감·명암 변형 없이 원본 비율과 자연광을 그대로 유지',
  },
  {
    value: 'contamination',
    label: '오염 강조 (시공 전·작업 중)',
    hint: '미세 대비·음영·선명도 보정으로 물때·분진·매연·거미줄·본드 흔적을 또렷하게 부각',
  },
  {
    value: 'clarity-after',
    label: '투명감·채광 보정 (시공 후)',
    hint: '유리창·전경의 맑은 투과도와 밝기 균형을 과하지 않게 정리',
  },
];

export interface OptimizedWorkLogImage {
  dataUrl: string;
  filename: string;
  baseName: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
  appliedNotes: string[];
}

export type SeoImageSection =
  | 'hero'
  | 'service'
  | 'gallery'
  | 'showcase'
  | 'og'
  | 'review'
  | 'general';

export type SeoImageRole =
  | 'cover'
  | 'before'
  | 'after'
  | 'detail'
  | 'banner'
  | 'og';

export interface SeoImageFilenameInput {
  brand?: string;
  section?: SeoImageSection;
  serviceId?: string;
  region?: string;
  category?: string;
  title?: string;
  tag?: string;
  pageKey?: string;
  role?: SeoImageRole;
  fallback?: string;
}

const SERVICE_ID_SLUG_MAP: Record<string, string> = {
  'srv-1': 'apartment-window-cleaning',
  'srv-2': 'store-office-window-cleaning',
  'srv-3': 'building-exterior-window-cleaning',
  'srv-4': 'sign-awning-pressure-wash',
  'srv-5': 'window-sheet-film-removal',
  'srv-6': 'special-glass-coating-cleaning',
  apt: 'apartment-window-cleaning',
  shop: 'store-office-window-cleaning',
  building: 'building-exterior-window-cleaning',
  sign: 'sign-awning-pressure-wash',
  film: 'window-sheet-film-removal',
  special: 'special-glass-coating-cleaning',
};

const WORK_TERM_SLUG_PAIRS: ReadonlyArray<[string, string]> = [
  ['아파트외창청소', 'apartment-window-cleaning'],
  ['아파트창문청소', 'apartment-window-cleaning'],
  ['아파트유리창청소', 'apartment-window-cleaning'],
  ['외창청소', 'exterior-window-cleaning'],
  ['매장사무실', 'store-office-window-cleaning'],
  ['매장유리창청소', 'store-window-cleaning'],
  ['상가유리창청소', 'store-window-cleaning'],
  ['사무실유리창청소', 'office-window-cleaning'],
  ['사무실유리', 'office-window-cleaning'],
  ['카페통유리', 'cafe-window-cleaning'],
  ['통유리청소', 'full-glass-window-cleaning'],
  ['통유리', 'full-glass-window-cleaning'],
  ['빌딩외벽', 'building-exterior-cleaning'],
  ['고층유리창청소', 'high-rise-window-cleaning'],
  ['외벽청소', 'building-exterior-cleaning'],
  ['간판청소', 'sign-awning-cleaning'],
  ['어닝청소', 'awning-cleaning'],
  ['고압세척', 'pressure-wash'],
  ['시트지제거', 'window-sheet-removal'],
  ['필름제거', 'window-film-removal'],
  ['썬팅제거', 'tint-film-removal'],
  ['발수코팅', 'glass-water-repellent-coating'],
  ['특수청소', 'special-window-cleaning'],
  ['창틀청소', 'window-frame-cleaning'],
  ['물때제거', 'water-stain-removal'],
  ['백화제거', 'efflorescence-removal'],
  ['준공청소', 'post-construction-cleaning'],
  ['입주청소', 'move-in-window-cleaning'],
  ['유리창청소', 'window-cleaning'],
];

const CATEGORY_SLUG_MAP: Record<string, string> = {
  아파트: 'apartment-window-cleaning',
  '아파트·주택': 'apartment-window-cleaning',
  상가: 'store-window-cleaning',
  '상가·매장': 'store-window-cleaning',
  '사무실·빌딩': 'building-exterior-window-cleaning',
  빌딩: 'building-exterior-window-cleaning',
  '간판·어닝': 'sign-awning-cleaning',
  '간판,어닝청소': 'sign-awning-cleaning',
  '간판·어닝청소': 'sign-awning-cleaning',
  시트지제거: 'window-sheet-film-removal',
  기타: 'special-window-cleaning',
  '기타 특수청소': 'special-window-cleaning',
};

const REGION_SLUG_MAP: Record<string, string> = {
  서울: 'seoul',
  서울시: 'seoul',
  서울특별시: 'seoul',
  수도권: 'seoul-metro',
  서울수도권: 'seoul-metro',
  경기: 'gyeonggi',
  경기도: 'gyeonggi',
  인천: 'incheon',
  인천시: 'incheon',
  인천광역시: 'incheon',
  강남: 'gangnam',
  강남구: 'gangnam',
  서초: 'seocho',
  서초구: 'seocho',
  송파: 'songpa',
  송파구: 'songpa',
  강동: 'gangdong',
  강동구: 'gangdong',
  용산: 'yongsan',
  용산구: 'yongsan',
  성동: 'seongdong',
  성동구: 'seongdong',
  광진: 'gwangjin',
  광진구: 'gwangjin',
  마포: 'mapo',
  마포구: 'mapo',
  영등포: 'yeongdeungpo',
  영등포구: 'yeongdeungpo',
  양천: 'yangcheon',
  양천구: 'yangcheon',
  강서: 'gangseo',
  강서구: 'gangseo',
  구로: 'guro',
  구로구: 'guro',
  금천: 'geumcheon',
  금천구: 'geumcheon',
  관악: 'gwanak',
  관악구: 'gwanak',
  동작: 'dongjak',
  동작구: 'dongjak',
  종로: 'jongno',
  종로구: 'jongno',
  중구: 'junggu',
  서대문: 'seodaemun',
  서대문구: 'seodaemun',
  은평: 'eunpyeong',
  은평구: 'eunpyeong',
  성북: 'seongbuk',
  성북구: 'seongbuk',
  강북: 'gangbuk',
  강북구: 'gangbuk',
  도봉: 'dobong',
  도봉구: 'dobong',
  노원: 'nowon',
  노원구: 'nowon',
  중랑: 'jungnang',
  중랑구: 'jungnang',
  동대문: 'dongdaemun',
  동대문구: 'dongdaemun',
  분당: 'bundang',
  분당구: 'bundang',
  성남: 'seongnam',
  성남시: 'seongnam',
  판교: 'pangyo',
  용인: 'yongin',
  용인시: 'yongin',
  수지: 'suji',
  수지구: 'suji',
  기흥: 'giheung',
  기흥구: 'giheung',
  수원: 'suwon',
  수원시: 'suwon',
  광교: 'gwanggyo',
  화성: 'hwaseong',
  화성시: 'hwaseong',
  동탄: 'dongtan',
  안양: 'anyang',
  안양시: 'anyang',
  평촌: 'pyeongchon',
  과천: 'gwacheon',
  과천시: 'gwacheon',
  의왕: 'uiwang',
  군포: 'gunpo',
  안산: 'ansan',
  시흥: 'siheung',
  시흥시: 'siheung',
  배곧: 'baegot',
  부천: 'bucheon',
  광명: 'gwangmyeong',
  김포: 'gimpo',
  고양: 'goyang',
  일산: 'ilsan',
  파주: 'paju',
  하남: 'hanam',
  위례: 'wirye',
  미사: 'misa',
  구리: 'guri',
  남양주: 'namyangju',
  다산: 'dasan',
  의정부: 'uijeongbu',
  송도: 'songdo',
  청라: 'cheongna',
  부평: 'bupyeong',
  부평구: 'bupyeong',
  연수: 'yeonsu',
  연수구: 'yeonsu',
  남동: 'namdong',
  남동구: 'namdong',
  문정: 'munjeong',
  문정동: 'munjeong',
  잠실: 'jamsil',
  평택: 'pyeongtaek',
  오산: 'osan',
};

const HANGUL_INITIALS = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];
const HANGUL_MEDIALS = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];
const HANGUL_FINALS = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't',
];

function romanizeHangul(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = code - 0xac00;
      const initial = Math.floor(idx / 588);
      const medial = Math.floor((idx % 588) / 28);
      const final = idx % 28;
      out += HANGUL_INITIALS[initial] + HANGUL_MEDIALS[medial] + HANGUL_FINALS[final];
    } else {
      out += ch;
    }
  }
  return out;
}

export function isRawCameraFilename(name: string): boolean {
  const base = name
    .trim()
    .replace(/^.*\//, '')
    .replace(/\?.*$/, '')
    .replace(/\.[^.]+$/, '')
    .replace(/-framed$/i, '');

  if (!base) return true;
  if (/^\d{6,}([_-]\d+)*$/.test(base)) return true;
  if (/^(img|dsc|pxl|mvimg|photo|pic|image|screenshot|screen[-_ ]?shot|kakaotalk|bandphoto|snow|b612|camera|framed[-_ ]?image)([-_ ]?[0-9a-f]+)*$/i.test(base)) {
    return true;
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(base)) return true;
  return false;
}

function toAsciiSlug(raw: string, maxLen = 40): string {
  const romanized = romanizeHangul(raw.toLowerCase());
  return romanized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen)
    .replace(/-$/g, '');
}

function resolveRegionSlug(region?: string): string {
  if (!region) return '';
  const cleaned = region
    .replace(/현장|지역|일대|전지역/g, ' ')
    .replace(/[·,/\\()]+/g, ' ')
    .trim();
  if (!cleaned) return '';

  const compact = cleaned.replace(/\s+/g, '');
  if (REGION_SLUG_MAP[compact]) return REGION_SLUG_MAP[compact];

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const mapped: string[] = [];
  for (const token of tokens) {
    const direct = REGION_SLUG_MAP[token] || REGION_SLUG_MAP[token.replace(/[시군구동읍면]$/, '')];
    const slug = direct || toAsciiSlug(token, 18);
    if (slug && !mapped.includes(slug)) {
      mapped.push(slug);
    }
    if (mapped.length >= 2) break;
  }
  return mapped.join('-');
}

function resolveWorkSlug(input: SeoImageFilenameInput): string {
  if (input.serviceId && SERVICE_ID_SLUG_MAP[input.serviceId.trim()]) {
    return SERVICE_ID_SLUG_MAP[input.serviceId.trim()];
  }

  const combined = `${input.title || ''} ${input.tag || ''} ${input.category || ''}`
    .replace(/\s+/g, '')
    .replace(/[·,/\\()[\]]+/g, '');

  for (const [term, slug] of WORK_TERM_SLUG_PAIRS) {
    if (combined.includes(term)) {
      return slug;
    }
  }

  const catKey = (input.category || '').trim();
  if (catKey && CATEGORY_SLUG_MAP[catKey]) {
    return CATEGORY_SLUG_MAP[catKey];
  }

  const tagKey = (input.tag || '').trim();
  if (tagKey && CATEGORY_SLUG_MAP[tagKey]) {
    return CATEGORY_SLUG_MAP[tagKey];
  }

  if (input.title && !isRawCameraFilename(input.title)) {
    const titleSlug = toAsciiSlug(input.title, 32);
    if (titleSlug) return titleSlug;
  }

  return '';
}

function resolvePageKeySlug(pageKey?: string): string {
  if (!pageKey || pageKey === 'home' || pageKey === 'main') return 'main';
  if (pageKey === 'gallery') return 'gallery';
  if (pageKey.startsWith('service:')) {
    const srvId = pageKey.slice('service:'.length);
    return SERVICE_ID_SLUG_MAP[srvId] || toAsciiSlug(srvId, 28) || 'service';
  }
  if (pageKey.startsWith('region:')) {
    const reg = pageKey.slice('region:'.length);
    return resolveRegionSlug(reg) || 'region';
  }
  if (pageKey.startsWith('matrix:')) {
    const rest = pageKey.slice('matrix:'.length);
    const lastColon = rest.lastIndexOf(':');
    if (lastColon > 0) {
      const regSlug = resolveRegionSlug(rest.slice(0, lastColon));
      const srvId = rest.slice(lastColon + 1);
      const srvSlug = SERVICE_ID_SLUG_MAP[srvId] || toAsciiSlug(srvId, 24);
      return [regSlug, srvSlug].filter(Boolean).join('-') || 'region-service';
    }
  }
  return toAsciiSlug(pageKey, 32) || 'page';
}

/**
 * Builds a clean, lowercase, ASCII kebab-case SEO filename for ANY image upload
 * or replacement across the website (e.g. `clearworks-apartment-window-cleaning.jpg`).
 */
export function buildSeoImageFilename(input: SeoImageFilenameInput): {
  baseName: string;
  filename: string;
} {
  const brandSlug = toAsciiSlug(input.brand || 'clearworks', 16) || 'clearworks';
  const parts: string[] = [brandSlug];

  const pushUnique = (seg: string) => {
    const clean = seg
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!clean) return;
    const joinedSoFar = parts.join('-');
    if (joinedSoFar.includes(clean)) return;
    parts.push(clean);
  };

  if (input.section === 'hero') {
    pushUnique('hero');
    pushUnique('window-cleaning');
  } else if (input.section === 'og') {
    pushUnique('og');
    pushUnique(resolvePageKeySlug(input.pageKey));
  } else {
    const regionSlug = resolveRegionSlug(input.region);
    if (regionSlug) pushUnique(regionSlug);

    const workSlug = resolveWorkSlug(input);
    if (workSlug) {
      pushUnique(workSlug);
    } else if (input.section === 'showcase') {
      pushUnique('showcase-window-cleaning');
    } else if (input.section === 'review') {
      pushUnique('customer-review-window-cleaning');
    } else if (input.section === 'gallery') {
      pushUnique('window-cleaning-worklog');
    } else {
      pushUnique(toAsciiSlug(input.fallback || 'window-cleaning', 28) || 'window-cleaning');
    }
  }

  if (input.role === 'before' || input.role === 'after') {
    pushUnique(input.role);
  } else if (input.role === 'cover' && input.section === 'gallery') {
    pushUnique('cover');
  }

  const baseName = parts
    .join('-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 68)
    .replace(/-$/g, '') || 'clearworks-window-cleaning';

  return {
    baseName,
    filename: `${baseName}.jpg`,
  };
}

/**
 * Builds a web/SEO-friendly filename for gallery worklog photos.
 */
export function buildWorkLogImageFilename(input: WorkLogImageNameInput): {
  baseName: string;
  filename: string;
} {
  return buildSeoImageFilename({
    section: 'gallery',
    region: input.region || '서울수도권',
    category: input.category,
    title: input.title,
  });
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0KB';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function estimateBase64Bytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const b64 = dataUrl.slice(commaIdx + 1);
  return Math.round((b64.length * 3) / 4);
}

function clampByte(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : Math.round(value);
}

/**
 * 경량 3x3 언샤프/선명화 + 미세 대비 보정으로 오염 텍스처(물때·분진·매연·거미줄)나
 * 시공 후 투명감을 자연스럽게 강조합니다.
 */
function applyCanvasEnhancement(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: ImageEnhancementMode
): void {
  if (mode === 'natural' || width < 4 || height < 4) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);

  if (mode === 'contamination') {
    // 1) 미세 대비(1.16) + 중명부 살짝 눌러 밝은 유리 위의 분진·물때·자국 분리
    const contrast = 1.16;
    const gamma = 1.04;
    const sharpAmount = 0.34;
    const temp = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = src[i + c] / 255;
        v = Math.pow(v, gamma);
        v = (v - 0.5) * contrast + 0.5;
        temp[i + c] = clampByte(v * 255);
      }
      temp[i + 3] = src[i + 3];
    }

    // 2) 경량 4-이웃 언샤프 선명화로 미세 오염 질감 강조
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          out[idx] = temp[idx];
          out[idx + 1] = temp[idx + 1];
          out[idx + 2] = temp[idx + 2];
          out[idx + 3] = temp[idx + 3];
          continue;
        }
        const up = ((y - 1) * width + x) * 4;
        const down = ((y + 1) * width + x) * 4;
        const left = (y * width + (x - 1)) * 4;
        const right = (y * width + (x + 1)) * 4;

        for (let c = 0; c < 3; c++) {
          const center = temp[idx + c];
          const avgNeighbor =
            (temp[up + c] + temp[down + c] + temp[left + c] + temp[right + c]) * 0.25;
          const sharpened = center + (center - avgNeighbor) * sharpAmount;
          out[idx + c] = clampByte(sharpened);
        }
        out[idx + 3] = temp[idx + 3];
      }
    }

    imageData.data.set(out);
    ctx.putImageData(imageData, 0, 0);
    return;
  }

  if (mode === 'clarity-after') {
    // 시공 후 전경용 가벼운 투명감·채광 대비 정리 (과도한 보정 배제)
    const contrast = 1.07;
    const brightness = 4;
    const sharpAmount = 0.18;
    const temp = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const v = (src[i + c] - 128) * contrast + 128 + brightness;
        temp[i + c] = clampByte(v);
      }
      temp[i + 3] = src[i + 3];
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          out[idx] = temp[idx];
          out[idx + 1] = temp[idx + 1];
          out[idx + 2] = temp[idx + 2];
          out[idx + 3] = temp[idx + 3];
          continue;
        }
        const up = ((y - 1) * width + x) * 4;
        const down = ((y + 1) * width + x) * 4;
        const left = (y * width + (x - 1)) * 4;
        const right = (y * width + (x + 1)) * 4;
        for (let c = 0; c < 3; c++) {
          const center = temp[idx + c];
          const avgNeighbor =
            (temp[up + c] + temp[down + c] + temp[left + c] + temp[right + c]) * 0.25;
          out[idx + c] = clampByte(center + (center - avgNeighbor) * sharpAmount);
        }
        out[idx + 3] = temp[idx + 3];
      }
    }

    imageData.data.set(out);
    ctx.putImageData(imageData, 0, 0);
  }
}

function resolveTrimPercentages(options?: WorkLogImageOptimizeOptions): {
  topPercent: number;
  bottomPercent: number;
} {
  const presetMap: Record<WatermarkTrimPreset, number> = {
    none: 0,
    'bottom-8': 8,
    'bottom-14': 14,
    'bottom-20': 20,
  };
  const presetBottom = options?.watermarkTrim ? presetMap[options.watermarkTrim] : 0;
  const topPercent = Math.min(25, Math.max(0, options?.topTrimPercent ?? 0));
  const bottomPercent = Math.min(
    30,
    Math.max(0, options?.bottomTrimPercent ?? presetBottom)
  );
  return { topPercent, bottomPercent };
}

function renderToJpeg(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number,
  options?: WorkLogImageOptimizeOptions
): { dataUrl: string; width: number; height: number; bytes: number } {
  const { topPercent, bottomPercent } = resolveTrimPercentages(options);
  const srcX = 0;
  const srcY = Math.round((img.height * topPercent) / 100);
  const srcWidth = img.width;
  const trimmedBottomPx = Math.round((img.height * bottomPercent) / 100);
  const srcHeight = Math.max(20, img.height - srcY - trimmedBottomPx);

  // 트림 이후 남은 원본 비율 그대로 스케일링 (확대/왜곡 없음)
  const longest = Math.max(srcWidth, srcHeight);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', width, height, bytes: 0 };
  }

  // 투명 PNG 업로드 시 검은 배경 방지
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, width, height);

  applyCanvasEnhancement(ctx, width, height, options?.enhancementMode ?? 'natural');

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return {
    dataUrl,
    width,
    height,
    bytes: estimateBase64Bytes(dataUrl),
  };
}

/**
 * 작업갤러리 가이드라인(워터마크 최소 트림 · 원본 비율 유지 · 전체 배경 보존 · 오염/투명감 보정)을
 * 적용해 웹 최적화 JPEG(<= ~240KB 목표, 최대 1440px)와 `지역명_작업유형.jpg` 파일명을 생성합니다.
 */
export function optimizeWorkLogImage(
  file: File,
  nameInput: WorkLogImageNameInput,
  targetMaxBytes = 240 * 1024,
  options?: WorkLogImageOptimizeOptions
): Promise<OptimizedWorkLogImage> {
  const { baseName, filename } = buildWorkLogImageFilename(nameInput);
  const maxDimension = options?.maxDimension ?? 1440;
  const { topPercent, bottomPercent } = resolveTrimPercentages(options);
  const enhancementMode = options?.enhancementMode ?? 'natural';

  const appliedNotes: string[] = [];
  if (bottomPercent > 0) appliedNotes.push(`하단 워터마크 ${bottomPercent}% 제거`);
  if (topPercent > 0) appliedNotes.push(`상단 여백 ${topPercent}% 제거`);
  if (enhancementMode === 'contamination') appliedNotes.push('오염 디테일 강조 보정');
  else if (enhancementMode === 'clarity-after') appliedNotes.push('시공 후 투명감 보정');
  else appliedNotes.push('무보정 원본 화질');

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!rawDataUrl) {
        resolve({
          dataUrl: '',
          filename,
          baseName,
          originalBytes: file.size,
          compressedBytes: 0,
          width: 0,
          height: 0,
          appliedNotes,
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        const qualitySteps = [0.86, 0.78, 0.7, 0.62];
        let best = renderToJpeg(img, maxDimension, qualitySteps[0], options);

        if (!best.dataUrl) {
          resolve({
            dataUrl: rawDataUrl,
            filename,
            baseName,
            originalBytes: file.size,
            compressedBytes: estimateBase64Bytes(rawDataUrl),
            width: img.width,
            height: img.height,
            appliedNotes,
          });
          return;
        }

        for (let i = 1; i < qualitySteps.length && best.bytes > targetMaxBytes; i++) {
          best = renderToJpeg(img, maxDimension, qualitySteps[i], options);
        }

        // 고밀도 텍스처가 320KB 이상인 경우 원본 비율 유지 상태로 1180px까지 한 단계 축소
        if (best.bytes > 320 * 1024) {
          const smaller = renderToJpeg(img, 1180, 0.72, options);
          if (smaller.dataUrl && smaller.bytes < best.bytes) {
            best = smaller;
          }
        }

        resolve({
          dataUrl: best.dataUrl,
          filename,
          baseName,
          originalBytes: file.size,
          compressedBytes: best.bytes,
          width: best.width,
          height: best.height,
          appliedNotes: [...appliedNotes, `원본 비율 유지(${best.width}×${best.height})`],
        });
      };

      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          filename,
          baseName,
          originalBytes: file.size,
          compressedBytes: estimateBase64Bytes(rawDataUrl),
          width: 0,
          height: 0,
          appliedNotes,
        });
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

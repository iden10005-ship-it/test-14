import type { GalleryPost } from '@/src/types/clearworks';

export const DEFAULT_GALLERY_REGIONS: string[] = [
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
  '수원시',
  '수원 영통구',
  '수원 권선구',
  '수원 장안구',
  '수원 팔달구',
  '성남시',
  '성남 분당구',
  '성남 수정구',
  '성남 중원구',
  '고양시',
  '고양 일산동구',
  '고양 일산서구',
  '고양 덕양구',
  '용인시',
  '용인 수지구',
  '용인 기흥구',
  '용인 처인구',
  '부천시',
  '부천 원미구',
  '부천 소사구',
  '부천 오정구',
  '안산시',
  '안산 단원구',
  '안산 상록구',
  '안양시',
  '안양 동안구',
  '안양 만안구',
  '남양주시',
  '화성시',
  '평택시',
  '의정부시',
  '시흥시',
  '파주시',
  '김포시',
  '광명시',
  '광주시',
  '군포시',
  '오산시',
  '이천시',
  '양주시',
  '안성시',
  '구리시',
  '의왕시',
  '하남시',
  '포천시',
  '여주시',
  '과천시',
  '양평군',
  '가평군',
  '연천군',
  '인천 연수구',
  '인천 서구',
  '인천 부평구',
];

const SEOUL_DISTRICT_SET = new Set([
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

export interface RegionGroup {
  label: string;
  items: string[];
}

export function getAvailableGalleryRegions(regions?: string[]): string[] {
  const source = regions && regions.length > 0 ? regions : DEFAULT_GALLERY_REGIONS;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of source) {
    const clean = (item || '').trim().replace(/\s+/g, ' ');
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out.length > 0 ? out : [...DEFAULT_GALLERY_REGIONS];
}

export function groupGalleryRegions(regions?: string[]): RegionGroup[] {
  const list = getAvailableGalleryRegions(regions);
  const seoul: string[] = [];
  const incheon: string[] = [];
  const gyeonggiAndOther: string[] = [];

  for (const r of list) {
    if (SEOUL_DISTRICT_SET.has(r) || r.startsWith('서울 ')) {
      seoul.push(r);
    } else if (r.startsWith('인천')) {
      incheon.push(r);
    } else {
      gyeonggiAndOther.push(r);
    }
  }

  const groups: RegionGroup[] = [];
  if (seoul.length > 0) groups.push({ label: '서울특별시 (자치구)', items: seoul });
  if (gyeonggiAndOther.length > 0) groups.push({ label: '경기도 (시·구 단위)', items: gyeonggiAndOther });
  if (incheon.length > 0) groups.push({ label: '인천광역시', items: incheon });
  return groups;
}

/**
 * Maps legacy free-text regions like "서울 강남구" or "경기 용인 수지구"
 * to the canonical region detail key (e.g. "강남구", "용인 수지구").
 */
export function normalizeRegionToDetailKey(rawRegion: string, regions?: string[]): string {
  const list = getAvailableGalleryRegions(regions);
  const clean = (rawRegion || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';

  if (list.includes(clean)) return clean;

  const stripped = clean
    .replace(/^(서울특별시|서울시|서울|경기도|경기|인천광역시|인천시)\s+/, '')
    .trim();
  if (stripped && list.includes(stripped)) {
    return stripped;
  }

  // Fallback: match when canonical region appears as a standalone segment
  const byBoundary = list.find((candidate) => hasBoundaryMatch(clean, candidate));
  return byBoundary || clean;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasBoundaryMatch(text: string, token: string): boolean {
  if (!text || !token) return false;
  const escaped = escapeRegExp(token);
  const pattern = new RegExp(`(?:^|[\\s·,/(\\[\\-])${escaped}(?:$|[\\s·,/)\\]\\-])`);
  return pattern.test(text);
}

function getProvinceOfRegion(regionName: string): 'seoul' | 'incheon' | 'gyeonggi' | null {
  const clean = regionName.trim();
  if (!clean) return null;
  if (SEOUL_DISTRICT_SET.has(clean) || clean.startsWith('서울')) return 'seoul';
  if (clean.startsWith('인천')) return 'incheon';
  if (
    /[시군]$/.test(clean) ||
    /^(수원|성남|고양|용인|부천|안산|안양)\s+/.test(clean) ||
    clean.startsWith('경기')
  ) {
    return 'gyeonggi';
  }
  return null;
}

function getCityRoot(canonicalRegion: string): string {
  const clean = canonicalRegion.trim();
  if (!clean) return '';
  if (clean.startsWith('인천 ')) return '인천';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return parts[0].replace(/시$/, '');
  }
  if (clean.endsWith('시') && !SEOUL_DISTRICT_SET.has(clean)) {
    return clean.slice(0, -1);
  }
  return '';
}

function parsePostDateNumber(dateStr: string): number {
  const digits = (dateStr || '').replace(/\D/g, '');
  if (digits.length >= 8) {
    return Number(digits.slice(0, 8)) || 0;
  }
  return 0;
}

export function scorePostForRegion(
  post: GalleryPost,
  targetRegionName: string,
  subDistricts: string[] = [],
  allRegions?: string[]
): number {
  const target = targetRegionName.trim();
  if (!target) return 0;

  const list = getAvailableGalleryRegions(allRegions);
  const canonicalPostRegion = normalizeRegionToDetailKey(post.region || '', list);
  const postRegionRaw = (post.region || '').trim();
  const title = post.title || '';
  const tagsText = Array.isArray(post.tags) ? post.tags.join(' ') : '';
  const excerpt = post.excerpt || '';

  let score = 0;

  // Tier 1: Direct match to this region detail page (e.g., "강남구" or "서울 강남구" on 강남구 page)
  if (canonicalPostRegion === target || (postRegionRaw && postRegionRaw === target)) {
    score += 1000;
  } else {
    // Tier 2: Target region explicitly named in title or tags
    const targetCore = target.length >= 3 ? target.replace(/[시군구]$/, '') : target;
    if (hasBoundaryMatch(title, target) || (target.length >= 3 && title.includes(target))) {
      score += 450;
    } else if (targetCore.length >= 3 && title.includes(targetCore)) {
      score += 220;
    }

    if (hasBoundaryMatch(tagsText, target) || (target.length >= 3 && tagsText.includes(target))) {
      score += 260;
    }

    // Tier 3: Same parent city (e.g. "수원시" <-> "수원 영통구" / "수원 권선구")
    const targetCity = getCityRoot(target);
    const postCity = getCityRoot(canonicalPostRegion);
    if (targetCity && postCity && targetCity === postCity) {
      if (target.endsWith('시') || canonicalPostRegion.endsWith('시')) {
        score += 200;
      } else {
        score += 140;
      }
    }

    // Tier 3.5: Sub-district (동/읍/면) matches in post title / excerpt / tags
    for (const rawSub of subDistricts) {
      const subClean = rawSub.replace(/\(.*\)/g, '').trim();
      const subCore = subClean.replace(/[동리읍면]$/, '');
      if (subCore.length < 2) continue;
      if (title.includes(subClean) || (subCore.length >= 2 && hasBoundaryMatch(title, subCore))) {
        score += 120;
      } else if (tagsText.includes(subClean) || excerpt.includes(subClean)) {
        score += 60;
      }
    }

    // Tier 4: Same metro province tiebreaker (서울 / 경기 / 인천)
    const targetProv = getProvinceOfRegion(target);
    const postProv = getProvinceOfRegion(canonicalPostRegion || postRegionRaw);
    if (targetProv && postProv && targetProv === postProv) {
      score += 15;
    }
  }

  return score;
}

export function getFeaturedPostsForRegion(
  posts: GalleryPost[],
  targetRegionName: string,
  subDistricts: string[] = [],
  allRegions?: string[],
  limit = 6
): GalleryPost[] {
  const scored = posts.map((post, idx) => ({
    post,
    score: scorePostForRegion(post, targetRegionName, subDistricts, allRegions),
    dateNum: parsePostDateNumber(post.date),
    idx,
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.dateNum !== a.dateNum) return b.dateNum - a.dateNum;
    return a.idx - b.idx;
  });

  return scored.slice(0, limit).map((item) => item.post);
}

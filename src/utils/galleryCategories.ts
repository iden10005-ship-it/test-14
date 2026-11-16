export const DEFAULT_GALLERY_CATEGORIES: string[] = [
  '아파트·주택',
  '상가·매장',
  '빌딩',
  '간판·어닝청소',
  '시트지제거',
  '기타',
];

export function normalizeGalleryCategory(category: string): string {
  const trimmed = (category || '').trim();
  if (!trimmed) return '';
  if (trimmed === '간판,어닝청소') return '간판·어닝청소';
  return trimmed.replace(/\s+/g, ' ');
}

export function getGalleryCategories(categories?: string[]): string[] {
  if (!categories || categories.length === 0) {
    return [...DEFAULT_GALLERY_CATEGORIES];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of categories) {
    const clean = normalizeGalleryCategory(raw);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out.length > 0 ? out : [...DEFAULT_GALLERY_CATEGORIES];
}

function matchesDefaultAlias(postCatLower: string, selectedNormalized: string): boolean {
  if (selectedNormalized === '아파트' || selectedNormalized === '아파트·주택') {
    return postCatLower.includes('아파트') || postCatLower.includes('주택');
  }
  if (selectedNormalized === '상가' || selectedNormalized === '상가·매장') {
    return (
      postCatLower.includes('상가') ||
      postCatLower.includes('매장') ||
      postCatLower.includes('점포')
    );
  }
  if (selectedNormalized === '빌딩') {
    return postCatLower.includes('빌딩') || postCatLower.includes('외벽');
  }
  if (selectedNormalized === '간판·어닝청소') {
    return postCatLower.includes('간판') || postCatLower.includes('어닝');
  }
  if (selectedNormalized === '시트지제거') {
    return (
      postCatLower.includes('시트지') ||
      postCatLower.includes('썬팅') ||
      postCatLower.includes('스티커') ||
      postCatLower.includes('필름')
    );
  }
  return false;
}

export function matchesGalleryCategory(
  postCategory: string,
  selectedCategory: string,
  allCategories: string[] = DEFAULT_GALLERY_CATEGORIES
): boolean {
  if (selectedCategory === '전체') return true;
  const postNorm = normalizeGalleryCategory(postCategory);
  const selectedNorm = normalizeGalleryCategory(selectedCategory);
  if (!selectedNorm) return true;
  if (postNorm.toLowerCase() === selectedNorm.toLowerCase()) return true;

  const postLower = postNorm.toLowerCase();
  if (matchesDefaultAlias(postLower, selectedNorm)) return true;

  if (selectedNorm === '기타') {
    const matchedAnother = allCategories.some(
      (cat) =>
        normalizeGalleryCategory(cat) !== '기타' &&
        (normalizeGalleryCategory(cat).toLowerCase() === postLower ||
          matchesDefaultAlias(postLower, normalizeGalleryCategory(cat)))
    );
    return postLower.includes('기타') || postLower.includes('특수') || !matchedAnother;
  }

  return false;
}

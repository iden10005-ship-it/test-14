/**
 * Resolves root-relative public asset URLs (e.g. "/images/hero_after.jpg")
 * against the active document base URI so assets work both at root domains
 * (Vercel, custom domain) and subpath deployments (GitHub Pages /repo-name/).
 */
export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const base = import.meta.env.BASE_URL || '/';
  if (trimmed.startsWith('/')) {
    if (base.startsWith('/')) {
      const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
      return `${normalizedBase}${trimmed}`;
    }
    if (typeof document !== 'undefined' && document.baseURI) {
      try {
        return new URL(trimmed.slice(1), document.baseURI).pathname;
      } catch {
        return `.${trimmed}`;
      }
    }
    return `.${trimmed}`;
  }
  if (
    base.startsWith('/') &&
    (trimmed.startsWith('images/') ||
      trimmed.startsWith('uploads/') ||
      trimmed.startsWith('assets/'))
  ) {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${normalizedBase}/${trimmed}`;
  }
  return trimmed;
}

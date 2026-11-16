export interface WorkLogImageNameInput {
  region?: string;
  category?: string;
  title?: string;
}

export interface OptimizedWorkLogImage {
  dataUrl: string;
  filename: string;
  baseName: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
}

const SPECIFIC_WORK_TERMS = [
  '어닝청소',
  '간판청소',
  '외창청소',
  '유리창청소',
  '통유리청소',
  '외벽청소',
  '고압세척',
  '시트지제거',
  '썬팅제거',
  '필름제거',
  '발수코팅',
  '창틀청소',
  '물때제거',
  '백화제거',
  '준공청소',
];

const CATEGORY_WORKTYPE_MAP: Record<string, string> = {
  아파트: '아파트외창청소',
  '아파트·주택': '아파트외창청소',
  상가: '상가유리창청소',
  '상가·매장': '상가유리창청소',
  빌딩: '빌딩외벽청소',
  '간판,어닝청소': '간판어닝청소',
  '간판·어닝청소': '간판어닝청소',
  시트지제거: '시트지제거',
  기타: '특수청소',
};

function sanitizeFileSegment(raw: string, fallback: string): string {
  const cleaned = raw
    .trim()
    .replace(/[\s·,/\\]+/g, '-')
    .replace(/[^가-힣a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
  return cleaned || fallback;
}

/**
 * Builds a web/SEO-friendly filename in the format `지역명_작업유형.jpg`.
 */
export function buildWorkLogImageFilename(input: WorkLogImageNameInput): {
  baseName: string;
  filename: string;
} {
  const safeRegion = sanitizeFileSegment(input.region || '', '서울수도권');

  const normalizedTitle = (input.title || '').replace(/\s+/g, '');
  const matchedTerm = SPECIFIC_WORK_TERMS.find((term) =>
    normalizedTitle.includes(term.replace(/\s+/g, ''))
  );
  const rawWorkType =
    matchedTerm ||
    CATEGORY_WORKTYPE_MAP[(input.category || '').trim()] ||
    (input.category || '').trim() ||
    '유리창청소';

  const safeWorkType = sanitizeFileSegment(rawWorkType, '유리창청소');
  const baseName = `${safeRegion}_${safeWorkType}`;
  return {
    baseName,
    filename: `${baseName}.jpg`,
  };
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

function renderToJpeg(
  img: HTMLImageElement,
  maxDimension: number,
  quality: number
): { dataUrl: string; width: number; height: number; bytes: number } {
  const longest = Math.max(img.width, img.height);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', width, height, bytes: 0 };
  }

  // Fill white canvas so transparent PNGs convert cleanly to JPEG without black artifacts
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return {
    dataUrl,
    width,
    height,
    bytes: estimateBase64Bytes(dataUrl),
  };
}

/**
 * Compresses an uploaded image file to a web-optimized JPEG (<= ~220KB target, max 1280px)
 * and assigns a `지역명_작업유형.jpg` filename.
 */
export function optimizeWorkLogImage(
  file: File,
  nameInput: WorkLogImageNameInput,
  targetMaxBytes = 220 * 1024
): Promise<OptimizedWorkLogImage> {
  const { baseName, filename } = buildWorkLogImageFilename(nameInput);

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
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        const qualitySteps = [0.82, 0.74, 0.66, 0.58];
        let best = renderToJpeg(img, 1280, qualitySteps[0]);

        if (!best.dataUrl) {
          resolve({
            dataUrl: rawDataUrl,
            filename,
            baseName,
            originalBytes: file.size,
            compressedBytes: estimateBase64Bytes(rawDataUrl),
            width: img.width,
            height: img.height,
          });
          return;
        }

        for (let i = 1; i < qualitySteps.length && best.bytes > targetMaxBytes; i++) {
          best = renderToJpeg(img, 1280, qualitySteps[i]);
        }

        // If texture is still large above 300KB, step down dimensions slightly to 1080px
        if (best.bytes > 300 * 1024) {
          const smaller = renderToJpeg(img, 1080, 0.68);
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
        });
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

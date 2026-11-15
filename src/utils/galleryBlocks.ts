import type { GalleryBlock, GalleryPost } from '@/src/types/clearworks';

/**
 * Converts a GalleryPost into an ordered array of blog blocks (headings, paragraphs, images).
 * Supports both new block-based posts and legacy posts that only have content + beforeImage/afterImage.
 */
export function getPostBlocks(post: GalleryPost): GalleryBlock[] {
  if (Array.isArray(post.blocks) && post.blocks.length > 0) {
    return post.blocks;
  }

  const blocks: GalleryBlock[] = [];
  const paragraphs = post.content
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    if (post.beforeImage) {
      blocks.push({
        id: `${post.id}-before`,
        type: 'image',
        url: post.beforeImage,
        caption: `${post.title} - 시공 전 현장 모습`,
      });
    }
    if (post.afterImage) {
      blocks.push({
        id: `${post.id}-after`,
        type: 'image',
        url: post.afterImage,
        caption: `${post.title} - 시공 완료 후 모습`,
      });
    }
    return blocks;
  }

  let beforeInserted = false;
  let afterInserted = false;

  paragraphs.forEach((para, idx) => {
    const lines = para.split('\n');
    const firstLine = lines[0]?.trim() ?? '';
    if (firstLine.startsWith('■') || firstLine.startsWith('## ')) {
      blocks.push({
        id: `${post.id}-h-${idx}`,
        type: 'heading',
        text: firstLine.replace(/^■\s*|^##\s*/, '').trim(),
      });
      const rest = lines.slice(1).join('\n').trim();
      if (rest) {
        blocks.push({
          id: `${post.id}-t-${idx}`,
          type: 'text',
          text: rest,
        });
      }
    } else {
      blocks.push({
        id: `${post.id}-t-${idx}`,
        type: 'text',
        text: para,
      });
    }

    if (!beforeInserted && idx === 0 && post.beforeImage) {
      blocks.push({
        id: `${post.id}-before`,
        type: 'image',
        url: post.beforeImage,
        caption: '시공 전 현장 상태',
      });
      beforeInserted = true;
    }

    if (
      !afterInserted &&
      idx === paragraphs.length - 1 &&
      post.afterImage &&
      post.afterImage !== post.coverImage
    ) {
      blocks.push({
        id: `${post.id}-after`,
        type: 'image',
        url: post.afterImage,
        caption: '시공 완료 후 결과',
      });
      afterInserted = true;
    } else if (!afterInserted && idx === paragraphs.length - 1 && post.afterImage) {
      blocks.push({
        id: `${post.id}-after`,
        type: 'image',
        url: post.afterImage,
        caption: '시공 완료 후 투명하게 복원된 모습',
      });
      afterInserted = true;
    }
  });

  return blocks;
}

/**
 * Extracts plain text from blog blocks for search, excerpts, and SEO metadata.
 */
export function blocksToPlainContent(blocks: GalleryBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'heading') return b.text.trim() ? `■ ${b.text.trim()}` : '';
      if (b.type === 'text') return b.text.trim();
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export function getPostCoverImage(post: GalleryPost): string {
  if (post.coverImage?.trim()) return post.coverImage.trim();
  const firstImg = post.blocks?.find((b) => b.type === 'image' && b.url?.trim());
  if (firstImg && firstImg.type === 'image') return firstImg.url.trim();
  return post.afterImage || post.beforeImage || '';
}

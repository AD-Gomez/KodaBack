const ALLOWED_TAGS = new Set([
  'p', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote',
]);

export function sanitizeRichText(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*(\/?)\s*([a-z0-9]+)(?:\s[^>]*)?>/gi, (_tag, closing: string, name: string) => {
      const tag = name.toLowerCase();
      return ALLOWED_TAGS.has(tag) ? `<${closing ? '/' : ''}${tag}>` : '';
    });
}

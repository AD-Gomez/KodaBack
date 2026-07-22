const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'blockquote',
]);

function decodeCodePoint(entity: string, code: string, radix: number): string {
  const value = Number.parseInt(code, radix);
  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > 0x10ffff ||
    (value >= 0xd800 && value <= 0xdfff)
  ) {
    return entity;
  }
  return String.fromCodePoint(value);
}

export function decodeHtmlEntities(value: string): string {
  let decoded = value;

  // Algunos contratos existentes quedaron codificados más de una vez
  // (&amp;lt;br&amp;gt;). Se limita el número de pasadas para mantener el coste acotado.
  for (let i = 0; i < 5; i++) {
    const next = decoded
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&#x([0-9a-f]+);/gi, (entity, code: string) => decodeCodePoint(entity, code, 16))
      .replace(/&#(\d+);/g, (entity, code: string) => decodeCodePoint(entity, code, 10));

    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
}

export function sanitizeRichText(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*(\/?)\s*([a-z0-9]+)(?:\s[^>]*)?>/gi, (_tag, closing: string, name: string) => {
      const tag = name.toLowerCase();
      return ALLOWED_TAGS.has(tag) ? `<${closing ? '/' : ''}${tag}>` : '';
    });
}

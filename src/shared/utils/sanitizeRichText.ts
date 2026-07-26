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

const ALLOWED_TEXT_ALIGN = new Set(['left', 'right', 'center', 'justify']);

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
    .replace(
      /<\s*(\/?)\s*([a-z0-9]+)(?:\s+([^>]*))?>/gi,
      (_tag, closing: string, name: string, attributes = '') => {
        const tag = name.toLowerCase();
        if (!ALLOWED_TAGS.has(tag)) return '';
        if (closing || tag !== 'p') return `<${closing ? '/' : ''}${tag}>`;

        const style = /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(attributes);
        const textAlign = /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i
          .exec(style?.[1] ?? style?.[2] ?? style?.[3] ?? '')?.[1]
          ?.toLowerCase();

        return textAlign && ALLOWED_TEXT_ALIGN.has(textAlign)
          ? `<p style="text-align: ${textAlign}">`
          : '<p>';
      },
    );
}

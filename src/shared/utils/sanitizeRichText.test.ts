import { describe, expect, it } from 'vitest';

import { decodeHtmlEntities, sanitizeRichText } from './sanitizeRichText.js';

describe('sanitizeRichText', () => {
  it('recupera etiquetas permitidas aunque estén codificadas varias veces', () => {
    const value = '&amp;lt;b&amp;gt;ABOGADA&amp;lt;/b&amp;gt;&amp;lt;br&amp;gt;IPSA N° 164.416';

    expect(sanitizeRichText(value)).toBe('<b>ABOGADA</b><br>IPSA N° 164.416');
  });

  it('elimina etiquetas no permitidas después de decodificarlas', () => {
    expect(sanitizeRichText('&lt;script&gt;alerta&lt;/script&gt;<p>Contrato</p>')).toBe(
      'alerta<p>Contrato</p>',
    );
  });
});

describe('decodeHtmlEntities', () => {
  it('decodifica entidades nominales, decimales y hexadecimales', () => {
    expect(decodeHtmlEntities('&amp;lt;br&amp;gt; &#60;b&#62; &#x41;')).toBe('<br> <b> A');
  });

  it('no falla ante puntos de código inválidos', () => {
    expect(decodeHtmlEntities('Contrato &#999999999;')).toBe('Contrato &#999999999;');
  });
});

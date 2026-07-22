import { describe, expect, it } from 'vitest';

import { parseInlineSegments } from './contractPdf.js';

describe('parseInlineSegments', () => {
  it('no imprime etiquetas vacías alrededor de un salto de línea', () => {
    expect(parseInlineSegments('<b>')).toEqual([]);

    expect(parseInlineSegments('</b><b>UVINEIDIS CARABALLO</b> <b>ABOGADA</b>')).toEqual([
      {
        text: 'UVINEIDIS CARABALLO',
        format: { bold: true, italic: false, underline: false },
      },
      {
        text: ' ',
        format: { bold: false, italic: false, underline: false },
      },
      {
        text: 'ABOGADA',
        format: { bold: true, italic: false, underline: false },
      },
    ]);
  });
});

import { describe, expect, it } from 'vitest';

import { getBlockTextAlign, parseInlineSegments } from './contractPdf.js';

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

describe('getBlockTextAlign', () => {
  it('conserva la justificación guardada por el editor', () => {
    expect(getBlockTextAlign(' style="text-align: justify"')).toBe('justify');
  });

  it('mantiene los demás valores admitidos y usa izquierda por defecto', () => {
    expect(getBlockTextAlign('style="text-align: center"')).toBe('center');
    expect(getBlockTextAlign()).toBe('left');
  });
});

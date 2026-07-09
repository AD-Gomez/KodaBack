import { describe, it, expect } from 'vitest';

import { getPagination, paginate } from './pagination.js';

describe('pagination utils', () => {
  it('debería aplicar defaults seguros', () => {
    expect(getPagination()).toEqual({ page: 1, limit: 20 });
    expect(getPagination(undefined, undefined)).toEqual({ page: 1, limit: 20 });
  });

  it('debería clamp valores fuera de rango', () => {
    expect(getPagination(-5, 99999)).toEqual({ page: 1, limit: 100 });
    expect(getPagination(undefined, undefined)).toEqual({ page: 1, limit: 20 });
  });

  it('debería calcular totales correctamente', () => {
    const result = paginate([1, 2, 3], 25, { page: 1, limit: 10 });
    expect(result.pagination.totalPages).toBe(3);
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('debería marcar hasPrev en páginas > 1', () => {
    const result = paginate([1, 2, 3], 25, { page: 2, limit: 10 });
    expect(result.pagination.hasPrev).toBe(true);
    expect(result.pagination.hasNext).toBe(true);
  });
});
import { describe, it, expect } from 'vitest';

import { listDepartamentosQuerySchema, createDepartamentoSchema } from './departamentoValidators.js';

describe('departamentoValidators', () => {
  it('debería aplicar defaults en list query', () => {
    const result = listDepartamentosQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('debería rechazar estado inválido', () => {
    expect(() => listDepartamentosQuerySchema.parse({ estado: 'INVENTADO' })).toThrow();
  });

  it('debería aceptar un create válido', () => {
    const input = {
      nombre: 'TEST',
      direccion: 'Calle 1',
      montoCompra: 1000,
      alquiler: 100,
      distribucion: '50m²',
      inmobiliario: 'Nada',
    };
    expect(() => createDepartamentoSchema.parse(input)).not.toThrow();
  });

  it('debería rechazar alquiler cero', () => {
    const input = {
      nombre: 'TEST',
      direccion: 'Calle 1',
      montoCompra: 1000,
      alquiler: 0,
      distribucion: '50m²',
      inmobiliario: 'Nada',
    };
    expect(() => createDepartamentoSchema.parse(input)).toThrow();
  });

  it('debería aceptar un enlace directo de Google Sheets', () => {
    const input = {
      nombre: 'TEST',
      direccion: 'Calle 1',
      montoCompra: 1000,
      alquiler: 100,
      distribucion: '50m²',
      inmobiliario: 'Nada',
      sheet: 'https://docs.google.com/spreadsheets/d/example/edit?gid=123',
    };
    expect(() => createDepartamentoSchema.parse(input)).not.toThrow();
  });

  it('debería rechazar una URL que no sea de Google Sheets', () => {
    const input = {
      nombre: 'TEST',
      direccion: 'Calle 1',
      montoCompra: 1000,
      alquiler: 100,
      distribucion: '50m²',
      inmobiliario: 'Nada',
      sheet: 'https://example.com/archivo',
    };
    expect(() => createDepartamentoSchema.parse(input)).toThrow();
  });
});

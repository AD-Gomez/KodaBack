import { afterEach, vi } from 'vitest';

// Silenciar logs durante tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => {
  vi.clearAllMocks();
});
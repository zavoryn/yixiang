import { describe, expect, it, vi } from 'vitest';
import { buildSseUrl } from './sse';

describe('buildSseUrl', () => {
  it('adds access_token and preserves existing params', () => {
    expect(buildSseUrl('/api/v1/knowposts/99/qa/stream?question=hello', 'token-1')).toBe(
      '/api/v1/knowposts/99/qa/stream?question=hello&access_token=token-1',
    );
  });

  it('keeps backend origin when api base URL is absolute', async () => {
    vi.resetModules();
    vi.doMock('./env', () => ({
      env: { apiBaseUrl: 'http://localhost:8080', isDev: true },
    }));
    const imported = await import('./sse');

    expect(imported.buildSseUrl('/api/v1/notifications/stream', 'token-1')).toBe(
      'http://localhost:8080/api/v1/notifications/stream?access_token=token-1',
    );
    vi.doUnmock('./env');
  });
});

import { describe, expect, it } from 'vitest';
import { buildSseUrl } from './sse';

describe('buildSseUrl', () => {
  it('adds access_token and preserves existing params', () => {
    expect(buildSseUrl('/api/v1/knowposts/99/qa/stream?question=hello', 'token-1')).toBe(
      '/api/v1/knowposts/99/qa/stream?question=hello&access_token=token-1',
    );
  });
});

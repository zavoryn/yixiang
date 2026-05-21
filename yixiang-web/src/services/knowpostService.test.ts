import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadMarkdownContent } from './knowpostService';

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

describe('uploadMarkdownContent', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('presigns, uploads, and confirms markdown content', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            objectKey: 'knowpost/1/content.md',
            putUrl: 'https://oss.example/upload',
            headers: { 'x-oss-meta-test': '1' },
            expiresIn: 600,
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response('', { status: 200, headers: { ETag: '"etag-1"' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await uploadMarkdownContent('1', '# hello');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/storage/presign');
    expect(fetchMock.mock.calls[1][0]).toBe('https://oss.example/upload');
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/knowposts/1/content/confirm');
  });
});

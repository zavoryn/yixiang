# Completion Gap Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gaps between the claimed completed YiXiang product and the actual implementation by fixing broken auth/SSE flows, completing publish/AI/profile/feed behavior, and replacing visible mock data with real backend-backed views.

**Architecture:** Fix correctness blockers first, then complete end-to-end product flows, then remove misleading mock/placeholder surfaces. Keep the existing backend module structure and React service/query patterns; add small focused services/hooks instead of large rewrites.

**Tech Stack:** Spring Boot 3.2.4, Java 21, MyBatis, Redis/Kafka where already present, React 18, TypeScript, Vite, TanStack Query, React Router, Vitest, JUnit/Mockito.

---

## Scope And Ordering

This plan intentionally does not start with visual pixel tuning. The current blocker is functional truthfulness: several pages compile but do not execute the claimed workflow. Execute in this order:

1. **P0 correctness blockers:** auth refresh and notification SSE.
2. **P1 core write/read flows:** create/publish with content upload, post detail content + AI Q&A, profile user posts.
3. **P2 page/data completion:** home tabs, real rails, circles, search tabs, collections, drafts/settings routes.
4. **P3 verification and documentation truth:** update Roadmap only after behavior is verified.

## File Structure

### Frontend Files To Modify

- `yixiang-web/src/lib/apiClient.ts`  
  Fix refresh endpoint and refresh response field names.
- `yixiang-web/src/context/AuthContext.tsx`  
  Persist refreshed token expiry correctly.
- `yixiang-web/src/features/notification/useUnreadCount.ts`  
  Connect EventSource to backend `/stream` endpoint and include `access_token`.
- `yixiang-web/src/services/notificationService.ts`  
  Centralize notification stream URL creation.
- `yixiang-web/src/services/knowpostService.ts`  
  Add Markdown/text upload helper and user-post listing API once backend exists.
- `yixiang-web/src/services/activityService.ts`  
  New service for `/api/v1/activities/following`.
- `yixiang-web/src/services/recommendService.ts`  
  New service for `/api/v1/recommend/users` and `/api/v1/recommend/circles`.
- `yixiang-web/src/services/topicService.ts`  
  New service for `/api/v1/topics/hot` and `/api/v1/topics/{tag}/posts`.
- `yixiang-web/src/services/hotService.ts`  
  New service for `/api/v1/hot/posts`.
- `yixiang-web/src/services/draftService.ts`  
  New service for `/api/v1/drafts`.
- `yixiang-web/src/services/settingsService.ts`  
  New service for `/api/v1/settings`.
- `yixiang-web/src/lib/sse.ts`  
  Add authenticated EventSource URL helper.
- `yixiang-web/src/pages/CreatePage.tsx`  
  Complete publish and draft workflow.
- `yixiang-web/src/pages/PostDetailPage.tsx`  
  Render fetched content and AI Q&A stream.
- `yixiang-web/src/pages/HomePage.tsx`  
  Make tabs query real data and replace right rail mocks.
- `yixiang-web/src/pages/ProfilePage.tsx`  
  Support `/users/:id` post lists and real draft/circle tabs where available.
- `yixiang-web/src/pages/CircleDetailPage.tsx`  
  Replace pinned/activity/topic mocks with circle posts/members/topic data.
- `yixiang-web/src/pages/SearchPage.tsx`  
  Make result tabs actually filter or query corresponding data.
- `yixiang-web/src/pages/CollectionsPage.tsx`  
  Replace static recent/folder counts where backend data is available; hide unsupported tabs behind honest empty states.
- `yixiang-web/src/pages/DraftsPage.tsx`  
  New route-level page for draft list.
- `yixiang-web/src/pages/SettingsPage.tsx`  
  New route-level page for settings.
- `yixiang-web/src/app/routes.tsx`  
  Route `/drafts` and `/settings` to real pages; avoid pointing `/topics` to `HomePage` unless the topics page is implemented.

### Backend Files To Modify

- `yixiang_be/src/main/java/com/tongji/knowpost/api/KnowPostController.java`  
  Add `GET /api/v1/knowposts/users/{userId}` if not already supported elsewhere.
- `yixiang_be/src/main/java/com/tongji/knowpost/service/KnowPostFeedService.java`
- `yixiang_be/src/main/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImpl.java`
- `yixiang_be/src/main/java/com/tongji/knowpost/mapper/KnowPostMapper.java`
- `yixiang_be/src/main/resources/mapper/KnowPostMapper.xml`  
  Add public user post listing.
- `yixiang_be/src/test/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImplUserPostsTest.java`  
  New unit test.
- Optional if needed: `yixiang_be/src/main/java/com/tongji/counter/favorite/FavoriteController.java` and service layer for favorite stats/folders. Only add if Collections cannot be made honest from existing APIs.

---

## Task 1: Fix Access Token Refresh

**Files:**
- Modify: `yixiang-web/src/lib/apiClient.ts`
- Modify: `yixiang-web/src/context/AuthContext.tsx`
- Test: `yixiang-web/src/lib/apiClient.test.ts`

- [x] **Step 1: Add failing test for refresh endpoint**

Add this test to `apiClient.test.ts`:

```ts
it('refreshes access token through the versioned auth endpoint', async () => {
  const refreshResponse = {
    accessToken: 'new-access',
    accessTokenExpiresAt: '2026-05-21T04:00:00Z',
    refreshToken: 'new-refresh',
    refreshTokenExpiresAt: '2026-05-28T04:00:00Z',
  };
  const onTokensUpdated = vi.fn();
  setTokenStore({
    getAccessToken: () => 'expired-access',
    getRefreshToken: () => 'old-refresh',
    onTokensUpdated,
    onAuthFailed: vi.fn(),
  });
  fetchMock
    .mockResolvedValueOnce(new Response('', { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(refreshResponse), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

  await apiFetch<{ ok: boolean }>('/api/v1/profile/1');

  expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/auth/token/refresh');
  expect(onTokensUpdated).toHaveBeenCalledWith(refreshResponse);
});
```

- [x] **Step 2: Run the test and verify failure**

Run:

```bash
cd yixiang-web
npm run test:run -- src/lib/apiClient.test.ts
```

Expected: the new test fails because the refresh request goes to `/api/auth/token/refresh` or `/auth/token/refresh` instead of `/api/v1/auth/token/refresh`.

- [x] **Step 3: Fix `apiClient.ts` refresh contract**

Change the token store type and refresh call:

```ts
export interface TokenStore {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensUpdated: (tokens: {
    accessToken: string;
    accessTokenExpiresAt: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
  }) => void;
  onAuthFailed: () => void;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!tokenStore) return false;
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;
  const resp = await fetch(`${env.apiBaseUrl}/v1/auth/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  tokenStore.onTokensUpdated(data);
  return true;
}
```

Note: with default `env.apiBaseUrl === '/api'`, `/v1/auth/token/refresh` resolves to `/api/v1/auth/token/refresh`. If `VITE_API_BASE_URL` is a full backend origin such as `http://localhost:8080/api`, this still resolves correctly.

- [x] **Step 4: Fix `AuthContext.tsx` refreshed expiry persistence**

Change `onTokensUpdated` to use backend field names:

```ts
onTokensUpdated: (next) => {
  const updated: TokensState = {
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
    accessTokenExpiresAt: next.accessTokenExpiresAt,
    refreshTokenExpiresAt: next.refreshTokenExpiresAt,
  };
  setTokens(updated);
  writeStored(updated, user);
},
```

- [x] **Step 5: Verify**

Run:

```bash
cd yixiang-web
npm run test:run -- src/lib/apiClient.test.ts
npm run build
```

Expected: test file passes and production build succeeds.

---

## Task 2: Fix Notification SSE

**Files:**
- Create: `yixiang-web/src/lib/sse.ts`
- Modify: `yixiang-web/src/features/notification/useUnreadCount.ts`
- Modify: `yixiang-web/src/services/notificationService.ts`
- Test: `yixiang-web/src/features/notification/useUnreadCount.test.tsx`

- [x] **Step 1: Create authenticated stream URL helper**

Create `src/lib/sse.ts`:

```ts
import { env } from './env';

export function buildSseUrl(path: string, accessToken: string | null): string {
  const base = env.apiBaseUrl.endsWith('/') ? env.apiBaseUrl.slice(0, -1) : env.apiBaseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`, window.location.origin);
  if (accessToken) url.searchParams.set('access_token', accessToken);
  return url.pathname + url.search + url.hash;
}
```

- [x] **Step 2: Centralize notification stream path**

Add to `notificationService.ts`:

```ts
streamPath: () => `${BASE}/stream`,
```

- [x] **Step 3: Update `useUnreadCount.ts`**

Use the auth token and real backend path:

```ts
import { useAuth } from '@/context/AuthContext';
import { buildSseUrl } from '@/lib/sse';

export function useUnreadCount() {
  const qc = useQueryClient();
  const { tokens, isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 60_000,
    staleTime: 30_000,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const es = new EventSource(buildSseUrl(notificationService.streamPath(), tokens?.accessToken ?? null));
    es.addEventListener('unread', () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    });
    es.onmessage = () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
  }, [qc, isAuthenticated, tokens?.accessToken]);

  return query;
}
```

- [x] **Step 4: Add hook test for stream URL**

Create `src/features/notification/useUnreadCount.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUnreadCount } from './useUnreadCount';

const eventSourceMock = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    tokens: { accessToken: 'abc.def', refreshToken: 'r' },
  }),
}));
vi.mock('@/services/notificationService', () => ({
  notificationService: {
    unreadCount: () => Promise.resolve({ unreadCount: 0 }),
    streamPath: () => '/api/v1/notifications/stream',
  },
}));

class EventSourceStub {
  addEventListener = vi.fn();
  close = vi.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  constructor(url: string) {
    eventSourceMock(url);
  }
}

function Probe() {
  useUnreadCount();
  return null;
}

describe('useUnreadCount', () => {
  beforeEach(() => {
    eventSourceMock.mockReset();
    globalThis.EventSource = EventSourceStub as unknown as typeof EventSource;
  });

  it('opens backend notification stream with access token query param', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(eventSourceMock).toHaveBeenCalledWith('/api/v1/notifications/stream?access_token=abc.def');
  });
});
```

- [x] **Step 5: Verify**

Run:

```bash
cd yixiang-web
npm run test:run -- src/features/notification/useUnreadCount.test.tsx
npm run build
```

Expected: test passes and build succeeds.

---

## Task 3: Complete Create/Publish Content Upload

**Files:**
- Modify: `yixiang-web/src/pages/CreatePage.tsx`
- Modify: `yixiang-web/src/services/knowpostService.ts`
- Test: `yixiang-web/src/services/knowpostService.test.ts`

- [x] **Step 1: Add text-to-file upload helper**

Add to `knowpostService.ts`:

```ts
export async function uploadMarkdownContent(postId: string, markdown: string) {
  const file = new File([markdown], `${postId}.md`, { type: 'text/markdown;charset=utf-8' });
  const sha256 = await computeSha256(file);
  const presign = await knowpostService.presign({
    scene: 'knowpost_content',
    postId,
    contentType: file.type,
    ext: '.md',
  });
  const uploaded = await uploadToPresigned(presign.putUrl, presign.headers, file);
  await knowpostService.confirmContent(postId, {
    objectKey: presign.objectKey,
    etag: uploaded.etag,
    size: file.size,
    sha256,
  });
  return presign.objectKey;
}
```

- [x] **Step 2: Add unit test for upload orchestration**

Create `src/services/knowpostService.test.ts` with fetch mocks that assert the order:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { uploadMarkdownContent } from './knowpostService';

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

describe('uploadMarkdownContent', () => {
  beforeEach(() => fetchMock.mockReset());

  it('presigns, uploads, and confirms markdown content', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        objectKey: 'knowpost/1/content.md',
        putUrl: 'https://oss.example/upload',
        headers: { 'x-oss-meta-test': '1' },
        expiresIn: 600,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 200, headers: { ETag: '"etag-1"' } }))
      .mockResolvedValueOnce(new Response('', { status: 204 }));

    await uploadMarkdownContent('1', '# hello');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/storage/presign');
    expect(fetchMock.mock.calls[1][0]).toBe('https://oss.example/upload');
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/knowposts/1/content/confirm');
  });
});
```

- [x] **Step 3: Update publish mutation**

In `CreatePage.tsx`, import `uploadMarkdownContent` and change mutation:

```ts
import { knowpostService, uploadMarkdownContent } from '@/services/knowpostService';

const publishMut = useMutation({
  mutationFn: async () => {
    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();
    if (normalizedTitle.length < 5) throw new Error('标题至少 5 个字');
    if (normalizedContent.length < 20) throw new Error('正文至少 20 个字');
    const draft = await knowpostService.createDraft();
    await uploadMarkdownContent(draft.id, normalizedContent);
    await knowpostService.update(draft.id, {
      title: normalizedTitle,
      tags,
      visible: visibility,
      description: normalizedContent.slice(0, 120),
    });
    await knowpostService.publish(draft.id);
    return draft.id;
  },
  onSuccess: (id) => {
    toast.success('发布成功');
    navigate(`/posts/${id}`);
  },
  onError: (err) => {
    toast.error(err instanceof Error ? err.message : '发布失败');
  },
});
```

- [x] **Step 4: Disable publish until title and content are valid**

Change the publish button disabled condition:

```tsx
disabled={title.trim().length < 5 || content.trim().length < 20 || publishMut.isPending}
```

- [x] **Step 5: Verify**

Run:

```bash
cd yixiang-web
npm run test:run -- src/services/knowpostService.test.ts
npm run build
```

Expected: test and build pass. Manual verification requires backend OSS configuration.

---

## Task 4: Render Post Content And AI Q&A

**Files:**
- Modify: `yixiang-web/src/lib/sse.ts`
- Modify: `yixiang-web/src/pages/PostDetailPage.tsx`
- Test: `yixiang-web/src/lib/sse.test.ts`

- [x] **Step 1: Add generic stream URL builder test**

Create `src/lib/sse.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSseUrl } from './sse';

describe('buildSseUrl', () => {
  it('adds access_token and preserves existing params', () => {
    expect(buildSseUrl('/api/v1/knowposts/99/qa/stream?question=hello', 'token-1'))
      .toBe('/api/v1/knowposts/99/qa/stream?question=hello&access_token=token-1');
  });
});
```

- [x] **Step 2: Fetch Markdown content in `PostDetailPage.tsx`**

Add a query:

```ts
const { data: postContent } = useQuery({
  queryKey: ['knowpost', 'content', post?.contentUrl],
  queryFn: async () => {
    const resp = await fetch(post!.contentUrl);
    if (!resp.ok) throw new Error('正文加载失败');
    return resp.text();
  },
  enabled: !!post?.contentUrl,
});
```

Render `postContent ?? post.description` using `react-markdown`:

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<div className="prose prose-sm max-w-none text-gray-700">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {postContent ?? post.description}
  </ReactMarkdown>
</div>
```

- [x] **Step 3: Add Q&A state and stream handler**

In `PostDetailPage.tsx`:

```ts
const { tokens } = useAuth();
const [question, setQuestion] = useState('');
const [answer, setAnswer] = useState('');
const [isAsking, setIsAsking] = useState(false);

const askQuestion = () => {
  const q = question.trim();
  if (!q || !id) return;
  setAnswer('');
  setIsAsking(true);
  const url = buildSseUrl(
    `/api/v1/knowposts/${id}/qa/stream?question=${encodeURIComponent(q)}&topK=5&maxTokens=1024`,
    tokens?.accessToken ?? null,
  );
  const es = new EventSource(url);
  es.onmessage = (event) => setAnswer((prev) => prev + event.data);
  es.addEventListener('done', () => {
    setIsAsking(false);
    es.close();
  });
  es.onerror = () => {
    setIsAsking(false);
    es.close();
    toast.error('AI 问答连接失败');
  };
};
```

- [x] **Step 4: Render Q&A panel**

Add below the article and above comments:

```tsx
<section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
  <h3 className="font-bold text-gray-800 mb-4">AI 帖子问答</h3>
  <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2">
    <input
      value={question}
      onChange={(e) => setQuestion(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') askQuestion(); }}
      placeholder="输入你的问题..."
      className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2"
    />
    <button
      onClick={askQuestion}
      disabled={!question.trim() || isAsking}
      className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
    >
      {isAsking ? '生成中...' : '提问'}
    </button>
  </div>
  {answer && (
    <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-gray-700 whitespace-pre-wrap">
      {answer}
    </div>
  )}
</section>
```

- [x] **Step 5: Verify**

Run:

```bash
cd yixiang-web
npm run test:run -- src/lib/sse.test.ts
npm run build
```

Expected: build passes. Manual verification: open a post with `contentUrl`, confirm Markdown content renders and AI answer streams.

---

## Task 5: Add Public User Post Listing

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/api/KnowPostController.java`
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/service/KnowPostFeedService.java`
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImpl.java`
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/mapper/KnowPostMapper.java`
- Modify: `yixiang_be/src/main/resources/mapper/KnowPostMapper.xml`
- Create: `yixiang_be/src/test/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImplUserPostsTest.java`
- Modify: `yixiang-web/src/services/knowpostService.ts`
- Modify: `yixiang-web/src/pages/ProfilePage.tsx`

- [x] **Step 1: Add backend service API**

Add to `KnowPostFeedService.java`:

```java
FeedPageResponse getUserPublished(long userId, int page, int size, Long viewerId);
```

- [x] **Step 2: Add mapper methods**

Add to `KnowPostMapper.java`:

```java
List<KnowPostFeedRow> listUserPublished(@Param("userId") long userId,
                                        @Param("limit") int limit,
                                        @Param("offset") int offset);

long countUserPublished(@Param("userId") long userId);
```

Add to `KnowPostMapper.xml`:

```xml
<select id="listUserPublished" resultType="com.tongji.knowpost.model.KnowPostFeedRow">
    SELECT
        p.id,
        p.title,
        p.description,
        p.tags,
        p.img_urls AS imgUrls,
        u.avatar AS authorAvatar,
        u.nickname AS authorNickname,
        u.tags_json AS authorTagJson,
        p.publish_time AS publishTime,
        p.is_top AS isTop
    FROM know_posts p
    JOIN users u ON p.creator_id = u.id
    WHERE p.creator_id = #{userId}
      AND p.status = 'published'
      AND p.visible = 'public'
    ORDER BY p.is_top DESC, p.publish_time DESC
    LIMIT #{limit} OFFSET #{offset}
</select>

<select id="countUserPublished" resultType="long">
    SELECT COUNT(1)
    FROM know_posts
    WHERE creator_id = #{userId}
      AND status = 'published'
      AND visible = 'public'
</select>
```

- [x] **Step 3: Implement service**

In `KnowPostFeedServiceImpl`, implement using the same enrichment method used by feed/mine:

```java
@Override
public FeedPageResponse getUserPublished(long userId, int page, int size, Long viewerId) {
    int safePage = Math.max(page, 1);
    int safeSize = Math.min(Math.max(size, 1), 50);
    int offset = (safePage - 1) * safeSize;
    List<KnowPostFeedRow> rows = mapper.listUserPublished(userId, safeSize, offset);
    long total = mapper.countUserPublished(userId);
    List<FeedItemResponse> items = rows.stream()
            .map(row -> toFeedItem(row, viewerId))
            .toList();
    return new FeedPageResponse(items, safePage, safeSize, offset + items.size() < total);
}
```

If `toFeedItem` is private with a different name, reuse the existing mapper/enrichment method in that class and keep the response shape identical to `feed`.

- [x] **Step 4: Add controller endpoint**

Add to `KnowPostController.java`:

```java
@GetMapping("/users/{userId}")
public FeedPageResponse userPosts(@PathVariable("userId") long userId,
                                  @RequestParam(value = "page", defaultValue = "1") int page,
                                  @RequestParam(value = "size", defaultValue = "20") int size,
                                  @AuthenticationPrincipal Jwt jwt) {
    Long viewerId = (jwt == null) ? null : jwtService.extractUserId(jwt);
    return feedService.getUserPublished(userId, page, size, viewerId);
}
```

- [x] **Step 5: Add frontend service**

Add to `knowpostService.ts`:

```ts
userPosts: (userId: number, page = 1, size = 20) =>
  apiFetch<FeedResponse>(`${KNOWPOST_PREFIX}/users/${userId}?page=${page}&size=${size}`, {
    skipAuth: true,
  }),
```

- [x] **Step 6: Fix `ProfilePage.tsx` query**

Replace the `我的帖子` query with:

```ts
const { data: postsData, isLoading: postsLoading } = useQuery({
  queryKey: ['knowposts', 'user', profileUserId, page],
  queryFn: () => isOwnProfile
    ? knowpostService.mine(page, 20)
    : knowpostService.userPosts(profileUserId!, page, 20),
  enabled: profileUserId != null && activeTab === '我的帖子',
});
```

- [x] **Step 7: Verify**

Run:

```bash
cd yixiang_be
$env:JAVA_HOME='E:\JAVA\jdk21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; mvn test
cd ..\yixiang-web
npm run build
```

Expected: backend tests pass and visiting `/users/:id` can show that user's public posts.

---

## Task 6: Make Home Tabs Real And Fix Optimistic Cache Keys

**Files:**
- Create: `yixiang-web/src/services/hotService.ts`
- Create: `yixiang-web/src/services/activityService.ts`
- Create: `yixiang-web/src/services/recommendService.ts`
- Create: `yixiang-web/src/services/topicService.ts`
- Modify: `yixiang-web/src/pages/HomePage.tsx`

- [x] **Step 1: Add service wrappers**

Create `hotService.ts`:

```ts
import { apiFetch } from '@/lib/apiClient';
import type { FeedResponse } from '@/types/knowpost';

export const hotService = {
  posts: (period: '24h' | '7d' | '30d' = '24h', cursor?: string, size = 20) => {
    const q = new URLSearchParams({ period, size: String(size) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<FeedResponse>(`/api/v1/hot/posts?${q.toString()}`, { skipAuth: true });
  },
};
```

Create `activityService.ts`:

```ts
import { apiFetch } from '@/lib/apiClient';

export interface ActivityItem {
  id: number;
  userId: number;
  type: string;
  targetType: string;
  targetId: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export const activityService = {
  following: (cursor?: number, size = 10) => {
    const q = new URLSearchParams({ size: String(size) });
    if (cursor) q.set('cursor', String(cursor));
    return apiFetch<{ items: ActivityItem[]; nextCursor: number | null; hasMore: boolean }>(
      `/api/v1/activities/following?${q.toString()}`,
    );
  },
};
```

Create `recommendService.ts`:

```ts
import { apiFetch } from '@/lib/apiClient';

export interface RecommendedUser {
  id: number;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  followerCount: number;
}

export interface RecommendedCircle {
  id: number;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
}

export const recommendService = {
  users: (limit = 5) => apiFetch<RecommendedUser[]>(`/api/v1/recommend/users?limit=${limit}`, { skipAuth: true }),
  circles: (limit = 5) => apiFetch<RecommendedCircle[]>(`/api/v1/recommend/circles?limit=${limit}`, { skipAuth: true }),
};
```

Create `topicService.ts`:

```ts
import { apiFetch } from '@/lib/apiClient';
import type { FeedResponse } from '@/types/knowpost';

export interface TopicItem {
  tag: string;
  postCount: number;
  viewCount: number;
  lastUsedAt?: string;
}

export const topicService = {
  hot: (limit = 10) => apiFetch<TopicItem[]>(`/api/v1/topics/hot?limit=${limit}`, { skipAuth: true }),
  posts: (tag: string, page = 1, size = 20) =>
    apiFetch<FeedResponse>(`/api/v1/topics/${encodeURIComponent(tag)}/posts?page=${page}&size=${size}`, { skipAuth: true }),
};
```

- [x] **Step 2: Make feed query depend on tab**

In `HomePage.tsx`:

```ts
const query = useQuery({
  queryKey: ['feed', activeTab, page],
  queryFn: () => {
    if (activeTab === '推荐') return knowpostService.feed(page, 10);
    if (activeTab === '最新') return knowpostService.feed(page, 10);
    if (activeTab === '关注') return activityService.following(undefined, 10)
      .then(() => knowpostService.feed(page, 10));
    return knowpostService.feed(page, 10);
  },
});
```

If the backend does not provide a following feed endpoint yet, show an honest empty state for the “关注” tab when unauthenticated and use the current feed as a temporary authenticated fallback with a visible label removed from Roadmap until a true following feed exists.

- [x] **Step 3: Fix optimistic cache update keys**

Replace `qc.setQueryData(['feed'], ...)` with:

```ts
qc.setQueryData<{ items: FeedItem[] }>(['feed', activeTab, page], (old) => {
  if (!old) return old;
  return {
    ...old,
    items: old.items.map((p) =>
      p.id === post.id ? { ...p, liked: !p.liked, likeCount: (p.likeCount ?? 0) + (p.liked ? -1 : 1) } : p
    ),
  };
});
```

Pass `activeTab` and `page` into `FeedCard` props.

- [x] **Step 4: Replace right rail mocks with queries**

Use:

```ts
const { data: activities } = useQuery({
  queryKey: ['activities', 'following'],
  queryFn: () => activityService.following(undefined, 5),
  enabled: isAuthenticated,
});
const { data: circles } = useQuery({
  queryKey: ['recommend', 'circles'],
  queryFn: () => recommendService.circles(3),
});
const { data: topics } = useQuery({
  queryKey: ['topics', 'hot'],
  queryFn: () => topicService.hot(5),
});
```

Render empty states instead of `MOCK_ACTIVITIES`, `MOCK_CIRCLES`, and `MOCK_TOPICS`.

- [x] **Step 5: Verify**

Run:

```bash
cd yixiang-web
npm run build
```

Expected: build passes and home tab changes produce distinct query keys.

---

## Task 7: Add Real Drafts And Settings Pages

**Files:**
- Create: `yixiang-web/src/services/draftService.ts`
- Create: `yixiang-web/src/services/settingsService.ts`
- Create: `yixiang-web/src/pages/DraftsPage.tsx`
- Create: `yixiang-web/src/pages/SettingsPage.tsx`
- Modify: `yixiang-web/src/app/routes.tsx`
- Modify: `yixiang-web/src/pages/ProfilePage.tsx`

- [x] **Step 1: Add services**

Create `draftService.ts`:

```ts
import { apiFetch } from '@/lib/apiClient';

export interface DraftItem {
  id: number;
  title: string | null;
  contentUrl: string | null;
  tags: string[];
  circleId: number | null;
  coverImage: string | null;
  updatedAt: string;
}

export const draftService = {
  list: () => apiFetch<DraftItem[]>('/api/v1/drafts'),
  remove: (id: number) => apiFetch<void>(`/api/v1/drafts/${id}`, { method: 'DELETE' }),
  publish: (id: number) => apiFetch<void>(`/api/v1/drafts/${id}/publish`, { method: 'POST' }),
};
```

Create `settingsService.ts`:

```ts
import { apiFetch } from '@/lib/apiClient';

export interface SettingsResponse {
  notificationPref: Record<string, boolean>;
  privacy: Record<string, unknown>;
  theme: string;
  language: string;
  updatedAt: string;
}

export const settingsService = {
  get: () => apiFetch<SettingsResponse>('/api/v1/settings'),
  patch: (body: Partial<SettingsResponse>) =>
    apiFetch<SettingsResponse>('/api/v1/settings', { method: 'PATCH', body: JSON.stringify(body) }),
};
```

- [x] **Step 2: Implement `DraftsPage.tsx`**

Create `src/pages/DraftsPage.tsx`:

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Trash2, Send } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { draftService } from '@/services/draftService';
import { formatRelativeTime } from '@/lib/formatters';
import { toast } from 'sonner';

export default function DraftsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => draftService.list(),
  });

  const remove = useMutation({
    mutationFn: (id: number) => draftService.remove(id),
    onSuccess: () => {
      toast.success('草稿已删除');
      qc.invalidateQueries({ queryKey: ['drafts'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : '删除失败'),
  });

  const publish = useMutation({
    mutationFn: (id: number) => draftService.publish(id),
    onSuccess: () => {
      toast.success('发布成功');
      qc.invalidateQueries({ queryKey: ['drafts'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : '发布失败'),
  });

  const drafts = data ?? [];

  return (
    <PageShell contentClassName="max-w-[760px]">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[640px]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">草稿箱</h1>
          <Button onClick={() => navigate('/create')}>新建帖子</Button>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : error ? (
          <div className="py-16">
            <EmptyState
              icon={FileEdit}
              title="草稿加载失败"
              description={error instanceof Error ? error.message : '请稍后重试'}
              action={<Button onClick={() => refetch()}>重试</Button>}
            />
          </div>
        ) : drafts.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={FileEdit}
              title="暂无草稿"
              description="保存中的帖子会显示在这里"
              action={<Button onClick={() => navigate('/create')}>去发布</Button>}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {drafts.map((draft) => (
              <div key={draft.id} className="p-6 flex items-center justify-between gap-4 hover:bg-gray-50">
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 truncate">{draft.title || '未命名草稿'}</h2>
                  <p className="text-sm text-gray-500 mt-1">更新于 {formatRelativeTime(draft.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => navigate(`/create?draftId=${draft.id}`)}>继续编辑</Button>
                  <Button variant="ghost" onClick={() => publish.mutate(draft.id)} disabled={publish.isPending}>
                    <Send size={16} />
                  </Button>
                  <Button variant="ghost" onClick={() => remove.mutate(draft.id)} disabled={remove.isPending}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
```

- [x] **Step 3: Implement `SettingsPage.tsx`**

Create `src/pages/SettingsPage.tsx`:

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Settings as SettingsIcon } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { settingsService } from '@/services/settingsService';
import { toast } from 'sonner';

const NOTIFICATION_LABELS: Record<string, string> = {
  comment: '评论通知',
  like: '点赞通知',
  follow: '关注通知',
  system: '系统通知',
  recommendation: '推荐内容',
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });

  const patch = useMutation({
    mutationFn: (notificationPref: Record<string, boolean>) =>
      settingsService.patch({ notificationPref }),
    onSuccess: () => {
      toast.success('设置已保存');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : '保存失败'),
  });

  const updatePref = (key: string, value: boolean) => {
    if (!data) return;
    patch.mutate({ ...data.notificationPref, [key]: value });
  };

  return (
    <PageShell contentClassName="max-w-[760px]">
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[640px]">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">设置</h1>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : error || !data ? (
          <div className="py-16">
            <EmptyState
              icon={SettingsIcon}
              title="设置加载失败"
              description={error instanceof Error ? error.message : '请稍后重试'}
              action={<Button onClick={() => refetch()}>重试</Button>}
            />
          </div>
        ) : (
          <div className="p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell size={18} /> 通知偏好
            </h2>
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
              {Object.entries(data.notificationPref).map(([key, checked]) => (
                <label key={key} className="flex items-center justify-between p-4 cursor-pointer">
                  <span className="text-sm font-medium text-gray-800">{NOTIFICATION_LABELS[key] ?? key}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={patch.isPending}
                    onChange={(e) => updatePref(key, e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
```

- [x] **Step 4: Fix routes**

Change `routes.tsx` imports and protected routes:

```tsx
import DraftsPage from '@/pages/DraftsPage';
import SettingsPage from '@/pages/SettingsPage';

<Route path="/drafts" element={<DraftsPage />} />
<Route path="/settings" element={<SettingsPage />} />
```

- [x] **Step 5: Fix profile draft tab**

In `ProfilePage.tsx`, when `activeTab === '草稿箱'` and `isOwnProfile`, render a button to `/drafts`. For other users, do not show the tab.

- [x] **Step 6: Verify**

Run:

```bash
cd yixiang-web
npm run build
```

Expected: `/drafts` and `/settings` no longer route to `CreatePage`.

---

## Task 8: Remove Or Downgrade Remaining Mock Claims

**Files:**
- Modify: `yixiang-web/src/pages/CircleDetailPage.tsx`
- Modify: `yixiang-web/src/pages/SearchPage.tsx`
- Modify: `yixiang-web/src/pages/CollectionsPage.tsx`
- Modify: `ROADMAP.md`

- [ ] **Step 1: Circle detail**

Replace `MOCK_PINNED` with `circleService.posts(circle.id, true)`. Replace `MOCK_TOPICS` with `topicService.hot(4)`. Replace `MOCK_ACTIVITIES` with an empty state unless a backend circle activity endpoint is added.

- [ ] **Step 2: Search tabs**

For unsupported tabs, show an honest empty state:

```tsx
if (activeTab !== 0 && activeTab !== 1) {
  return (
    <EmptyState
      icon={Search}
      title="该类型搜索暂未接入"
      description="当前已接入帖子搜索，用户、话题、圈子搜索需要后端聚合接口。"
    />
  );
}
```

Keep Roadmap unchecked for those search dimensions unless backend aggregation exists.

- [ ] **Step 3: Collections page**

Use first 3 real favorites for “最近收藏”. Replace static folder categories with an empty state titled “收藏夹分类暂未接入” unless a real folder API is added.

- [ ] **Step 4: Roadmap truth update**

Edit `ROADMAP.md` so checked items only describe verified behavior. Move partially implemented items under a “进行中” section:

```md
## 进行中 🚧

- [ ] 首页信息流：推荐/最新已接入，关注流待后端专用接口
- [ ] 草稿箱 + 帖子发布工作流：草稿列表和 Markdown 正文上传接入中
- [ ] AI 帖子问答：后端接口存在，前端流式面板接入中
- [ ] OSS 直传图片/文件：正文 Markdown 已接入，图片上传待接入
```

- [ ] **Step 5: Verify**

Run:

```bash
cd yixiang-web
rg -n "MOCK_|即将上线|功能正在开发中|toast\\.info\\('关注功能'\\)" src
npm run build
```

Expected: remaining matches are intentional only: DM, third-party login, unsupported future features. Update `ROADMAP.md` for every intentional remaining placeholder.

---

## Task 9: Full Verification Pass

**Files:**
- Modify only if verification exposes defects.

- [ ] **Step 1: Frontend checks**

Run:

```bash
cd yixiang-web
npm run lint
npm run test:run
npm run build
```

Expected:
- ESLint exits 0.
- Vitest exits 0.
- Vite build exits 0.

- [ ] **Step 2: Backend checks**

Run:

```powershell
cd E:\code\yixiang\yixiang_be
$env:JAVA_HOME='E:\JAVA\jdk21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn test
```

Expected: all backend tests pass under Java 21.

- [ ] **Step 3: Manual browser smoke**

Start services:

```bash
cd yixiang-web
npm run dev
```

With backend running on `localhost:8080`, manually verify:

- Login, wait for token refresh path after forcing a 401.
- Notification page opens without EventSource 404.
- Create page publishes a post with non-empty Markdown body.
- Post detail shows Markdown body and AI Q&A panel streams.
- `/users/:id` shows that user’s public posts.
- `/drafts` shows the draft list.
- `/settings` shows persisted settings.
- Home page right rail no longer displays fixed mock names.

- [ ] **Step 4: Final mock audit**

Run:

```bash
cd E:\code\yixiang
rg -n "MOCK_|mock|即将上线|功能正在开发中|placeholder|TODO" yixiang-web\src ROADMAP.md
```

Expected: each remaining match is either a test mock, DM/third-party login documented future work, or a deliberately honest unsupported-state message.

---

## Self-Review Checklist

- Token refresh: covered by Task 1.
- Notification SSE: covered by Task 2.
- Publish content and OSS Markdown upload: covered by Task 3.
- AI Q&A and detail content rendering: covered by Task 4.
- Other-user profile posts: covered by Task 5.
- Home tabs and right rail mocks: covered by Task 6.
- Drafts/settings wrong routes: covered by Task 7.
- Remaining mock and Roadmap truthfulness: covered by Task 8.
- Build/test/manual verification: covered by Task 9.

No task relies on unrelated refactors. Backend changes are additive. Frontend changes follow existing service/query patterns.

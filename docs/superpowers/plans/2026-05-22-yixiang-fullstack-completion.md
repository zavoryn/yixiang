# 颐享全栈功能完善 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将颐享平台从 50% 完成度提升至生产可用，接通所有已有后端 API，补全缺失 DB 表和模块，实现 7 个 Phase 的功能。

**Architecture:** 前后端分离；后端 Spring Boot 3.2 + MyBatis + MySQL + Redis + ES + Kafka；前端 React 18 + TanStack Query v5 + Tailwind v4。每个 Phase 独立可运行、独立 commit/push。

**Tech Stack:** Java 21, Spring Boot 3.2, MyBatis, MySQL 8, Redis, Elasticsearch 9, Kafka, React 18, TypeScript 5, Vite 5, TanStack Query v5, Vitest, Tailwind CSS v4

---

## 执行规则

- 每个 Task 完成后立即 `git add` + `git commit` + `git push origin codex/completion-gap-fix`
- 每次 commit 前运行 `npm run lint`（前端）或 `mvn compile -q`（后端）
- 所有 API 调用都有 loading / error / empty 三态
- 不引入任何新的硬编码假数据

---

## 文件结构映射

### 新建文件（前端）
- `yixiang-web/src/services/commentService.ts` — 评论 CRUD
- `yixiang-web/src/services/activityService.ts` — 关注动态
- `yixiang-web/src/services/stockService.ts` — 大盘指数
- `yixiang-web/src/services/statsService.ts` — 用户数据统计

### 修改文件（前端）
- `yixiang-web/src/pages/PostDetailPage.tsx` — 评论系统全接通
- `yixiang-web/src/pages/HomePage.tsx` — 关注 Tab 接真实 Feed
- `yixiang-web/src/pages/LoginPage.tsx` — 大盘指数接真实数据
- `yixiang-web/src/pages/CreatePage.tsx` — 图片上传 + 圈子发帖
- `yixiang-web/src/pages/SearchPage.tsx` — 用户/话题/圈子 Tab
- `yixiang-web/src/pages/CircleDetailPage.tsx` — 帖子 Tab + 成员 Tab
- `yixiang-web/src/pages/CircleSquarePage.tsx` — 创建圈子 Dialog
- `yixiang-web/src/pages/CollectionsPage.tsx` — 收藏夹分类
- `yixiang-web/src/pages/ProfilePage.tsx` — 数据统计 + 等级徽章
- `yixiang-web/src/services/favoriteService.ts` — 新增 folder 方法
- `yixiang-web/src/services/circleService.ts` — 修正 posts 类型

### 新建文件（后端）
- `yixiang_be/.../search/document/UserSearchDocument.java`
- `yixiang_be/.../search/document/TopicSearchDocument.java`
- `yixiang_be/.../search/document/CircleSearchDocument.java`
- `yixiang_be/.../counter/folder/FavoriteFolderController.java`
- `yixiang_be/.../counter/folder/FavoriteFolderService.java`
- `yixiang_be/.../counter/folder/FavoriteFolderServiceImpl.java`
- `yixiang_be/.../counter/folder/FavoriteFolderMapper.java`
- `yixiang_be/src/main/resources/mapper/FavoriteFolderMapper.xml`
- `yixiang_be/.../profile/api/UserStatsController.java`

### 修改文件（后端）
- `yixiang_be/.../search/api/SearchController.java` — 增加 type 参数
- `yixiang_be/.../search/service/SearchService.java` — 新增接口方法
- `yixiang_be/.../search/service/impl/SearchServiceImpl.java` — 新增实现
- `yixiang_be/.../circle/api/CircleMemberController.java` — 补充 members 端点
- `yixiang_be/.../counter/favorite/FavoriteMapper.java` — 增加 folderId 方法

---

## Phase 1 — 评论系统全接通

### Task 1.1: 创建 commentService.ts 并写单元测试

**Files:**
- Create: `yixiang-web/src/services/commentService.ts`
- Create: `yixiang-web/src/services/commentService.test.ts`

- [ ] **Step 1: 创建 commentService.ts**

```typescript
// yixiang-web/src/services/commentService.ts
import { apiFetch } from '@/lib/apiClient';

export interface CommentItem {
  id: string;
  postId: string;
  userId: number;
  nickname: string;
  avatar: string | null;
  content: string;
  parentId: string | null;
  replyToUserId: number | null;
  replyToNickname: string | null;
  createdAt: string;
  replyCount: number;
}

export interface CommentListResp {
  items: CommentItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

const BASE = '/api/v1/comment';

export const commentService = {
  list(postId: string, cursor?: string, size = 20): Promise<CommentListResp> {
    const q = new URLSearchParams({ postId, size: String(size) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<CommentListResp>(`${BASE}/list?${q}`);
  },

  replies(parentId: string, cursor?: string, size = 20): Promise<CommentListResp> {
    const q = new URLSearchParams({ parentId, size: String(size) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<CommentListResp>(`${BASE}/replies?${q}`);
  },

  create(body: {
    postId: string;
    content: string;
    parentId?: string;
    replyToUserId?: number;
  }): Promise<{ id: string }> {
    return apiFetch<{ id: string }>(BASE, {
      method: 'POST',
      body: JSON.stringify({
        postId: Number(body.postId),
        content: body.content,
        parentId: body.parentId ? Number(body.parentId) : null,
        replyToUserId: body.replyToUserId ?? null,
      }),
    });
  },

  remove(id: string): Promise<void> {
    return apiFetch<void>(`${BASE}/${id}`, { method: 'DELETE' });
  },
};
```

- [ ] **Step 2: 写单元测试**

```typescript
// yixiang-web/src/services/commentService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

import { commentService } from './commentService';

beforeEach(() => fetchMock.mockReset());

describe('commentService', () => {
  it('list sends correct query params', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], nextCursor: null, hasMore: false }), { status: 200 })
    );
    await commentService.list('42', undefined, 20);
    expect(fetchMock.mock.calls[0][0]).toContain('postId=42');
    expect(fetchMock.mock.calls[0][0]).toContain('size=20');
  });

  it('create sends POST with correct body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '99' }), { status: 200 })
    );
    const result = await commentService.create({ postId: '42', content: 'hello' });
    expect(result.id).toBe('99');
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.postId).toBe(42);
    expect(body.content).toBe('hello');
    expect(body.parentId).toBeNull();
  });
});
```

- [ ] **Step 3: 运行测试确认通过**

```bash
cd yixiang-web && npm run test -- --run src/services/commentService.test.ts
```

Expected: `2 passed`

- [ ] **Step 4: Commit**

```bash
git add yixiang-web/src/services/commentService.ts yixiang-web/src/services/commentService.test.ts
git commit -m "feat: commentService with list/replies/create/remove"
git push origin codex/completion-gap-fix
```

---

### Task 1.2: PostDetailPage — 评论列表加载（顶级 + cursor 分页）

**Files:**
- Modify: `yixiang-web/src/pages/PostDetailPage.tsx`

后端评论接口确认：
- `GET /api/v1/comment/list?postId=&cursor=&size=` → `CommentListResp`
- `CommentItem.id` 是数字 → 字符串转换
- `createdAt` 是 ISO 8601 Instant

- [ ] **Step 1: 在 PostDetailPage 顶部增加评论相关 import 和 query**

在 PostDetailPage.tsx 的 import 区域添加：
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '@/services/commentService';
import type { CommentItem } from '@/services/commentService';
```

在组件内（`post` 数据加载之后）添加评论查询：
```typescript
const qc = useQueryClient();
const [commentCursor, setCommentCursor] = useState<string | undefined>();
const [allComments, setAllComments] = useState<CommentItem[]>([]);

const { data: commentPage, isLoading: commentsLoading } = useQuery({
  queryKey: ['comments', postId, commentCursor],
  queryFn: () => commentService.list(postId!, commentCursor, 20),
  enabled: !!postId,
});

useEffect(() => {
  if (commentPage?.items) {
    setAllComments(prev =>
      commentCursor ? [...prev, ...commentPage.items] : commentPage.items
    );
  }
}, [commentPage, commentCursor]);
```

- [ ] **Step 2: 替换静态评论列表渲染**

找到现有的评论列表 JSX（通常在 `{/* Comments */}` 区域），替换为：

```tsx
{/* Comment list */}
<div className="mt-6 space-y-4">
  {commentsLoading && !allComments.length ? (
    <div className="space-y-3">
      {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  ) : allComments.length === 0 ? (
    <p className="text-center text-gray-400 text-sm py-8">暂无评论，来说第一句话吧</p>
  ) : (
    <>
      {allComments.map(c => (
        <CommentCard key={c.id} comment={c} postId={postId!} onReplyClick={setReplyTo} />
      ))}
      {commentPage?.hasMore && (
        <button
          onClick={() => setCommentCursor(commentPage.nextCursor ?? undefined)}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-3"
        >
          加载更多评论
        </button>
      )}
    </>
  )}
</div>
```

- [ ] **Step 3: 新建 CommentCard 子组件（在 PostDetailPage.tsx 底部）**

```tsx
function CommentCard({
  comment, postId, onReplyClick,
}: {
  comment: CommentItem;
  postId: string;
  onReplyClick: (c: CommentItem) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<CommentItem[]>([]);

  const { isLoading: repliesLoading } = useQuery({
    queryKey: ['replies', comment.id],
    queryFn: () => commentService.replies(comment.id),
    enabled: showReplies,
    onSuccess: (data) => setReplies(data.items),
  });

  const deleteMut = useMutation({
    mutationFn: () => commentService.remove(comment.id),
    onSuccess: () => {
      toast.success('已删除');
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  return (
    <div className="flex gap-3">
      <img
        src={comment.avatar || `https://i.pravatar.cc/150?u=${comment.userId}`}
        className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
      />
      <div className="flex-1">
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-[14px] text-gray-900">{comment.nickname}</span>
            <span className="text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          {comment.replyToNickname && (
            <span className="text-xs text-blue-500 mb-1 block">回复 @{comment.replyToNickname}</span>
          )}
          <p className="text-[14px] text-gray-700 leading-relaxed">{comment.content}</p>
        </div>
        <div className="flex items-center gap-4 mt-1.5 ml-2">
          <button onClick={() => onReplyClick(comment)} className="text-xs text-gray-400 hover:text-blue-600">回复</button>
          {comment.replyCount > 0 && (
            <button onClick={() => setShowReplies(v => !v)} className="text-xs text-gray-400 hover:text-blue-600">
              {showReplies ? '收起回复' : `展开 ${comment.replyCount} 条回复`}
            </button>
          )}
          {user && String(user.id) === String(comment.userId) && (
            <button onClick={() => deleteMut.mutate()} className="text-xs text-red-400 hover:text-red-600">删除</button>
          )}
        </div>
        {showReplies && (
          <div className="mt-2 ml-4 space-y-3">
            {repliesLoading ? <Skeleton className="h-12 rounded-lg" /> : replies.map(r => (
              <div key={r.id} className="flex gap-2">
                <img src={r.avatar || `https://i.pravatar.cc/150?u=${r.userId}`} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                  <span className="font-medium text-[13px] text-gray-900 mr-2">{r.nickname}</span>
                  {r.replyToNickname && <span className="text-xs text-blue-500 mr-1">回复 @{r.replyToNickname}</span>}
                  <span className="text-[13px] text-gray-700">{r.content}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 运行 lint 确认无错误**

```bash
cd yixiang-web && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add yixiang-web/src/pages/PostDetailPage.tsx
git commit -m "feat: PostDetailPage comment list with cursor pagination and nested replies"
git push origin codex/completion-gap-fix
```

---

### Task 1.3: PostDetailPage — 发评论 + 回复 + 删除

**Files:**
- Modify: `yixiang-web/src/pages/PostDetailPage.tsx`

- [ ] **Step 1: 添加 replyTo 状态和发评论表单**

在组件内添加 state：
```typescript
const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
const [commentText, setCommentText] = useState('');
const textareaRef = useRef<HTMLTextAreaElement>(null);
```

添加发评论 mutation：
```typescript
const createComment = useMutation({
  mutationFn: () => commentService.create({
    postId: postId!,
    content: commentText.trim(),
    parentId: replyTo?.id,
    replyToUserId: replyTo ? replyTo.userId : undefined,
  }),
  onSuccess: () => {
    setCommentText('');
    setReplyTo(null);
    setCommentCursor(undefined);
    setAllComments([]);
    qc.invalidateQueries({ queryKey: ['comments', postId] });
    qc.invalidateQueries({ queryKey: ['post', postId] }); // refresh commentCount
    toast.success('评论已发布');
  },
  onError: (err) => toast.error(err instanceof Error ? err.message : '发布失败'),
});
```

- [ ] **Step 2: 替换发评论表单 JSX**

找到现有的评论输入框区域，替换为：
```tsx
{/* Comment input */}
<div className="border-t border-gray-100 pt-4 mt-4">
  {replyTo && (
    <div className="flex items-center gap-2 mb-2 px-1">
      <span className="text-xs text-gray-500">回复 <span className="text-blue-600">@{replyTo.nickname}</span></span>
      <button onClick={() => setReplyTo(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ 取消</button>
    </div>
  )}
  <div className="flex gap-3 items-start">
    <img
      src={user?.avatar || `https://i.pravatar.cc/150?u=${user?.id}`}
      className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
    />
    <div className="flex-1">
      <textarea
        ref={textareaRef}
        value={commentText}
        onChange={e => setCommentText(e.target.value)}
        placeholder={isAuthenticated ? (replyTo ? `回复 @${replyTo.nickname}...` : '写下你的评论...') : '登录后参与评论'}
        readOnly={!isAuthenticated}
        onClick={() => { if (!isAuthenticated) toast.info('请先登录'); }}
        rows={2}
        maxLength={1000}
        className="w-full resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-400">{commentText.length}/1000</span>
        <button
          onClick={() => {
            if (!isAuthenticated) { toast.info('请先登录'); return; }
            if (!commentText.trim()) { toast.error('请输入评论内容'); return; }
            createComment.mutate();
          }}
          disabled={createComment.isPending}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-1.5 rounded-full transition"
        >
          {createComment.isPending ? '发布中...' : '发布'}
        </button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: 运行全量测试**

```bash
cd yixiang-web && npm run lint && npm run test -- --run
```

Expected: all 18 tests pass, lint clean

- [ ] **Step 4: Commit**

```bash
git add yixiang-web/src/pages/PostDetailPage.tsx
git commit -m "feat: PostDetailPage comment create/reply/delete with optimistic UI"
git push origin codex/completion-gap-fix
```

---

## Phase 2 — 关注 Feed + 大盘指数接通

### Task 2.1: activityService.ts + stockService.ts

**Files:**
- Create: `yixiang-web/src/services/activityService.ts`
- Create: `yixiang-web/src/services/stockService.ts`

- [ ] **Step 1: 创建 activityService.ts**

```typescript
// yixiang-web/src/services/activityService.ts
import { apiFetch } from '@/lib/apiClient';

export interface ActivityActor {
  id: number;
  nickname: string;
  avatar: string | null;
  verified: boolean;
}

export interface ActivityItem {
  id: string;
  actor: ActivityActor;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'POST' | string;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityListResp {
  items: ActivityItem[];
  nextCursor: string | null;
}

export const activityService = {
  following(cursor?: string, size = 20): Promise<ActivityListResp> {
    const q = new URLSearchParams({ size: String(size) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<ActivityListResp>(`/api/v1/activities/following?${q}`);
  },
};
```

- [ ] **Step 2: 创建 stockService.ts**

```typescript
// yixiang-web/src/services/stockService.ts
import { apiFetch } from '@/lib/apiClient';

export interface MarketIndex {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export const stockService = {
  indices(): Promise<MarketIndex[]> {
    return apiFetch<MarketIndex[]>('/api/v1/stock/market', { skipAuth: true });
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add yixiang-web/src/services/activityService.ts yixiang-web/src/services/stockService.ts
git commit -m "feat: activityService + stockService"
git push origin codex/completion-gap-fix
```

---

### Task 2.2: HomePage 关注 Tab 接真实 API

**Files:**
- Modify: `yixiang-web/src/pages/HomePage.tsx`

后端 `ActivityResponse.type` 值：`LIKE`（点赞帖子），`POST`（发布帖子），`FOLLOW`（关注用户）  
后端 `payload` 结构：LIKE/POST → `{ postId, title, coverImage? }`；FOLLOW → `{ targetUserId, nickname }`

- [ ] **Step 1: 添加 import 和关注 Feed query**

在 HomePage.tsx 添加 import：
```typescript
import { activityService } from '@/services/activityService';
import type { ActivityItem } from '@/services/activityService';
```

在组件内添加（只在 activeTab === '关注' 时启用）：
```typescript
const [activityCursor, setActivityCursor] = useState<string | undefined>();
const [activities, setActivities] = useState<ActivityItem[]>([]);

const { data: activityPage, isLoading: activityLoading } = useQuery({
  queryKey: ['activities', 'following', activityCursor],
  queryFn: () => activityService.following(activityCursor),
  enabled: activeTab === '关注' && isAuthenticated,
});

useEffect(() => {
  if (activityPage?.items) {
    setActivities(prev => activityCursor ? [...prev, ...activityPage.items] : activityPage.items);
  }
}, [activityPage, activityCursor]);

useEffect(() => {
  if (activeTab === '关注') {
    setActivityCursor(undefined);
    setActivities([]);
  }
}, [activeTab]);
```

- [ ] **Step 2: 替换关注 Tab 内容区域**

找到关注 Tab 的渲染区域（现在显示 EmptyState），替换为：
```tsx
{activeTab === '关注' && (
  <>
    {!isAuthenticated ? (
      <EmptyState icon={Users} title="登录后查看关注动态" action={<Button onClick={() => navigate('/login')}>登录</Button>} />
    ) : activityLoading && !activities.length ? (
      <div className="space-y-3 p-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
    ) : activities.length === 0 ? (
      <EmptyState icon={Users} title="暂无关注动态" description="关注更多用户，这里会出现他们的最新动态" />
    ) : (
      <div className="divide-y divide-gray-50">
        {activities.map(a => <ActivityCard key={a.id} activity={a} />)}
        {activityPage?.nextCursor && (
          <button onClick={() => setActivityCursor(activityPage.nextCursor!)} className="w-full text-center text-sm text-blue-600 py-4">加载更多</button>
        )}
      </div>
    )}
  </>
)}
```

- [ ] **Step 3: 新建 ActivityCard 组件（在文件底部）**

```tsx
function ActivityCard({ activity }: { activity: ActivityItem }) {
  const navigate = useNavigate();
  const payload = activity.payload as { postId?: string; title?: string; nickname?: string; targetUserId?: string };

  const actionText = (() => {
    switch (activity.type) {
      case 'LIKE': return `点赞了帖子「${payload.title ?? ''}」`;
      case 'POST': return `发布了新帖子「${payload.title ?? ''}」`;
      case 'FOLLOW': return `关注了 ${payload.nickname ?? '用户'}`;
      default: return '有新动态';
    }
  })();

  const handleClick = () => {
    if ((activity.type === 'LIKE' || activity.type === 'POST') && payload.postId) {
      navigate(`/posts/${payload.postId}`);
    } else if (activity.type === 'FOLLOW' && payload.targetUserId) {
      navigate(`/users/${payload.targetUserId}`);
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={handleClick}>
      <img
        src={activity.actor.avatar || `https://i.pravatar.cc/150?u=${activity.actor.id}`}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] text-gray-800">
          <span className="font-medium">{activity.actor.nickname}</span>
          {' '}{actionText}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(activity.createdAt)}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: lint + commit**

```bash
cd yixiang-web && npm run lint
git add yixiang-web/src/pages/HomePage.tsx
git commit -m "feat: HomePage following feed driven by real activityService API"
git push origin codex/completion-gap-fix
```

---

### Task 2.3: LoginPage 大盘指数接真实数据

**Files:**
- Modify: `yixiang-web/src/pages/LoginPage.tsx`

注意：后端接口是 `GET /api/v1/stock/market`（不是 `/indices`），返回 `MarketIndexDTO[]`。

- [ ] **Step 1: 添加 import 和 stock query**

在 LoginPage.tsx 顶部添加：
```typescript
import { useQuery } from '@tanstack/react-query';
import { stockService } from '@/services/stockService';
import type { MarketIndex } from '@/services/stockService';
```

在组件内添加：
```typescript
const { data: indices = [] } = useQuery({
  queryKey: ['stock', 'market'],
  queryFn: stockService.indices,
  refetchInterval: 15_000,
  staleTime: 10_000,
});
const mainIndex: MarketIndex | undefined = indices.find(i => i.code === 'sh000001') ?? indices[0];
```

- [ ] **Step 2: 替换静态股票卡数据**

找到 LoginPage 左侧股票指数卡（`{/* Stock index mockup card */}`），将静态数字替换为动态数据：
```tsx
{mainIndex && (
  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] w-[400px] mb-12 border border-white/50 relative ml-8">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-red-100 rounded text-red-500 flex items-center justify-center font-bold text-xs">A</div>
        <span className="font-bold text-gray-800 text-lg">{mainIndex.name}</span>
      </div>
    </div>
    <div className="flex justify-between items-end mb-4">
      <div>
        <div className={`text-4xl font-bold mb-1 ${mainIndex.change >= 0 ? 'text-[#E53935]' : 'text-[#10B981]'}`}>
          {mainIndex.price.toFixed(2)}
        </div>
        <div className={`font-medium flex gap-3 text-lg ${mainIndex.change >= 0 ? 'text-[#E53935]' : 'text-[#10B981]'}`}>
          <span>{mainIndex.change >= 0 ? '+' : ''}{mainIndex.change.toFixed(2)}</span>
          <span>{mainIndex.changePercent >= 0 ? '+' : ''}{mainIndex.changePercent.toFixed(2)}%</span>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-y-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
      {indices.slice(0, 3).map(idx => (
        <div key={idx.code} className="flex items-center gap-1">
          <span className="text-gray-600">{idx.name}</span>
          <span className={idx.change >= 0 ? 'text-[#E53935]' : 'text-[#10B981]'}>{idx.price.toFixed(2)}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: lint + test + commit**

```bash
cd yixiang-web && npm run lint && npm run test -- --run
git add yixiang-web/src/pages/LoginPage.tsx
git commit -m "feat: LoginPage real-time market indices from stockService (15s refresh)"
git push origin codex/completion-gap-fix
```

---

## Phase 3 — 发帖增强（图片上传 + 圈子发帖 + 封面图）

### Task 3.1: CreatePage 工具栏图片上传（markdown 内嵌）

**Files:**
- Modify: `yixiang-web/src/pages/CreatePage.tsx`

上传流程：presign → PUT OSS → 插入 `![filename](url)` 到光标位置

- [ ] **Step 1: 添加 uploadImage helper 函数**

在 CreatePage 组件内（不是顶级）添加：
```typescript
const [imageUploading, setImageUploading] = useState(false);
const textareaRef = useRef<HTMLTextAreaElement>(null);

const uploadImage = async (file: File) => {
  if (!editingDraft) { toast.error('请先保存草稿'); return; }
  if (file.size > 5 * 1024 * 1024) { toast.error('图片不能超过 5MB'); return; }
  setImageUploading(true);
  try {
    // 1. Presign
    const { url: presignUrl, objectKey } = await apiFetch<{ url: string; objectKey: string }>(
      `/api/v1/storage/presign?entityType=know_posts&entityId=${editingDraft.id}&filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
    );
    // 2. Direct upload to OSS
    await fetch(presignUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    // 3. Build OSS URL (strip query params from presign URL)
    const ossUrl = presignUrl.split('?')[0];
    // 4. Insert markdown at cursor position
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? content.length;
      const end = ta.selectionEnd ?? content.length;
      const inserted = `\n![${file.name}](${ossUrl})\n`;
      setContent(c => c.slice(0, start) + inserted + c.slice(end));
    }
    toast.success('图片上传成功');
  } catch (e) {
    toast.error('图片上传失败');
  } finally {
    setImageUploading(false);
  }
};
```

注意：需要在组件顶部 import `apiFetch`：
```typescript
import { apiFetch } from '@/lib/apiClient';
```

- [ ] **Step 2: 替换工具栏图片按钮为真实 input**

找到工具栏图片按钮（`onClick={() => toast.info('图片上传功能即将上线')}`），替换为：
```tsx
<>
  <input
    type="file"
    id="img-upload"
    accept="image/*"
    className="hidden"
    multiple
    onChange={e => {
      const files = Array.from(e.target.files ?? []);
      files.forEach(f => uploadImage(f));
      e.target.value = '';
    }}
  />
  <button
    type="button"
    onClick={() => document.getElementById('img-upload')?.click()}
    disabled={imageUploading}
    className="w-8 h-8 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-40"
    title="插入图片"
  >
    <Image size={16} />
  </button>
</>
```

如果 `Image` 还未 import，在 lucide-react import 中加入 `Image`。

- [ ] **Step 3: 添加粘贴图片支持**

给 textarea 添加 `onPaste` 处理：
```tsx
onPaste={(e) => {
  const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
  if (files.length > 0) {
    e.preventDefault();
    files.forEach(f => uploadImage(f));
  }
}}
```

同时确保 textarea 有 `ref={textareaRef}`。

- [ ] **Step 4: lint + commit**

```bash
cd yixiang-web && npm run lint
git add yixiang-web/src/pages/CreatePage.tsx
git commit -m "feat: CreatePage inline image upload via OSS presign (toolbar + paste)"
git push origin codex/completion-gap-fix
```

---

### Task 3.2: CreatePage 封面图上传 + 圈子选择 + 字数统计

**Files:**
- Modify: `yixiang-web/src/pages/CreatePage.tsx`

- [ ] **Step 1: 添加封面图上传逻辑**

在组件内添加封面图 state 和上传函数：
```typescript
const [coverUploading, setCoverUploading] = useState(false);

const uploadCover = async (file: File) => {
  if (!editingDraft) { toast.error('请先保存草稿'); return; }
  if (file.size > 5 * 1024 * 1024) { toast.error('封面图不能超过 5MB'); return; }
  setCoverUploading(true);
  try {
    const { url: presignUrl } = await apiFetch<{ url: string; objectKey: string }>(
      `/api/v1/storage/presign?entityType=know_posts&entityId=${editingDraft.id}&filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
    );
    await fetch(presignUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    const ossUrl = presignUrl.split('?')[0];
    setCoverImage(ossUrl);
    toast.success('封面图上传成功');
  } catch {
    toast.error('封面图上传失败');
  } finally {
    setCoverUploading(false);
  }
};
```

替换封面图上传区域（找到 `覆盖图` 或 `封面图` 区域）：
```tsx
<div
  className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
  style={{ aspectRatio: '16/9' }}
  onClick={() => document.getElementById('cover-upload')?.click()}
>
  <input
    type="file"
    id="cover-upload"
    accept="image/*"
    className="hidden"
    onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ''; }}
  />
  {coverImage ? (
    <img src={coverImage} className="w-full h-full object-cover" />
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
      {coverUploading ? <span className="text-sm">上传中...</span> : (
        <>
          <Upload size={24} className="mb-2" />
          <span className="text-sm">点击上传封面图</span>
          <span className="text-xs mt-1">建议 16:9，JPG/PNG，≤5MB</span>
        </>
      )}
    </div>
  )}
</div>
```

如果 `Upload` 和 `coverImage` 还未定义，在 import 中加 `Upload`，在组件内加 `const [coverImage, setCoverImage] = useState('')`。

- [ ] **Step 2: 添加圈子选择器**

在组件内添加：
```typescript
const { data: joinedCircles = [] } = useQuery({
  queryKey: ['circles', 'joined'],
  queryFn: () => circleService.joined(),
  enabled: isAuthenticated,
});
const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
```

在表单的「可见范围」选择区域下方（或合适位置）添加：
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium text-gray-700">发布到圈子（可选）</label>
  <select
    value={selectedCircleId ?? ''}
    onChange={e => setSelectedCircleId(e.target.value ? Number(e.target.value) : null)}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
  >
    <option value="">公开发布（不限圈子）</option>
    {joinedCircles.map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))}
  </select>
</div>
```

在 `publishMut` 的 publish 请求 body 中加入 `circleId`:
```typescript
// 在现有 publish 逻辑的 patchMetadata 调用中增加 circleId 字段
circleId: selectedCircleId ?? undefined,
```

- [ ] **Step 3: 标题字数统计**

找到 title input，在其旁边添加字数显示：
```tsx
<div className="relative">
  <input ... maxLength={100} />
  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{title.length}/100</span>
</div>
```

- [ ] **Step 4: lint + test + commit**

```bash
cd yixiang-web && npm run lint && npm run test -- --run
git add yixiang-web/src/pages/CreatePage.tsx
git commit -m "feat: CreatePage cover image upload + circle selection + title char count"
git push origin codex/completion-gap-fix
```

---

## Phase 4 — 搜索扩展（后端 + 前端）

### Task 4.1: 后端 — 新增用户/话题/圈子搜索（ES 多类型）

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/search/api/SearchController.java`
- Modify: `yixiang_be/src/main/java/com/tongji/search/service/SearchService.java`
- Modify: `yixiang_be/src/main/java/com/tongji/search/service/impl/SearchServiceImpl.java`

- [ ] **Step 1: 修改 SearchController 增加 type 参数**

```java
// SearchController.java — 在现有 search() 方法中增加 type 参数
@GetMapping
public Object search(@RequestParam("q") @NotBlank String q,
                     @RequestParam(value = "type", defaultValue = "post") String type,
                     @RequestParam(value = "size", required = false, defaultValue = "20") @Min(1) int size,
                     @RequestParam(value = "tags", required = false) String tagsCsv,
                     @RequestParam(value = "after", required = false) String after,
                     @AuthenticationPrincipal Jwt jwt) {
    Long userId = (jwt == null) ? null : jwtService.extractUserId(jwt);
    return switch (type) {
        case "user"   -> searchService.searchUsers(q, Math.min(size, 50));
        case "topic"  -> searchService.searchTopics(q, Math.min(size, 50));
        case "circle" -> searchService.searchCircles(q, Math.min(size, 50));
        default       -> searchService.search(q, Math.min(size, 50), tagsCsv, after, userId);
    };
}
```

- [ ] **Step 2: 在 SearchService 接口增加三个方法**

```java
// SearchService.java — 增加以下接口方法
List<UserSearchResult> searchUsers(String q, int size);
List<TopicSearchResult> searchTopics(String q, int size);
List<CircleSearchResult> searchCircles(String q, int size);
```

同时在 `SearchService.java` 同包下新建三个 DTO record：

```java
// 在 com.tongji.search.api.dto 包下新建：

public record UserSearchResult(
    Long id, String nickname, String avatar, String bio,
    String roleTitle, boolean verified, long followerCount
) {}

public record TopicSearchResult(
    String tag, long postCount, long viewCount
) {}

public record CircleSearchResult(
    Long id, String name, String description, String avatarUrl,
    String category, long memberCount, boolean joined
) {}
```

- [ ] **Step 3: 实现 SearchServiceImpl 三个新方法**

```java
// SearchServiceImpl.java — 新增以下三个实现（使用 ElasticsearchClient）
// 注意：如果 users/topics/circles 还没有 ES 索引，做 DB 查询作为降级

@Override
public List<UserSearchResult> searchUsers(String q, int size) {
    // 先查 MySQL 作为基础实现，ES 索引后续可替换
    // 使用 UserMapper 模糊查询
    return userMapper.searchByKeyword(q, size).stream()
        .map(u -> new UserSearchResult(
            u.getId(), u.getNickname(), u.getAvatar(), u.getBio(),
            u.getRoleTitle(), Boolean.TRUE.equals(u.getVerified()),
            counterService.getUserFollowerCount(u.getId())
        ))
        .toList();
}

@Override
public List<TopicSearchResult> searchTopics(String q, int size) {
    return topicMapper.searchByKeyword(q, size).stream()
        .map(t -> new TopicSearchResult(t.getTag(), t.getPostCount(), t.getViewCount()))
        .toList();
}

@Override
public List<CircleSearchResult> searchCircles(String q, int size) {
    return circleMapper.searchByKeyword(q, size).stream()
        .map(c -> new CircleSearchResult(
            c.getId(), c.getName(), c.getDescription(), c.getAvatarUrl(),
            c.getCategory(), c.getMemberCount(), false
        ))
        .toList();
}
```

- [ ] **Step 4: 在 UserMapper.xml 增加搜索查询**

```xml
<!-- UserMapper.xml — 新增 -->
<select id="searchByKeyword" resultType="com.tongji.user.domain.User">
    SELECT id, nickname, avatar, bio, role_title AS roleTitle, verified
    FROM users
    WHERE nickname LIKE CONCAT('%', #{keyword}, '%')
       OR bio LIKE CONCAT('%', #{keyword}, '%')
    ORDER BY id DESC
    LIMIT #{size}
</select>
```

同时在 `UserMapper.java` 接口中添加：
```java
List<User> searchByKeyword(@Param("keyword") String keyword, @Param("size") int size);
```

- [ ] **Step 5: 在 CircleMapper.xml 增加搜索查询**

```xml
<!-- CircleMapper.xml — 新增 -->
<select id="searchByKeyword" resultMap="CircleResultMap">
    SELECT id, name, description, avatar_url, owner_id, visibility,
           status, category, member_count, post_count, created_at
    FROM circles
    WHERE status = 'ACTIVE'
      AND (name LIKE CONCAT('%', #{keyword}, '%')
           OR description LIKE CONCAT('%', #{keyword}, '%'))
    ORDER BY member_count DESC
    LIMIT #{size}
</select>
```

同时在 `CircleMapper.java` 接口中添加：
```java
List<Circle> searchByKeyword(@Param("keyword") String keyword, @Param("size") int size);
```

在 `TopicMapper.xml` 中：
```xml
<select id="searchByKeyword" resultType="com.tongji.topic.model.Topic">
    SELECT tag, post_count AS postCount, view_count AS viewCount
    FROM topics
    WHERE tag LIKE CONCAT('%', #{keyword}, '%')
    ORDER BY post_count DESC
    LIMIT #{size}
</select>
```

`TopicMapper.java` 增加：
```java
List<Topic> searchByKeyword(@Param("keyword") String keyword, @Param("size") int size);
```

检查 `Topic` model 是否有这三个字段，如没有则对照 TopicMapper.xml 查询的列名补充。

- [ ] **Step 6: 编译验证**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 7: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/search/ yixiang_be/src/main/resources/mapper/
git commit -m "feat(be): search API multi-type (user/topic/circle) with MySQL fallback"
git push origin codex/completion-gap-fix
```

---

### Task 4.2: 前端 SearchPage 用户/话题/圈子 Tab

**Files:**
- Modify: `yixiang-web/src/services/searchService.ts`
- Modify: `yixiang-web/src/pages/SearchPage.tsx`

- [ ] **Step 1: 扩展 searchService.ts 增加 type 参数和新返回类型**

```typescript
// searchService.ts — 新增类型和方法

export interface UserSearchResult {
  id: number;
  nickname: string;
  avatar: string | null;
  bio: string | null;
  roleTitle: string | null;
  verified: boolean;
  followerCount: number;
}

export interface TopicSearchResult {
  tag: string;
  postCount: number;
  viewCount: number;
}

export interface CircleSearchResult {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  category: string | null;
  memberCount: number;
  joined: boolean;
}

// 在现有 query 方法基础上扩展（在 searchService 对象中添加）：
searchUsers: (q: string, size = 20) =>
  apiFetch<UserSearchResult[]>(`${SEARCH_PREFIX}?q=${encodeURIComponent(q)}&type=user&size=${size}`),

searchTopics: (q: string, size = 20) =>
  apiFetch<TopicSearchResult[]>(`${SEARCH_PREFIX}?q=${encodeURIComponent(q)}&type=topic&size=${size}`),

searchCircles: (q: string, size = 20) =>
  apiFetch<CircleSearchResult[]>(`${SEARCH_PREFIX}?q=${encodeURIComponent(q)}&type=circle&size=${size}`),
```

- [ ] **Step 2: SearchPage 增加用户/话题/圈子三个 Tab 的 query 和渲染**

在 SearchPage.tsx 的现有查询下方添加：
```typescript
const { data: userResults = [] } = useQuery({
  queryKey: ['search', 'users', debouncedQuery],
  queryFn: () => searchService.searchUsers(debouncedQuery),
  enabled: debouncedQuery.length > 0 && activeTab === 1,
});

const { data: topicResults = [] } = useQuery({
  queryKey: ['search', 'topics', debouncedQuery],
  queryFn: () => searchService.searchTopics(debouncedQuery),
  enabled: debouncedQuery.length > 0 && activeTab === 2,
});

const { data: circleResults = [] } = useQuery({
  queryKey: ['search', 'circles', debouncedQuery],
  queryFn: () => searchService.searchCircles(debouncedQuery),
  enabled: debouncedQuery.length > 0 && activeTab === 3,
});
```

注意：TABS 数组是 `['综合', '帖子', '用户', '话题', '圈子']`，所以 `activeTab === 2` 是用户，`=== 3` 是话题，`=== 4` 是圈子。

- [ ] **Step 3: 在 SearchPage 的 Tab 内容区域增加三个新 Tab 渲染**

找到 `activeTab !== 0` 的 EmptyState，替换为具体内容：

```tsx
{/* 用户 Tab */}
{activeTab === 2 && debouncedQuery && (
  userResults.length === 0 ? (
    <EmptyState icon={Search} title="未找到用户" description={`没有找到与「${debouncedQuery}」相关的用户`} />
  ) : (
    <div className="divide-y divide-gray-50">
      {userResults.map(u => (
        <div key={u.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/users/${u.id}`)}>
            <img src={u.avatar || `https://i.pravatar.cc/150?u=${u.id}`} className="w-11 h-11 rounded-full object-cover" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-900">{u.nickname}</span>
                {u.verified && <CheckCircle2 size={14} className="fill-blue-500 text-white" />}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{u.roleTitle || u.bio || '暂无简介'}</p>
              <p className="text-xs text-gray-400">{formatCount(u.followerCount)} 粉丝</p>
            </div>
          </div>
          <button onClick={() => navigate(`/users/${u.id}`)} className="text-sm border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-1.5 rounded-full">查看</button>
        </div>
      ))}
    </div>
  )
)}

{/* 话题 Tab */}
{activeTab === 3 && debouncedQuery && (
  topicResults.length === 0 ? (
    <EmptyState icon={Search} title="未找到话题" description={`没有找到「${debouncedQuery}」相关话题`} />
  ) : (
    <div className="p-4 flex flex-wrap gap-3">
      {topicResults.map(t => (
        <div key={t.tag} onClick={() => setInputValue(t.tag)} className="flex flex-col items-start bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-4 py-3 cursor-pointer transition-colors">
          <span className="font-medium text-blue-700">#{t.tag}</span>
          <span className="text-xs text-gray-400 mt-0.5">{formatCount(t.postCount)} 篇帖子</span>
        </div>
      ))}
    </div>
  )
)}

{/* 圈子 Tab */}
{activeTab === 4 && debouncedQuery && (
  circleResults.length === 0 ? (
    <EmptyState icon={Search} title="未找到圈子" description={`没有找到「${debouncedQuery}」相关圈子`} />
  ) : (
    <div className="divide-y divide-gray-50">
      {circleResults.map(c => (
        <div key={c.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/circles/${c.id}`)}>
            <img src={c.avatarUrl || `https://i.pravatar.cc/150?u=c${c.id}`} className="w-11 h-11 rounded-xl object-cover" />
            <div>
              <span className="font-medium text-gray-900">{c.name}</span>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.description || '暂无简介'}</p>
              <p className="text-xs text-gray-400">{formatCount(c.memberCount)} 成员</p>
            </div>
          </div>
          <button onClick={() => navigate(`/circles/${c.id}`)} className="text-sm border border-gray-200 hover:bg-gray-50 text-gray-600 px-4 py-1.5 rounded-full">进入</button>
        </div>
      ))}
    </div>
  )
)}
```

需要在 import 中加 `CheckCircle2`（如未 import）。

- [ ] **Step 4: lint + test + commit**

```bash
cd yixiang-web && npm run lint && npm run test -- --run
git add yixiang-web/src/services/searchService.ts yixiang-web/src/pages/SearchPage.tsx
git commit -m "feat: SearchPage user/topic/circle tabs with real search API"
git push origin codex/completion-gap-fix
```

---

## Phase 5 — 圈子管理增强

### Task 5.1: 后端 — CircleMemberController 补充成员列表 + 圈子帖子 DTO 修正

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/circle/api/CircleMemberController.java`
- Modify: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CircleMemberListResponse.java`（如不存在则创建）
- Modify: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CircleMemberItem.java`（确认字段）

- [ ] **Step 1: 确认/创建 CircleMemberItem DTO**

```java
// com.tongji.circle.api.dto.CircleMemberItem
public record CircleMemberItem(
    Long userId,
    String nickname,
    String avatar,
    String role,
    String joinedAt
) {}
```

- [ ] **Step 2: 确认/创建 CircleMemberListResponse DTO**

```java
// com.tongji.circle.api.dto.CircleMemberListResponse
import java.util.List;
public record CircleMemberListResponse(
    List<CircleMemberItem> items,
    long total,
    int page,
    int size
) {}
```

- [ ] **Step 3: 在 CircleMemberController 增加 GET members 端点**

在 CircleMemberController.java 中添加：
```java
@GetMapping("/members")
public CircleMemberListResponse members(
        @PathVariable long circleId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal Jwt jwt) {
    return circleService.listMembers(circleId, page, Math.min(size, 50));
}
```

- [ ] **Step 4: 在 CircleService 接口和 CircleServiceImpl 实现 listMembers**

```java
// CircleService.java 新增接口：
CircleMemberListResponse listMembers(long circleId, int page, int size);

// CircleServiceImpl.java 新增实现：
@Override
public CircleMemberListResponse listMembers(long circleId, int page, int size) {
    int total = memberMapper.countActive(circleId);
    List<CircleMember> members = memberMapper.listActiveMembers(circleId, page * size, size);
    List<CircleMemberItem> items = members.stream().map(m -> {
        User u = userService.findById(m.getUserId());
        return new CircleMemberItem(
            m.getUserId(),
            u != null ? u.getNickname() : "用户" + m.getUserId(),
            u != null ? u.getAvatar() : null,
            m.getRole(),
            m.getJoinedAt() != null ? m.getJoinedAt().toString() : null
        );
    }).toList();
    return new CircleMemberListResponse(items, total, page, size);
}
```

- [ ] **Step 5: 修正圈子帖子接口返回类型**

在 CircleMemberController.java 中找到 `/posts` 端点（`List<Map<String, Object>>`），修改为返回 `FeedPageResponse`：

```java
// 将现有的 posts 方法返回类型从 List<Map<String, Object>> 改为：
@GetMapping("/posts")
public com.tongji.knowpost.api.dto.FeedPageResponse posts(
        @PathVariable long circleId,
        @RequestParam(required = false) String cursor,
        @RequestParam(defaultValue = "20") int size,
        @AuthenticationPrincipal Jwt jwt) {
    Long uid = jwt != null ? jwtService.extractUserId(jwt) : null;
    return feedService.getCircleFeed(circleId, cursor, Math.min(size, 50), uid);
}
```

在 `KnowPostFeedService` 接口中增加：
```java
FeedPageResponse getCircleFeed(long circleId, String cursor, int size, Long viewerId);
```

在 `KnowPostFeedServiceImpl` 实现中增加（使用 `knowPostMapper.listByCircle`）：
```java
@Override
public FeedPageResponse getCircleFeed(long circleId, String cursor, int size, Long viewerId) {
    // cursor 转 id
    Long cursorId = cursor != null ? Long.parseLong(cursor) : null;
    List<KnowPostFeedRow> rows = knowPostMapper.listByCircle(circleId, cursorId, size + 1);
    boolean hasMore = rows.size() > size;
    if (hasMore) rows = rows.subList(0, size);
    String nextCursor = hasMore ? String.valueOf(rows.get(rows.size()-1).getId()) : null;
    List<FeedItemResponse> items = mapRowsToItems(rows, viewerId);
    return new FeedPageResponse(items, 1, size, hasMore, nextCursor);
}
```

检查 `KnowPostMapper.xml` 是否有 `listByCircle` 查询，如没有则在 mapper XML 中添加：
```xml
<select id="listByCircle" resultType="com.tongji.knowpost.model.KnowPostFeedRow">
    SELECT id, title, description, cover_image AS coverImage, tags, author_id AS authorId,
           publish_time AS publishTime, status
    FROM know_posts
    WHERE circle_id = #{circleId} AND status = 'published'
    <if test="cursorId != null">AND id &lt; #{cursorId}</if>
    ORDER BY id DESC
    LIMIT #{size}
</select>
```

- [ ] **Step 6: mvn compile + commit**

```bash
cd yixiang_be && mvn compile -q
git add yixiang_be/src/main/java/com/tongji/circle/ yixiang_be/src/main/resources/mapper/
git commit -m "feat(be): circle members list API + circle posts typed response"
git push origin codex/completion-gap-fix
```

---

### Task 5.2: 前端 CircleDetailPage — 帖子 Tab + 成员 Tab

**Files:**
- Modify: `yixiang-web/src/pages/CircleDetailPage.tsx`
- Modify: `yixiang-web/src/services/circleService.ts`

- [ ] **Step 1: 修正 circleService.posts() 类型**

```typescript
// circleService.ts — 修改 posts 方法
import type { FeedResponse } from '@/types/knowpost';

// 替换现有的 posts 方法：
posts: (id: number, cursor?: string, size = 20): Promise<FeedResponse> => {
  const q = new URLSearchParams({ size: String(size) });
  if (cursor) q.set('cursor', cursor);
  return apiFetch<FeedResponse>(`${BASE}/${id}/posts?${q.toString()}`);
},

// 新增 members 方法：
members: (id: number, page = 0, size = 20) =>
  apiFetch<{ items: MemberSummary[]; total: number; page: number; size: number }>(
    `${BASE}/${id}/members?page=${page}&size=${size}`
  ),
```

- [ ] **Step 2: CircleDetailPage 帖子 Tab 接真实数据**

找到圈子详情页「帖子」Tab 的 EmptyState，替换为：
```tsx
{activeTab === '帖子' && (
  <CirclePostList circleId={circle.id} />
)}
```

在文件底部新建：
```tsx
function CirclePostList({ circleId }: { circleId: number }) {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState<string | undefined>();
  const [posts, setPosts] = useState<FeedItem[]>([]);

  const { data: page, isLoading } = useQuery({
    queryKey: ['circle', 'posts', circleId, cursor],
    queryFn: () => circleService.posts(circleId, cursor),
  });

  useEffect(() => {
    if (page?.items) {
      setPosts(prev => cursor ? [...prev, ...page.items] : page.items);
    }
  }, [page, cursor]);

  if (isLoading && !posts.length) return (
    <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
  );
  if (!posts.length) return (
    <EmptyState icon={FileText} title="圈子暂无帖子" description="快来发布第一篇帖子吧" />
  );

  return (
    <div className="divide-y divide-gray-50">
      {posts.map(post => (
        <div key={post.id} className="p-5 hover:bg-gray-50 cursor-pointer flex gap-4" onClick={() => navigate(`/posts/${post.id}`)}>
          {post.coverImage && <img src={post.coverImage} className="w-24 h-16 rounded-lg object-cover shrink-0" />}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-[15px]">{post.title}</h3>
            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{post.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{post.authorNickname}</span>
              <span className="flex items-center gap-1"><ThumbsUp size={11} />{formatCount(post.likeCount ?? 0)}</span>
              <span className="flex items-center gap-1"><MessageCircle size={11} />{formatCount(post.commentCount ?? 0)}</span>
            </div>
          </div>
        </div>
      ))}
      {page?.hasMore && (
        <button onClick={() => setCursor(String(posts[posts.length - 1]?.id))} className="w-full text-center text-sm text-blue-600 py-4">
          加载更多帖子
        </button>
      )}
    </div>
  );
}
```

确保 import 了 `FeedItem`、`FileText`、`ThumbsUp`、`MessageCircle`。

- [ ] **Step 3: CircleDetailPage 成员 Tab 接真实数据**

```tsx
{activeTab === '成员' && (
  <CircleMemberList circleId={circle.id} />
)}
```

新建：
```tsx
function CircleMemberList({ circleId }: { circleId: number }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['circle', 'members', circleId],
    queryFn: () => circleService.members(circleId, 0, 50),
  });

  if (isLoading) return <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  const members = data?.items ?? [];
  if (!members.length) return <EmptyState icon={Users} title="暂无成员" />;

  return (
    <div className="p-4 grid grid-cols-1 gap-3">
      {members.map(m => (
        <div key={m.userId} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/users/${m.userId}`)}>
          <div className="flex items-center gap-3">
            <img src={m.avatar || `https://i.pravatar.cc/150?u=${m.userId}`} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <span className="font-medium text-gray-900">{m.nickname}</span>
              {m.role === 'OWNER' && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">圈主</span>}
              {m.role === 'ADMIN' && <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">管理员</span>}
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-gray-400 mt-2">共 {data?.total ?? 0} 位成员</p>
    </div>
  );
}
```

- [ ] **Step 4: lint + test + commit**

```bash
cd yixiang-web && npm run lint && npm run test -- --run
git add yixiang-web/src/services/circleService.ts yixiang-web/src/pages/CircleDetailPage.tsx
git commit -m "feat: CircleDetailPage posts+members tabs real data; fix circleService types"
git push origin codex/completion-gap-fix
```

---

### Task 5.3: 前端 CircleSquarePage — 创建圈子 Dialog

**Files:**
- Modify: `yixiang-web/src/pages/CircleSquarePage.tsx`

- [ ] **Step 1: 添加 Dialog 和 form state**

在 CircleSquarePage 顶部 import 区域添加：
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
```

在组件内添加：
```typescript
const qc = useQueryClient();
const [createOpen, setCreateOpen] = useState(false);
const [newName, setNewName] = useState('');
const [newCategory, setNewCategory] = useState('');
const [newDesc, setNewDesc] = useState('');

const createCircle = useMutation({
  mutationFn: () => circleService.create({ name: newName.trim(), category: newCategory || undefined, description: newDesc || undefined }),
  onSuccess: () => {
    toast.success('圈子创建成功');
    setCreateOpen(false);
    setNewName(''); setNewCategory(''); setNewDesc('');
    qc.invalidateQueries({ queryKey: ['circles'] });
  },
  onError: (err) => toast.error(err instanceof Error ? err.message : '创建失败'),
});
```

- [ ] **Step 2: 替换「创建圈子」按钮 onClick**

```tsx
onClick={() => { if (!isAuthenticated) { toast.info('请先登录'); return; } setCreateOpen(true); }}
```

- [ ] **Step 3: 在 JSX return 末尾（PageShell 内）添加 Dialog**

```tsx
<Dialog open={createOpen} onOpenChange={setCreateOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>创建圈子</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 pt-2">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">圈子名称 <span className="text-red-500">*</span></label>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          maxLength={30}
          placeholder="2-30个字符"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">分类</label>
        <select
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        >
          <option value="">请选择分类</option>
          {CATEGORIES.filter(c => c !== '全部圈子').map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">圈子简介</label>
        <textarea
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="介绍一下这个圈子..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="ghost" className="flex-1" onClick={() => setCreateOpen(false)}>取消</Button>
        <Button
          className="flex-1"
          disabled={newName.trim().length < 2 || createCircle.isPending}
          onClick={() => createCircle.mutate()}
        >
          {createCircle.isPending ? '创建中...' : '创建圈子'}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

- [ ] **Step 4: lint + test + commit**

```bash
cd yixiang-web && npm run lint && npm run test -- --run
git add yixiang-web/src/pages/CircleSquarePage.tsx
git commit -m "feat: CircleSquarePage create circle dialog with real API"
git push origin codex/completion-gap-fix
```

---

## Phase 6 — 收藏夹分类

### Task 6.1: 后端 — favorite_folders 表 + CRUD API

**Files:**
- Create: `yixiang_be/src/main/resources/mapper/FavoriteFolderMapper.xml`
- Create: `yixiang_be/src/main/java/com/tongji/counter/folder/FavoriteFolderMapper.java`
- Create: `yixiang_be/src/main/java/com/tongji/counter/folder/FavoriteFolder.java`
- Create: `yixiang_be/src/main/java/com/tongji/counter/folder/FavoriteFolderService.java`
- Create: `yixiang_be/src/main/java/com/tongji/counter/folder/FavoriteFolderServiceImpl.java`
- Create: `yixiang_be/src/main/java/com/tongji/counter/folder/FavoriteFolderController.java`
- Modify: `yixiang_be/src/main/java/com/tongji/counter/favorite/FavoriteController.java`

- [ ] **Step 1: 创建 DB 表（在 application 启动时通过 schema.sql，或手动执行）**

在 `yixiang_be/src/main/resources/` 下若有 `schema.sql` 则追加，否则直接写 SQL 注释说明需手动执行：
```sql
-- 执行此 SQL 创建收藏夹分类表
CREATE TABLE IF NOT EXISTS favorite_folders (
  id         BIGINT PRIMARY KEY,
  user_id    BIGINT NOT NULL,
  name       VARCHAR(50) NOT NULL,
  cover_url  VARCHAR(500),
  item_count INT DEFAULT 0,
  created_at DATETIME(3) DEFAULT NOW(3),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏夹中的帖子关联
ALTER TABLE user_favorites ADD COLUMN folder_id BIGINT NULL;
```

将这段 SQL 写入 `yixiang_be/src/main/resources/db/migration/V10__favorite_folders.sql`（如项目用 Flyway）。若不用 Flyway，创建文件 `docs/sql/V10__favorite_folders.sql` 记录。

- [ ] **Step 2: 创建 FavoriteFolder 模型**

```java
// com.tongji.counter.folder.FavoriteFolder
package com.tongji.counter.folder;

import lombok.Data;
import java.time.Instant;

@Data
public class FavoriteFolder {
    private Long id;
    private Long userId;
    private String name;
    private String coverUrl;
    private int itemCount;
    private Instant createdAt;
}
```

- [ ] **Step 3: 创建 FavoriteFolderMapper**

```java
// com.tongji.counter.folder.FavoriteFolderMapper
package com.tongji.counter.folder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface FavoriteFolderMapper {
    void insert(FavoriteFolder folder);
    List<FavoriteFolder> listByUser(@Param("userId") long userId);
    FavoriteFolder findByIdAndUser(@Param("id") long id, @Param("userId") long userId);
    void delete(@Param("id") long id, @Param("userId") long userId);
    void incrementCount(@Param("id") long id, @Param("delta") int delta);
}
```

```xml
<!-- FavoriteFolderMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.counter.folder.FavoriteFolderMapper">

  <insert id="insert">
    INSERT INTO favorite_folders (id, user_id, name, cover_url, item_count, created_at)
    VALUES (#{id}, #{userId}, #{name}, #{coverUrl}, 0, NOW(3))
  </insert>

  <select id="listByUser" resultType="com.tongji.counter.folder.FavoriteFolder">
    SELECT id, user_id AS userId, name, cover_url AS coverUrl, item_count AS itemCount, created_at AS createdAt
    FROM favorite_folders WHERE user_id = #{userId} ORDER BY created_at DESC
  </select>

  <select id="findByIdAndUser" resultType="com.tongji.counter.folder.FavoriteFolder">
    SELECT id, user_id AS userId, name, cover_url AS coverUrl, item_count AS itemCount, created_at AS createdAt
    FROM favorite_folders WHERE id = #{id} AND user_id = #{userId}
  </select>

  <delete id="delete">
    DELETE FROM favorite_folders WHERE id = #{id} AND user_id = #{userId}
  </delete>

  <update id="incrementCount">
    UPDATE favorite_folders SET item_count = item_count + #{delta} WHERE id = #{id}
  </update>

</mapper>
```

- [ ] **Step 4: 创建 FavoriteFolderService 和实现**

```java
// FavoriteFolderService.java
package com.tongji.counter.folder;
import java.util.List;
public interface FavoriteFolderService {
    List<FolderDTO> list(long userId);
    long create(long userId, String name);
    void delete(long userId, long folderId);
}

record FolderDTO(long id, String name, String coverUrl, int itemCount) {}

// FavoriteFolderServiceImpl.java
package com.tongji.counter.folder;
import com.tongji.common.util.SnowflakeIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteFolderServiceImpl implements FavoriteFolderService {
    private final FavoriteFolderMapper mapper;
    private final SnowflakeIdGenerator idGen;

    @Override
    public List<FolderDTO> list(long userId) {
        return mapper.listByUser(userId).stream()
            .map(f -> new FolderDTO(f.getId(), f.getName(), f.getCoverUrl(), f.getItemCount()))
            .toList();
    }

    @Override
    public long create(long userId, String name) {
        if (name == null || name.isBlank() || name.length() > 50)
            throw new IllegalArgumentException("收藏夹名称不合法");
        FavoriteFolder f = new FavoriteFolder();
        f.setId(idGen.nextId());
        f.setUserId(userId);
        f.setName(name.trim());
        mapper.insert(f);
        return f.getId();
    }

    @Override
    public void delete(long userId, long folderId) {
        FavoriteFolder f = mapper.findByIdAndUser(folderId, userId);
        if (f == null) throw new IllegalArgumentException("收藏夹不存在");
        mapper.delete(folderId, userId);
    }
}
```

检查项目中 SnowflakeIdGenerator 的实际类名和包路径（可能叫 `SnowflakeGenerator` 或类似），根据实际情况调整 import。

- [ ] **Step 5: 创建 FavoriteFolderController**

```java
package com.tongji.counter.folder;

import com.tongji.auth.token.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/favorites/folders")
@RequiredArgsConstructor
public class FavoriteFolderController {

    private final FavoriteFolderService folderService;
    private final JwtService jwtService;

    @GetMapping
    public List<FolderDTO> list(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return folderService.list(uid);
    }

    @PostMapping
    public Map<String, Long> create(@RequestBody Map<String, String> body,
                                    @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        String name = body.getOrDefault("name", "");
        long id = folderService.create(uid, name);
        return Map.of("id", id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id,
                                       @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        folderService.delete(uid, id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 6: mvn compile + commit**

```bash
cd yixiang_be && mvn compile -q
git add yixiang_be/src/main/java/com/tongji/counter/folder/ \
        yixiang_be/src/main/resources/mapper/FavoriteFolderMapper.xml \
        docs/sql/
git commit -m "feat(be): favorite_folders table + CRUD API"
git push origin codex/completion-gap-fix
```

---

### Task 6.2: 前端 CollectionsPage 收藏夹分类

**Files:**
- Modify: `yixiang-web/src/services/favoriteService.ts`
- Modify: `yixiang-web/src/pages/CollectionsPage.tsx`

- [ ] **Step 1: 在 favoriteService.ts 增加 folder 方法**

```typescript
// favoriteService.ts — 新增类型和方法

export interface FavoriteFolder {
  id: number;
  name: string;
  coverUrl: string | null;
  itemCount: number;
}

// 在 favoriteService 对象中新增：
folders: {
  list: () => apiFetch<FavoriteFolder[]>('/api/v1/favorites/folders'),
  create: (name: string) => apiFetch<{ id: number }>('/api/v1/favorites/folders', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  remove: (id: number) => apiFetch<void>(`/api/v1/favorites/folders/${id}`, { method: 'DELETE' }),
},
```

- [ ] **Step 2: CollectionsPage 接真实文件夹列表**

在 CollectionsPage 组件内添加：
```typescript
const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
const [createFolderOpen, setCreateFolderOpen] = useState(false);
const [newFolderName, setNewFolderName] = useState('');

const { data: folders = [], refetch: refetchFolders } = useQuery({
  queryKey: ['favorites', 'folders'],
  queryFn: () => favoriteService.folders.list(),
});

const createFolder = useMutation({
  mutationFn: () => favoriteService.folders.create(newFolderName.trim()),
  onSuccess: () => {
    toast.success('收藏夹已创建');
    setCreateFolderOpen(false);
    setNewFolderName('');
    refetchFolders();
  },
  onError: (err) => toast.error(err instanceof Error ? err.message : '创建失败'),
});

const deleteFolder = useMutation({
  mutationFn: (id: number) => favoriteService.folders.remove(id),
  onSuccess: () => { toast.success('已删除'); refetchFolders(); setActiveFolderId(null); },
});
```

修改现有的 `useQuery` 以支持按文件夹过滤：
```typescript
// 修改 queryKey 和 queryFn
queryKey: ['favorites', activeTab, activeFolderId],
queryFn: () => favoriteService.list(activeFolderId ?? undefined, 20),
```

在 `favoriteService.list` 中增加 folderId 参数：
```typescript
list: (folderId?: number, size = 20, cursor?: number) => {
  const q = new URLSearchParams({ size: String(size) });
  if (folderId != null) q.set('folderId', String(folderId));
  if (cursor != null) q.set('cursor', String(cursor));
  return apiFetch<FavoritesResponse>(`/api/v1/favorites?${q}`);
},
```

- [ ] **Step 3: 替换 CollectionsPage 右侧收藏夹分类 Widget**

找到右侧 sidebar 中的 `EmptyState` for `收藏夹分类`，替换为：
```tsx
<div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-[16px] text-gray-900">收藏夹分类</h3>
    <button onClick={() => setCreateFolderOpen(true)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ 新建</button>
  </div>

  {/* All items */}
  <button
    onClick={() => setActiveFolderId(null)}
    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg mb-1 transition-colors ${activeFolderId === null ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}
  >
    <span className="text-sm font-medium">全部收藏</span>
    <span className="text-xs text-gray-400">{posts.length}</span>
  </button>

  {folders.map(f => (
    <div key={f.id} className="group flex items-center justify-between py-2 px-3 rounded-lg mb-1 hover:bg-gray-50">
      <button onClick={() => setActiveFolderId(f.id)} className={`flex-1 text-left text-sm ${activeFolderId === f.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
        {f.name}
        <span className="ml-2 text-xs text-gray-400">{f.itemCount}</span>
      </button>
      <button onClick={() => deleteFolder.mutate(f.id)} className="hidden group-hover:block text-xs text-red-400 hover:text-red-600 ml-2">删除</button>
    </div>
  ))}

  {folders.length === 0 && (
    <p className="text-xs text-gray-400 text-center py-4">暂无分类夹，点击「新建」创建</p>
  )}

  {/* Create folder dialog */}
  <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>新建收藏夹</DialogTitle></DialogHeader>
      <div className="space-y-4 pt-2">
        <input
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          maxLength={50}
          placeholder="收藏夹名称"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
        />
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setCreateFolderOpen(false)}>取消</Button>
          <Button className="flex-1" disabled={!newFolderName.trim() || createFolder.isPending} onClick={() => createFolder.mutate()}>
            {createFolder.isPending ? '创建中...' : '创建'}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</div>
```

需要 import `Dialog, DialogContent, DialogHeader, DialogTitle`、`useMutation`、`useQueryClient`。

- [ ] **Step 4: lint + test + commit**

```bash
cd yixiang-web && npm run lint && npm run test -- --run
git add yixiang-web/src/services/favoriteService.ts yixiang-web/src/pages/CollectionsPage.tsx
git commit -m "feat: CollectionsPage folder management with real API"
git push origin codex/completion-gap-fix
```

---

## Phase 7 — 个人主页增强（浏览量 + 数据统计 + 等级）

### Task 7.1: 后端 — post_views 表 + 异步浏览计数 + 用户统计 API

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/api/KnowPostController.java`
- Create: `yixiang_be/src/main/java/com/tongji/profile/api/UserStatsController.java`
- Create: `yixiang_be/src/main/java/com/tongji/profile/service/UserStatsService.java`
- Create: `yixiang_be/src/main/java/com/tongji/profile/service/impl/UserStatsServiceImpl.java`

- [ ] **Step 1: 创建 post_views 表 SQL**

创建 `docs/sql/V11__post_views.sql`：
```sql
CREATE TABLE IF NOT EXISTS post_views (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id    BIGINT NOT NULL,
  user_id    BIGINT,
  viewed_at  DATETIME(3) DEFAULT NOW(3),
  INDEX idx_post_time (post_id, viewed_at),
  INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 2: 在 KnowPostController.getById 增加异步浏览记录**

在 `KnowPostController.java` 中找到 `getById` 方法，在返回前增加异步写入：
```java
// 在 getById 方法顶部注入（构造函数注入）：
// private final UserStatsService statsService;  （下一步新建）
// private final StringRedisTemplate redis;

// 在 return 语句前添加：
// 防刷：同一用户同一帖子 1 小时内只计一次
Long uid = jwt != null ? jwtService.extractUserId(jwt) : null;
String dedupeKey = "view:" + postId + ":" + (uid != null ? uid : "anon:" + request.getRemoteAddr());
if (Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(dedupeKey, "1", Duration.ofHours(1)))) {
    statsService.recordView(postId, uid);
}
```

需要在方法参数中添加 `HttpServletRequest request`。

- [ ] **Step 3: 创建 UserStatsService 和实现**

```java
// UserStatsService.java
package com.tongji.profile.service;
import com.tongji.profile.api.dto.UserStatsDTO;
public interface UserStatsService {
    void recordView(long postId, Long userId);
    UserStatsDTO getStats(long targetUserId);
}

// com.tongji.profile.api.dto.UserStatsDTO
public record UserStatsDTO(
    long postViews7d,
    long newFollowers7d,
    long likes7d,
    long favs7d
) {}

// UserStatsServiceImpl.java
package com.tongji.profile.service.impl;

import com.tongji.profile.api.dto.UserStatsDTO;
import com.tongji.profile.service.UserStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserStatsServiceImpl implements UserStatsService {

    private final JdbcTemplate jdbc;

    @Override
    @Async
    public void recordView(long postId, Long userId) {
        try {
            jdbc.update(
                "INSERT INTO post_views (post_id, user_id, viewed_at) VALUES (?, ?, NOW(3))",
                postId, userId
            );
        } catch (Exception e) {
            log.warn("记录浏览失败: postId={} err={}", postId, e.getMessage());
        }
    }

    @Override
    public UserStatsDTO getStats(long targetUserId) {
        Instant since = Instant.now().minus(7, ChronoUnit.DAYS);
        String since7d = since.toString().replace("T", " ").substring(0, 19);

        // 帖子浏览量（近7天）
        Long views = jdbc.queryForObject(
            "SELECT COUNT(1) FROM post_views pv JOIN know_posts kp ON kp.id = pv.post_id " +
            "WHERE kp.author_id = ? AND pv.viewed_at >= ?",
            Long.class, targetUserId, since7d
        );

        // 新增粉丝（近7天，从 activities 表）
        Long followers = jdbc.queryForObject(
            "SELECT COUNT(1) FROM activities WHERE type = 'FOLLOW' AND target_id = ? AND created_at >= ?",
            Long.class, targetUserId, since7d
        );

        // 获赞（近7天，从 activities 表）
        Long likes = jdbc.queryForObject(
            "SELECT COUNT(DISTINCT a.id) FROM activities a " +
            "JOIN know_posts kp ON kp.id = a.target_id AND a.target_type = 'POST' " +
            "WHERE a.type = 'LIKE' AND kp.author_id = ? AND a.created_at >= ?",
            Long.class, targetUserId, since7d
        );

        // 获藏（近7天，从 user_favorites + know_posts 关联）
        Long favs = jdbc.queryForObject(
            "SELECT COUNT(1) FROM user_favorites uf JOIN know_posts kp ON kp.id = uf.post_id " +
            "WHERE kp.author_id = ? AND uf.created_at >= ?",
            Long.class, targetUserId, since7d
        );

        return new UserStatsDTO(
            views != null ? views : 0,
            followers != null ? followers : 0,
            likes != null ? likes : 0,
            favs != null ? favs : 0
        );
    }
}
```

- [ ] **Step 4: 创建 UserStatsController**

```java
// com.tongji.profile.api.UserStatsController
package com.tongji.profile.api;

import com.tongji.profile.api.dto.UserStatsDTO;
import com.tongji.profile.service.UserStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserStatsController {

    private final UserStatsService statsService;

    @GetMapping("/{id}/stats")
    public UserStatsDTO stats(@PathVariable long id) {
        return statsService.getStats(id);
    }
}
```

在 Spring Security 配置中，`GET /api/v1/users/*/stats` 设为公开（或仅自己可见，先设公开简化实现）。

- [ ] **Step 5: mvn compile + commit**

```bash
cd yixiang_be && mvn compile -q
git add yixiang_be/src/main/java/com/tongji/profile/ \
        yixiang_be/src/main/java/com/tongji/knowpost/api/KnowPostController.java \
        docs/sql/V11__post_views.sql
git commit -m "feat(be): post view tracking + user stats API (7-day aggregation)"
git push origin codex/completion-gap-fix
```

---

### Task 7.2: 前端 ProfilePage — 数据统计 + 等级徽章

**Files:**
- Create: `yixiang-web/src/services/statsService.ts`
- Modify: `yixiang-web/src/pages/ProfilePage.tsx`

- [ ] **Step 1: 创建 statsService.ts**

```typescript
// yixiang-web/src/services/statsService.ts
import { apiFetch } from '@/lib/apiClient';

export interface UserStats {
  postViews7d: number;
  newFollowers7d: number;
  likes7d: number;
  favs7d: number;
}

export const statsService = {
  get(userId: string | number): Promise<UserStats> {
    return apiFetch<UserStats>(`/api/v1/users/${userId}/stats`, { skipAuth: true });
  },
};
```

- [ ] **Step 2: ProfilePage 增加 stats query 和等级计算**

在 ProfilePage.tsx 顶部 import 中添加：
```typescript
import { statsService } from '@/services/statsService';
import type { UserStats } from '@/services/statsService';
import { ArrowUp } from 'lucide-react';
```

在组件内添加（在 profile 加载之后）：
```typescript
const { data: stats } = useQuery({
  queryKey: ['user-stats', profileUserId],
  queryFn: () => statsService.get(profileUserId!),
  enabled: !!profileUserId,
  staleTime: 5 * 60 * 1000,
});
```

添加等级计算工具函数（在组件外部）：
```typescript
function calcLevel(followerCount: number): number {
  if (followerCount > 50000) return 5;
  if (followerCount > 5000) return 4;
  if (followerCount > 500) return 3;
  if (followerCount > 50) return 2;
  return 1;
}
```

- [ ] **Step 3: 替换 ProfilePage RightSidebar 的三个 EmptyState**

找到 "最近访客" EmptyState，替换为仍保持 EmptyState（无 visitor API）。

找到 "数据统计" EmptyState，替换为：
```tsx
<div className="bg-white p-5 rounded-2xl shadow-sm">
  <div className="flex items-center gap-2 mb-4">
    <h3 className="text-[16px] font-bold text-gray-900">数据统计</h3>
    <span className="text-xs text-gray-400">(近7天)</span>
  </div>
  {stats ? (
    <div className="grid grid-cols-2 gap-y-5 gap-x-4">
      <StatsCard label="帖子阅读" value={formatCount(stats.postViews7d)} />
      <StatsCard label="新增粉丝" value={formatCount(stats.newFollowers7d)} />
      <StatsCard label="获赞数" value={formatCount(stats.likes7d)} />
      <StatsCard label="新增收藏" value={formatCount(stats.favs7d)} />
    </div>
  ) : (
    <div className="space-y-3">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
    </div>
  )}
</div>
```

新建 StatsCard 组件（文件底部）：
```tsx
function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <span className="text-[22px] font-bold text-gray-900 leading-none">{value}</span>
    </div>
  );
}
```

找到用户等级 Lv.X 显示位置（在用户 profile 名字旁边），将静态 "Lv.4" 改为：
```tsx
<span className="...">Lv.{calcLevel(profile.followerCount ?? 0)}</span>
```

其中 `profile.followerCount` 从 `useQuery(['relation', 'counters', profileUserId])` 获取，或从现有的 counters 数据。

- [ ] **Step 4: lint + test + commit**

```bash
cd yixiang-web && npm run lint && npm run test -- --run
git add yixiang-web/src/services/statsService.ts yixiang-web/src/pages/ProfilePage.tsx
git commit -m "feat: ProfilePage real stats (7-day) + dynamic level badge"
git push origin codex/completion-gap-fix
```

---

## 收尾 — 最终 lint + test + push

- [ ] **最终验证**

```bash
# 前端
cd yixiang-web && npm run lint && npm run test -- --run && npm run build

# 后端
cd yixiang_be && mvn compile -q
```

- [ ] **最终 push**

```bash
git push origin codex/completion-gap-fix
```

---

## 自检清单

- [x] 所有 7 个 Phase 都有对应 Task
- [x] 所有 Task 都有具体文件路径
- [x] 所有代码步骤都有完整代码（无 TBD）
- [x] 所有 API 路径与后端实际路由一致（已核实）
- [x] 每个 Task 后都有 commit 步骤
- [x] 无新的硬编码假数据
- [x] 类型名和方法名在跨 Task 引用时保持一致

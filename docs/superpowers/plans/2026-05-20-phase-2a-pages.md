# Phase 2a: 前端 6 简单页面 1:1 还原原型 + 真 API 接入

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace P0 stubs of 6 simpler pages with full prototype-matching implementations, connected to real backend APIs, with production-quality loading/empty/error states.

**Context (read first):** P0 (frontend foundation) and P1 + P1.5 (backend all APIs) are complete. All 12 page stubs exist at `yixiang-web/src/pages/`, each rendering a placeholder card. This plan replaces 6 of them with complete implementations matching `原型设计图/preview/src/` prototypes pixel-for-pixel, using real API data via TanStack Query.

**Page ordering (easiest first):**

| # | Page | Prototype | Key APIs | Complexity |
|---|------|-----------|----------|------------|
| A | LoginPage | `登录页.jsx` | authService.login | ⭐ |
| B | RegisterPage | `注册页.jsx` | authService.register | ⭐ |
| C | ProfilePage | `个人主页.jsx` | profile + knowpost + relation | ⭐⭐ |
| D | FollowListPage | `关注粉丝列表页.jsx` | relation | ⭐⭐ |
| E | NotificationPage | `通知中心页.jsx` | notification + SSE | ⭐⭐ |
| F | CollectionsPage | `我的收藏页.jsx` | favorite | ⭐⭐ |

**Architecture:** Each page follows the same pattern:
1. Replace stub JSX with prototype-matching layout
2. Replace hardcoded mock data with TanStack Query (`useQuery` / `useMutation`)
3. Add three UI states: loading (skeleton), empty (EmptyState), error (ErrorBoundary + retry)
4. Add optimistic updates for high-frequency interactions (follow/unfollow, mark-read)
5. Form pages (Login, Register) use react-hook-form + zod validation

**Key constraints:**
- `features/` directory is currently empty; create feature hooks where TanStack Query usage benefits from encapsulation (optimistic updates, cache key management, multi-component reuse)
- Login/Register pages are standalone (no AppLayout wrapper) — already configured in `routes.tsx`
- Profile/FollowList/Notification/Collections pages use AppLayout (sidebar + header) — already configured in `routes.tsx`
- All UI components use existing shadcn primitives in `src/components/ui/` + Tailwind v4 utility classes
- Icons use `lucide-react` (same as prototypes)
- Date formatting: `date-fns` with zh-CN locale for relative time

**Sequencing note for executor:** Tasks within each Section are ordered — complete them in sequence. Sections A-F can be executed in order (A→B→C→D→E→F). Each Task is designed to be a single commit; very small adjacent Tasks may be combined at executor discretion.

---

## File Structure

### Create (new files)

```
yixiang-web/src/
├── features/
│   ├── profile/
│   │   └── useProfile.ts          # useQuery wrapper for GET /profile/{userId}
│   ├── relation/
│   │   ├── useFollow.ts           # useMutation + optimistic update
│   │   └── useUnfollow.ts         # useMutation + optimistic update
│   └── notification/
│       ├── useNotifications.ts    # useInfiniteQuery for notification list
│       └── useUnreadCount.ts      # useQuery + SSE polling
├── hooks/
│   └── useDebounce.ts             # generic debounce hook
└── lib/
    └── formatters.ts              # formatRelativeTime, formatCount, etc.
```

### Modify (existing files)

```
yixiang-web/src/
├── services/
│   ├── profileService.ts          # add getProfile(userId) method
│   └── knowpostService.ts         # add getLikedPosts(userId, cursor) method
├── pages/
│   ├── LoginPage.tsx              # full replacement
│   ├── RegisterPage.tsx           # full replacement
│   ├── ProfilePage.tsx            # full replacement
│   ├── FollowListPage.tsx         # full replacement
│   ├── NotificationPage.tsx       # full replacement
│   └── CollectionsPage.tsx        # full replacement
├── types/
│   ├── profile.ts                 # add LikedPostsResponse type (if needed)
│   └── knowpost.ts               # verify FeedItem has all needed fields
└── components/
    └── layout/
        └── Header.tsx             # wire notification unread count to real data (Task 0.9)
```

---

## Verification Commands

Run from `yixiang-web/` (requires Node.js 18+):

```bash
npm run dev        # start dev server on :5173, verify pages visually
npm run build      # tsc && vite build — must pass
npm run lint       # tsc --noEmit — zero errors
npm test           # vitest — existing 4 tests must still pass
```

Backend must be running on `localhost:8080` for API calls to succeed. Ensure `VITE_API_BASE_URL=http://localhost:8080` in `.env` (or rely on Vite proxy in `vite.config.ts`).

---

## Pre-Section: Foundation — Service Gaps + Shared Hooks

Complete these BEFORE starting any page section. These create the shared infrastructure that all pages depend on.

---

### Task 0.1: Add `lib/formatters.ts` — shared formatting utilities

Create `yixiang-web/src/lib/formatters.ts` with:

```ts
// formatRelativeTime: converts ISO date string to relative Chinese time
// Uses date-fns formatDistanceToNow with zh-CN locale
// Examples: "刚刚", "5 分钟前", "2 小时前", "昨天 15:30", "11-08 10:45"
import { formatDistanceToNow, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffHours < 48) return `昨天 ${format(date, 'HH:mm')}`;
  return format(date, 'MM-dd HH:mm');
}

export function formatCount(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return n.toLocaleString('zh-CN');
  return String(n);
}
```

Verify: `npx tsc --noEmit` passes (only checks types for this file).

---

### Task 0.2: Add `hooks/useDebounce.ts`

```ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
```

---

### Task 0.3: Add `profileService.getProfile(userId)` to `services/profileService.ts`

Add this method to the existing `profileService` object (the endpoint was created in P1.5 Section A):

```ts
getProfile: (userId: number) =>
  apiFetch<ProfileResponse>(`${PROFILE_PREFIX}/${userId}`),
```

The import of `ProfileResponse` from `@/types/profile` is already present. No new imports needed.

---

### Task 0.4: Add `profileService.getLikedPosts(userId, cursor?)` to `services/profileService.ts`

Add this method (endpoint created in P1.5 Section B):

```ts
getLikedPosts: (userId: number, cursor?: number, size = 20) => {
  const params = new URLSearchParams({ userId: String(userId), size: String(size) });
  if (cursor) params.set('cursor', String(cursor));
  return apiFetch<{ items: FeedItem[]; nextCursor: number | null; hasMore: boolean }>(
    `/api/v1/knowposts/liked?${params.toString()}`
  );
},
```

Add the import at top of file:
```ts
import type { FeedItem } from '@/types/knowpost';
```

---

### Task 0.5: Create `features/profile/useProfile.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import type { ProfileResponse } from '@/types/profile';

export function useProfile(userId: number | undefined) {
  return useQuery<ProfileResponse>({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getProfile(userId!),
    enabled: userId != null,
    staleTime: 60_000,
  });
}
```

---

### Task 0.6: Create `features/relation/useFollow.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { relationService } from '@/services/relationService';

export function useFollow(userId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => relationService.follow(userId),
    onMutate: async () => {
      // Cancel outgoing queries for this relation status
      await qc.cancelQueries({ queryKey: ['relation', 'status', userId] });
      // Snapshot previous value
      const prev = qc.getQueryData(['relation', 'status', userId]);
      // Optimistically set to following
      qc.setQueryData(['relation', 'status', userId], { following: true, followedBy: undefined });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData(['relation', 'status', userId], context.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['relation', 'status', userId] });
      qc.invalidateQueries({ queryKey: ['relation', 'following'] });
      qc.invalidateQueries({ queryKey: ['relation', 'counters'] });
    },
  });
}
```

---

### Task 0.7: Create `features/relation/useUnfollow.ts`

Same pattern as useFollow but calls `relationService.unfollow(userId)` and optimistically sets `{ following: false }`.

---

### Task 0.8: Create `features/notification/useNotifications.ts`

```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem } from '@/types/notification';

export function useNotifications(type?: string) {
  return useInfiniteQuery<{
    items: NotificationItem[];
    nextCursor: number | null;
    hasMore: boolean;
  }>({
    queryKey: ['notifications', type],
    queryFn: ({ pageParam }) =>
      notificationService.list({ type, cursor: pageParam as number | undefined }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 30_000,
  });
}
```

---

### Task 0.9: Create `features/notification/useUnreadCount.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { notificationService } from '@/services/notificationService';

export function useUnreadCount() {
  const query = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 60_000, // poll every 60s as fallback
    staleTime: 30_000,
  });

  // SSE subscription for real-time updates
  const eventSourceRef = useRef<EventSource | null>(null);
  useEffect(() => {
    const es = new EventSource('/api/v1/notifications/sse');
    es.onmessage = () => {
      query.refetch();
    };
    es.onerror = () => {
      // SSE connection failed — polling fallback is sufficient
    };
    eventSourceRef.current = es;
    return () => es.close();
    // Only set up SSE once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return query;
}
```

---

### Task 0.10: Wire Header notification badge to real unread count

Edit `yixiang-web/src/components/layout/Header.tsx`:

1. Import `useUnreadCount` from `@/features/notification/useUnreadCount`
2. Call `const { data } = useUnreadCount()` inside the component
3. Replace the hardcoded `12` badge with `{data?.unreadCount ?? 0}`, hide badge when count is 0

Verify: `npx tsc --noEmit` and `npm run build` pass before proceeding.

---

## Section A: LoginPage — 登录页

**Prototype:** `原型设计图/preview/src/登录页.jsx`
**Prototype component name:** `GuzhiquanLogin`
**Page layout:** Standalone (no AppLayout). Left side = branding/hero, Right side = login card.
**Key features:** Account login tab + SMS login tab, password visibility toggle, "remember me" checkbox, forgot password link, third-party login buttons (decorative placeholder).

---

### Task A.1: Create login form zod schema

Create the validation schema inline in `LoginPage.tsx` (not a separate file — single page, single concern):

```ts
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, '请输入手机号或邮箱'),
  password: z.string().min(1, '请输入密码'),
  rememberMe: z.boolean().optional(),
});
```

The form type is inferred: `type LoginFormData = z.infer<typeof loginSchema>;`

---

### Task A.2: Replace LoginPage.tsx — full prototype-matching implementation

**File:** `yixiang-web/src/pages/LoginPage.tsx`

Completely rewrite the file. The new component must:

**Left side (hidden on mobile, `hidden lg:flex`):**
- Logo area: blue rounded square with TrendingUp icon + "股知圈" text + subtitle "连接知识与投资的力量"
- Headline: large text "连接股票老师与投资者" / "共创更聪明的投资决策"
- Feature tags: "优质观点 · 深度交流 · 共同成长"
- Stock index card mockup: white card with "上证指数 000001.SH", fake price 3,128.08 +0.59%, mini sparkline SVG, table of open/high/volume/close/low/amount
- Features grid: 4 white cards (实时观点/圈子交流/学习成长/安全沟通) with icons
- Stats row: "120万+ 注册用户", "12,000+ 认证老师", "85万+ 活跃圈子", "99.9% 信息安全保障"
- Security badge at bottom: "股知圈已通过国家信息安全等级保护三级认证"

**Right side (login card, max-w-[480px]):**
- Header: "欢迎回来" + "登录股知圈，继续探索投资机会"
- Tabs: "账号登录" | "验证码登录" with blue underline indicator
- Form fields (账号登录 tab):
  - Phone/Email input with User icon, placeholder "手机号 / 邮箱"
  - Password input with Lock icon + eye toggle (show/hide), placeholder "请输入密码"
  - Row: "记住我" checkbox + "忘记密码？" link
  - Submit button: full-width blue "登录"
  - "还没有账号？立即注册" link (calls navigate to /register)
- SMS login tab: similar but with phone + verification code inputs
- Divider: "或使用以下方式登录"
- Third-party buttons: WeChat/WeCom/DingTalk (all decorative — onClick shows sonner toast "此登录方式即将上线")
- Footer: agreement text "登录即代表同意《用户协议》与《隐私政策》" + "我们采用银行级加密技术保护您的数据安全"

**Important styling notes:**
- Background: `bg-[#F4F7FC]`
- Primary blue: `#1A56DB` (use Tailwind `bg-[#1A56DB]` etc.)
- Card rounded: `rounded-[32px]`
- Stock chart SVG: copy exact `viewBox` and `path` elements from 登录页.jsx prototype

---

### Task A.3: Wire up react-hook-form + authService.login

Add to the LoginPage component:

```ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Inside component:
const { login } = useAuth();
const navigate = useNavigate();
const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: { identifier: '', password: '', rememberMe: false },
});

const onSubmit = async (data: LoginFormData) => {
  try {
    await login({
      identifierType: data.identifier.includes('@') ? 'EMAIL' : 'PHONE',
      identifier: data.identifier,
      password: data.password,
    });
    toast.success('登录成功');
    navigate('/');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '登录失败');
  }
};
```

- Show spinner on submit button while `form.formState.isSubmitting`
- Show field-level validation errors below each input in red text

---

### Task A.4: Add loading / error / edge case handling

- **Loading state:** While `login()` promise is pending, disable submit button + show spinner icon
- **Error state:** Display server error message via `sonner` toast (already handled in Task A.3)
- **Validation errors:** Show per-field error messages from zod schema
- **Already logged in:** If `useAuth().isAuthenticated` is true on mount, redirect to `/` immediately

---

### Task A.5: Verify LoginPage

- `npx tsc --noEmit` passes with zero errors
- `npm run build` succeeds
- `npm run dev` → navigate to http://localhost:5173/login
- Visual check: page matches 登录页.jsx prototype layout
- Functional check: fill in credentials → click login → redirects to home on success, shows error toast on failure
- Switch to SMS login tab — form switches correctly
- Click third-party buttons — toast appears
- Click "立即注册" — navigates to /register

---

## Section B: RegisterPage — 注册页

**Prototype:** `原型设计图/preview/src/注册页.jsx`
**Prototype component name:** `RegisterView`
**Page layout:** Standalone (no AppLayout). Left = branding, Right = registration form.
**Key features:** Nickname / phone-email / password (with strength indicator) / confirm password / agreement checkbox.

---

### Task B.1: Create register form zod schema

```ts
const registerSchema = z.object({
  nickname: z.string().min(2, '昵称至少 2 个字符').max(20, '昵称最多 20 个字符'),
  identifier: z.string().min(1, '请输入手机号或邮箱'),
  password: z.string().min(6, '密码至少 6 个字符').max(128),
  confirmPassword: z.string(),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: '请同意用户协议和隐私政策' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
});
```

---

### Task B.2: Replace RegisterPage.tsx — full prototype-matching implementation

**File:** `yixiang-web/src/pages/RegisterPage.tsx`

Completely rewrite. Two-column layout matching 注册页.jsx:

**Left side (hidden on mobile):**
- Logo: blue rounded square + "股知圈" + subtitle "专业的股票交流社区"
- Headline: "加入优质的股市讨论社区" + subtext "与投资者交流观点，分享策略，发现机会"
- Feature icons row at bottom: 深度交流 / 实时资讯 / 优质社区
- Disclaimer: "投资有风险，入市需谨慎"

**Right side (register form, max-w-[480px]):**
- Header: "注册账号" + "欢迎加入股知圈"
- Form fields (in order):
  1. Nickname: User icon + input placeholder "请输入昵称"
  2. Phone/Email: Smartphone icon + input placeholder "请输入手机号或邮箱"
  3. Password: Lock icon + password input + eye toggle
  4. Password strength bar: 3 segments (弱/中/强) — visual only, colors change based on length/pattern (≤6 chars = red/weak, 7-10 = yellow/medium, >10 = green/strong)
  5. Confirm password: Lock icon + input + eye toggle
  6. Agreement checkbox: "我已阅读并同意《用户协议》和《隐私政策》"
  7. Submit: full-width blue "注册" button
  8. "已有账号？去登录" link (navigates to /login)

**Background:** `bg-[#f4f7fc]` with faint SVG chart graphic overlay (copy from prototype)

---

### Task B.3: Wire up react-hook-form + authService.register

Same pattern as LoginPage:

```ts
const { register: registerUser } = useAuth();
const navigate = useNavigate();
const form = useForm<RegisterFormData>({
  resolver: zodResolver(registerSchema),
});

const onSubmit = async (data: RegisterFormData) => {
  try {
    await registerUser({
      identifierType: data.identifier.includes('@') ? 'EMAIL' : 'PHONE',
      identifier: data.identifier,
      password: data.password,
      code: '', // account-mode registration does not need code
      agreeTerms: data.agreeTerms,
    });
    toast.success('注册成功');
    navigate('/');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '注册失败');
  }
};
```

**Note:** The backend RegisterRequest requires `code` field. For account-password registration (not SMS), this backend doesn't need a code. If the backend requires it, send empty string. If the backend rejects this, fall back to SMS registration flow. **Executor must verify the actual RegisterRequest DTO** in `yixiang_be/src/main/java/com/tongji/auth/api/dto/RegisterRequest.java` and adjust accordingly.

---

### Task B.4: Add password strength indicator

Implement a visual-only password strength bar below the password input:

```ts
function getStrength(pw: string): { level: 0 | 1 | 2; label: string; color: string } {
  if (pw.length <= 6) return { level: 0, label: '弱', color: 'bg-red-400' };
  if (pw.length <= 10) return { level: 1, label: '中', color: 'bg-yellow-400' };
  return { level: 2, label: '强', color: 'bg-green-400' };
}
```

Render 3 segmented bars below the password field; fill segments based on strength level.

---

### Task B.5: Verify RegisterPage

- `npx tsc --noEmit` passes
- `npm run build` succeeds
- Navigate to /register — page matches 注册页.jsx prototype
- Form validation works: empty fields → errors, mismatched passwords → error, unchecked agreement → error
- Successful registration → redirected to /
- Click "去登录" → navigates to /login

---

## Section C: ProfilePage — 个人主页

**Prototype:** `原型设计图/preview/src/个人主页.jsx`
**Prototype component name:** `ProfileView`
**Page layout:** Inside AppLayout (3-column: sidebar + main + right aside).
**Key features:** Banner + avatar + user info + stats bar + 5 tabs (我的帖子/我的收藏/我的点赞/我的圈子/草稿箱) + post list + right sidebar (personal info, visitors, stats, badges).

---

### Task C.1: Build ProfilePage shell — banner + avatar + user info

**File:** `yixiang-web/src/pages/ProfilePage.tsx`

Completely rewrite. The page uses the `PageShell` wrapper (already imported). However, the prototype shows a full-width banner → stacked avatar, so the page may need its own layout independent of PageShell's max-width constraint for the banner section. Use this structure:

```
<PageShell>
  {/* Banner section (full-width within main content area) */}
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
    {/* Banner image: h-40 bg-gray-900 with gradient overlay */}
    <div className="h-40 relative bg-gray-900">
      <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${profile.bannerImage ?? DEFAULT_BANNER})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
    {/* Avatar + action buttons */}
    <div className="px-6 pb-6 relative">
      <div className="absolute -top-16 left-6 p-1 bg-white rounded-full">
        <img src={profile.avatar} className="w-[104px] h-[104px] rounded-full border-4 border-white shadow-sm object-cover" />
      </div>
      <div className="flex justify-end pt-4 gap-3">
        <button>编辑资料</button>
        <button><Share size={16} /></button>
      </div>
      {/* User info */}
      <div className="mt-4">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{profile.nickname}</h1>
          {/* Level badge: Lv.X */}
        </div>
        <p className="text-gray-500 text-sm mb-4">{profile.bio}</p>
        {/* Tags */}
        {/* Stats bar: 关注/粉丝/获赞/收藏/帖子 */}
      </div>
    </div>
  </div>
</PageShell>
```

Use `useProfile(userId)` from `@/features/profile/useProfile` (created in Task 0.5).
- For own profile: get userId from `useAuth().user.id`
- For other user's profile: get userId from URL param `useParams()`
- Determine which from route: `/profile` (own) vs `/users/:id` (other)

Add loading skeleton, empty state (user not found), error state.

---

### Task C.2: Implement stats bar

Below the user info, add a horizontal stats bar:

```tsx
<div className="flex items-center justify-between border-t border-gray-100 pt-5 px-2">
  <StatItem label="关注" value={followingCount} />
  <StatItem label="粉丝" value={followerCount} />
  <StatItem label="获赞" value={totalLikes} />
  <StatItem label="收藏" value={totalFavs} />
  <StatItem label="帖子" value={totalPosts} />
</div>
```

Get counts from `relationService.counters(userId)` — use `useQuery`. For likes/favs/posts, use data from profile API or counters.

---

### Task C.3: Implement tabs — my posts / my collections / my likes / my circles / drafts

Add tab bar below the profile card:

```tsx
const TABS = ['我的帖子', '我的收藏', '我的点赞', '我的圈子', '草稿箱'];

<button
  onClick={() => setActiveTab(tab)}
  className={`px-4 py-4 text-[15px] font-medium relative ${
    activeTab === tab ? 'text-blue-600' : 'text-gray-500'
  }`}
>
  {tab}
  {activeTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-t-full" />}
</button>
```

Tab content switches based on activeTab state. For P2a, focus on:
- **我的帖子**: Reuse PostItem card component (create inline), call `knowpostService.mine()`
- **我的收藏**: Reuse same PostItem, call `profileService.getLikedPosts()`
- **我的点赞**: Reuse same PostItem, call `profileService.getLikedPosts()` 
- **我的圈子** / **草稿箱**: Show placeholder with "即将上线" empty state for now (P2b/P2c will fill these)

**Note:** "我的圈子" and "草稿箱" are lower priority. Display an EmptyState with "功能即将上线" text.

---

### Task C.4: Implement post list with pagination

For the active tab showing posts ("我的帖子"/"我的收藏"/"我的点赞"), render a post list:

```tsx
{posts.map(post => (
  <PostItem key={post.id} post={post} />
))}
{/* Pagination */}
<div className="flex justify-center items-center gap-2 py-8">
  <PageButton>1</PageButton>
  <PageButton>2</PageButton>
  {/* ... */}
  <button>下一页</button>
</div>
```

Create the `PostItem` component inline (at bottom of ProfilePage.tsx, not exported):

Props: `{ image?, imageText?, title, tags, time, reads, commentsCount, likes, comments }`

Layout: horizontal card with optional thumbnail (w-40 h-[100px]), title, tags, time/reads/comments stats, like/comment buttons.

Use `useQuery` to fetch posts from the appropriate API. Add filter pills ("全部" / "公开" / "圈子可见") above the post list.

---

### Task C.5: Implement right sidebar

The right sidebar contains 4 cards (320px wide, sticky):

1. **Personal info card:** Bio text, info rows (注册时间/所在地区/职业/投资年限), "编辑资料" button
2. **Recent visitors:** Avatars row (5 overlapping) + "等 N 人来访" text
3. **Stats card (近7天):** 2×2 grid — 帖子阅读/新增粉丝/获赞数/新增收藏, each with trend arrow
4. **My badges:** 2×2 grid of gradient badge icons (优质内容/深度分析/活跃达人/长期贡献)

Each card: `bg-white rounded-2xl p-5 shadow-sm`

**Mock data for now:** Visitors, stats trends, badges are not yet available via API. Use placeholder data with a comment `// TODO: real API after P2b`. The personal info card uses real `profile` data.

---

### Task C.6: Add loading skeletons + empty states

- **Loading skeleton:** While profile query is loading, show `ProfileCardSkeleton` — banner placeholder + avatar circle placeholder + text line placeholders (use existing `Skeleton` component from `@/components/ui/skeleton`)
- **Empty state:** If user has 0 posts in a tab, show `<EmptyState icon={FileText} title="暂无内容" description="还没有发布过帖子" />`
- **Error state:** Use existing `<ErrorBoundary>` wrapper (already in AppLayout), but also handle query-level errors with a retry button: `<EmptyState icon={AlertCircle} title="加载失败" description={error.message} action={<Button onClick={refetch}>重试</Button>} />`
- **User not found:** If profile API returns 404, show EmptyState "用户不存在"

---

### Task C.7: Verify ProfilePage

- `npx tsc --noEmit` passes
- `npm run build` succeeds
- Navigate to /profile — shows own profile with real data
- Navigate to /users/:id — shows other user's profile
- Tabs switch correctly, posts load with pagination
- Loading skeleton visible during data fetch
- Empty state shown when no posts
- Right sidebar renders all 4 cards

---

## Section D: FollowListPage — 关注粉丝列表页

**Prototype:** `原型设计图/preview/src/关注粉丝列表页.jsx`
**Prototype component name:** `FollowListView`
**Page layout:** Inside AppLayout (main content + right aside).
**Key features:** Tabs (我的关注/我的粉丝), user list cards with follow/unfollow, right sidebar (stats/special follows/recommendations).

---

### Task D.1: Build main content area — tabs + user list

**File:** `yixiang-web/src/pages/FollowListPage.tsx`

Completely rewrite. The page uses `PageShell`.

Main content (flex-1 max-w-[760px]):
- White rounded-2xl card
- Tabs: "我的关注" | "我的粉丝" with blue underline
- User list: each row has avatar (w-12 h-12 rounded-full), name, description, follow/unfollow button

```tsx
{users.map(user => (
  <div key={user.id} className="p-6 border-b border-gray-50 flex justify-between">
    <div className="flex gap-4">
      <img src={user.avatar} className="w-12 h-12 rounded-full" />
      <div>
        <div className="font-bold">{user.nickname}</div>
        <div className="text-gray-500 text-sm">{user.bio}</div>
      </div>
    </div>
    <FollowButton userId={user.id} />
  </div>
))}
```

Data fetching:
- "我的关注" tab: use `relationService.following(userId)` with `useQuery`
- "我的粉丝" tab: use `relationService.followers(userId)` with `useQuery`
- Get userId from `useAuth().user.id`

---

### Task D.2: Create FollowButton component

Create `yixiang-web/src/components/user/FollowButton.tsx`:

```tsx
import { useFollow } from '@/features/relation/useFollow';
import { useUnfollow } from '@/features/relation/useUnfollow';
import { useQuery } from '@tanstack/react-query';
import { relationService } from '@/services/relationService';

export function FollowButton({ userId }: { userId: number }) {
  const { data: status } = useQuery({
    queryKey: ['relation', 'status', userId],
    queryFn: () => relationService.status(userId),
  });
  const follow = useFollow(userId);
  const unfollow = useUnfollow(userId);
  const isFollowing = status?.following ?? false;

  if (isFollowing) {
    return (
      <button
        onClick={() => unfollow.mutate()}
        className="h-8 px-4 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
      >
        已关注
      </button>
    );
  }
  return (
    <button
      onClick={() => follow.mutate()}
      className="h-8 px-4 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
    >
      关注
    </button>
  );
}
```

Note: The `status?.following` response type may differ — check actual `RelationStatusResponse` in `@/types/relation` and adjust.

---

### Task D.3: Build right sidebar

Right sidebar (w-[320px]) with 3 cards:

1. **关注统计:** Stats card (can be placeholder with mock numbers for now: total follows, total fans, mutual follows)
2. **特别关注:** Placeholder empty state "暂无特别关注"
3. **可能认识的人:** Use `GET /api/v1/recommend/users?limit=5` if available, otherwise mock data with `// TODO: real API` comment

Each card follows the same pattern:
```tsx
<div className="bg-white rounded-2xl p-6 shadow-sm">
  <h3 className="font-bold mb-4">Card Title</h3>
  {/* content */}
</div>
```

---

### Task D.4: Add loading/empty/error states

- **Loading:** Show skeleton list (5 rows of avatar circle + text lines)
- **Empty:** "还没有关注任何人" with action button "去发现"
- **Error:** Inline error with retry button
- **Pagination:** If the backend supports cursor/offset pagination, implement "加载更多" button. If not, load all at once.

---

### Task D.5: Verify FollowListPage

- `npx tsc --noEmit` passes
- `npm run build` succeeds
- Navigate to /followlist — shows following list
- Click "我的粉丝" tab — shows followers
- Click follow/unfollow button — optimistic update, button changes instantly
- Loading skeleton visible during fetch
- Empty state shown when list is empty

---

## Section E: NotificationPage — 通知中心页

**Prototype:** `原型设计图/preview/src/通知中心页.jsx`
**Prototype component name:** `NotificationView`
**Page layout:** Inside AppLayout (main content + right aside).
**Key features:** Notification list with type icons + unread dots, tabs (全部/未读/评论/点赞/关注/系统), mark all read, right sidebar (overview cards/settings toggles/suggested users).

---

### Task E.1: Build main content — notification list

**File:** `yixiang-web/src/pages/NotificationPage.tsx`

Completely rewrite. Uses `PageShell`.

Main content area:

```tsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
  {/* Header */}
  <div className="p-6 pb-0">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-xl font-bold">通知中心</h1>
      <div className="flex items-center gap-4 text-sm">
        <button onClick={handleMarkAllRead}>全部标为已读</button>
        <button><Settings size={18} /></button>
      </div>
    </div>
    {/* Tabs */}
    <div className="flex gap-8 border-b border-gray-100">
      {TABS.map(tab => (...))}
    </div>
  </div>
  {/* Notification items */}
  <div className="flex flex-col">
    {notifications.map(item => (
      <NotificationRow key={item.id} item={item} />
    ))}
  </div>
</div>
```

Create `NotificationRow` component inline (at bottom of file):

```tsx
function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <div className={`flex gap-4 p-5 hover:bg-gray-50 border-b border-gray-50 ${!item.isRead ? 'bg-[#F8FAFF]' : ''}`}>
      {/* Avatar with type icon badge overlay */}
      <div className="relative pt-1">
        <img src={item.actorAvatar ?? DEFAULT_AVATAR} className="w-11 h-11 rounded-full" />
        <div className="absolute -bottom-1 -right-1 ring-2 ring-white rounded-full">
          <NotificationTypeIcon type={item.type} />
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-bold text-[15px]">{item.actorNickname ?? '系统'}</span>
          <span className="text-gray-600 text-[15px]">{getActionText(item)}</span>
        </div>
        <p className="text-gray-500 text-sm">{item.content}</p>
      </div>
      {/* Time + unread dot */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-gray-400 text-xs">{formatRelativeTime(item.createdAt)}</span>
        {item.isRead ? (
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
        ) : (
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </div>
    </div>
  );
}
```

Create `NotificationTypeIcon` — maps `NotificationType` to colored icon badge (LIKE=red ThumbsUp, COMMENT=purple MessageSquare, FOLLOW=blue UserPlus, SYSTEM=blue BellRing).

Data fetching: `useNotifications(type)` from `@/features/notification/useNotifications` (Task 0.8). Flatten pages with `data.pages.flatMap(p => p.items)`.

---

### Task E.2: Implement tabs + mark all read

Tabs with counts (use notification counts from API):

```tsx
const TABS = [
  { key: undefined, label: '全部' },
  { key: 'COMMENT', label: '评论' },
  { key: 'LIKE', label: '点赞' },
  { key: 'FOLLOW', label: '关注' },
  { key: 'SYSTEM', label: '系统' },
];
```

"未读" count: use the `unreadCount` from `useUnreadCount()` (Task 0.9).

Mark all read: use `useMutation` wrapping `notificationService.markAllRead()`. On success, invalidate `['notifications']` and `['notifications', 'unread-count']` queries.

Individual mark read: call `notificationService.markOneRead(id)` on click (or on hover/view), invalidate queries.

---

### Task E.3: Implement right sidebar

Right sidebar (w-[340px]) with 3 cards:

1. **通知概览:** 2×2 grid of stat cards — 未读通知(xx)/评论(xx)/点赞(xx)/关注(xx), each with icon + count. Get data from the notification list or a separate stats endpoint.

2. **通知设置:** List of toggle rows — 评论(checked)/点赞(checked)/关注(checked)/私信(checked)/系统通知(checked)/推荐内容(unchecked). **These are visual-only for now** since the backend settings API may not yet support per-type notification toggles. Add `// TODO: wire to settings API` comment.

3. **你可能感兴趣的人:** 3 user rows with avatar + name + follower count + follow button. Use `GET /api/v1/recommend/users?limit=3` if available, otherwise placeholder mock data.

---

### Task E.4: Add loading/empty/error states

- **Loading:** Show skeleton list (6 rows with avatar circle + text lines)
- **Empty:** `<EmptyState icon={Bell} title="暂无通知" description="当有人与你互动时，通知会显示在这里" />`
- **Error:** Inline error card with retry button
- **Infinite scroll:** Use `IntersectionObserver` at the bottom of the list (reuse pattern from existing `InfiniteList` component). Trigger `fetchNextPage()` when the sentinel element becomes visible.

---

### Task E.5: Verify NotificationPage

- `npx tsc --noEmit` passes
- `npm run build` succeeds
- Navigate to /notifications — shows notification list with real data
- Tabs filter notifications correctly
- "全部标为已读" works (invalidates queries)
- Unread dot shows/hides correctly
- Right sidebar renders all cards
- Loading/empty/error states work
- Infinite scroll loads more notifications on scroll to bottom

---

## Section F: CollectionsPage — 我的收藏页

**Prototype:** `原型设计图/preview/src/我的收藏页.jsx`
**Prototype component name:** `CollectionsView`
**Page layout:** Inside AppLayout (main content + right aside).
**Key features:** Horizontally-stacked post list with thumbnails, folder categories sidebar, tabs (全部收藏/帖子/话题/用户), stats.

---

### Task F.1: Build main content — post list with thumbnails

**File:** `yixiang-web/src/pages/CollectionsPage.tsx`

Completely rewrite. Uses `PageShell`.

Main content area:

```tsx
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[800px]">
  {/* Header */}
  <div className="px-6 pt-6 pb-2 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <h2 className="text-[20px] font-bold">我的收藏</h2>
      <span className="text-[13px] text-gray-500">收藏的优质内容，随时回顾学习</span>
    </div>
    <div className="flex items-center gap-3">
      <button><Search size={16} /></button>
      <button>管理</button>
    </div>
  </div>

  {/* Tabs */}
  <div className="px-6 pt-4 border-b border-gray-100">
    <div className="flex gap-8">
      {['全部收藏', '帖子', '话题', '用户'].map(tab => (...))}
    </div>
  </div>

  {/* Filters */}
  <div className="px-6 py-4 flex items-center justify-between">
    <button>最新收藏 <ChevronDown size={14} /></button>
    <div className="flex gap-2">
      <button className="bg-blue-50 text-blue-600"><LayoutGrid size={16} /></button>
      <button><ListIcon size={16} /></button>
    </div>
  </div>

  {/* Post list */}
  <div className="flex flex-col flex-1">
    {collections.map(post => (
      <CollectionPostCard key={post.id} post={post} />
    ))}
  </div>

  {/* Footer */}
  <div className="py-8 text-center text-[12px] text-gray-400 border-t border-gray-50">
    内容仅供学习交流，不构成投资建议，投资有风险，入市需谨慎。
  </div>
</div>
```

Create `CollectionPostCard` inline: horizontal layout — left thumbnail (w-[180px] h-[120px]), right side with title, author line (avatar+name+verified+time), snippet text, tags + stats (likes/comments). Star icon button in top-right to unfavorite.

Data fetching: `useQuery` with `favoriteService.list()`.

---

### Task F.2: Implement tabs + sort/filter bar

Tabs are visual-only for P2a — all tabs show post collections since "topics"/"users" collections may not be supported by the backend yet. Add `// TODO:` comments for future tab content.

Sort dropdown: "最新收藏" (default) — visual only for now, can be wired when backend supports sort params.

Layout toggle (grid/list): implement simple toggle — grid view shows 2-column post cards, list view shows current horizontal layout.

---

### Task F.3: Build right sidebar

Right sidebar (w-[320px]) with 3 cards:

1. **收藏夹分类:** List of folder icons with counts. Use the folders defined in the prototype (全部收藏 128, 财报解读 28, K线学习 24, 短线策略 20, 宏观分析 18, 行业研究 16, 投资书籍 12, 其他 10). **Mock data for now** — backend folder/category API is not yet available. Add `// TODO(roadmap#folders): wire to real API` comment.

2. **收藏数据:** 3-card stat grid (收藏内容 128, 作者 86, 话题 24) + "本月新增" row. **Mock data** — wire to real metrics when API is available.

3. **最近收藏:** 3-item list with thumbnail + title + author. Use first 3 items from the favorites list.

---

### Task F.4: Add loading/empty/error states

- **Loading:** Skeleton list (4 horizontal card skeletons with thumbnail + text areas)
- **Empty:** `<EmptyState icon={Star} title="还没有收藏" description="浏览帖子时点击收藏，方便随时回顾" action={<Button onClick={() => navigate('/')}>去首页看看</Button>} />`
- **Error:** Inline error with retry button

---

### Task F.5: Verify CollectionsPage

- `npx tsc --noEmit` passes
- `npm run build` succeeds
- Navigate to /collections — shows favorites list with real data (or empty state if user has no favorites)
- Tabs switch visually
- Post cards render with thumbnails, titles, stats
- Right sidebar renders all 3 cards
- Loading/empty/error states work
- Clicking a post card navigates to /posts/:id

---

## Post-Completion Checklist

After all Sections A-F are complete, verify the full P2a:

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `npm test` — all existing 4 tests still pass
- [ ] Navigate between all 6 pages — no console errors
- [ ] Login → Register flow works end-to-end
- [ ] Profile page loads own data correctly
- [ ] Follow/fans list loads with real data
- [ ] Notification page shows real notifications
- [ ] Collections page shows real favorites
- [ ] All pages show loading skeletons during data fetch
- [ ] All pages show empty states when no data
- [ ] All pages handle API errors gracefully with retry option
- [ ] `git log --oneline -15` shows clean, incremental commits (one per Task or per small group of Tasks)

---

## Summary: P2a Task Count

| Section | Tasks | Estimated commits |
|---------|-------|-------------------|
| Pre-Section (0) | 10 | ~8-10 |
| A (LoginPage) | 5 | ~3-4 |
| B (RegisterPage) | 5 | ~3-4 |
| C (ProfilePage) | 7 | ~5-7 |
| D (FollowListPage) | 5 | ~3-4 |
| E (NotificationPage) | 5 | ~4-5 |
| F (CollectionsPage) | 5 | ~3-4 |
| **Total** | **42** | **~30-38** |

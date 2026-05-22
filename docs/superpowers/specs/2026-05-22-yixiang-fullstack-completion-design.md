# 颐享 (YiXiang) — 全栈功能完善设计文档

**日期：** 2026-05-22  
**作者：** Claude Code  
**状态：** 已批准，进入执行  
**跳过：** SMS 验证码、第三方 OAuth（微信/钉钉）

---

## 背景

颐享是一个面向股票投资者的知识社区平台，包含：
- `yixiang_be`：Spring Boot 3.2 + Java 21 + MyBatis + MySQL + Redis + ES + Kafka + Spring AI
- `yixiang-web`：React 18 + TypeScript + Vite + Tailwind CSS v4 + TanStack Query v5

当前状态：后端约 70% 完成，前端约 50% 完成。多个后端模块已完整实现但前端未接通，部分功能需要新建 DB 表和后端模块。

---

## 执行策略

- **7个 Phase，按优先级顺序执行**
- 每个 Phase 完成后立即 commit + push 到 GitHub
- 每天至少 2-3 次 commit
- 所有代码必须通过 `npm run lint` 和 `npm run test`
- 后端改动必须保证 `mvn compile` 无错误

---

## Phase 1 — 评论系统全接通

### 目标
PostDetailPage 评论区从静态 UI 变为完全可用的二级评论系统。

### 后端现状（无需改动）
- `POST /api/v1/comment` — 创建评论，body: `{ postId, content, parentId?, replyToUserId? }`
- `GET /api/v1/comment/list?postId=&cursor=&size=` — 顶级评论（cursor 分页）
- `GET /api/v1/comment/replies?parentId=&cursor=&size=` — 二级回复
- `DELETE /api/v1/comment/{id}` — 软删除（仅自己的评论）
- 响应：`CommentListResponse { items: CommentDTO[], nextCursor: string|null }`
- `CommentDTO { id, postId, userId, content, parentId, replyToUserId, createdAt, nickname, avatar, replyCount, replyToNickname? }`

### 前端改动

**新建 `src/services/commentService.ts`**
```typescript
export interface CommentItem {
  id: string; nickname: string; avatar: string | null;
  content: string; createdAt: string; userId: number;
  replyCount: number; replyToNickname?: string; parentId?: string;
}
export interface CommentListResp { items: CommentItem[]; nextCursor: string | null; }
export const commentService = {
  list(postId: string, cursor?: string, size = 20): Promise<CommentListResp>
  replies(parentId: string, cursor?: string, size = 20): Promise<CommentListResp>
  create(postId: string, content: string, parentId?: string, replyToUserId?: number): Promise<{ id: string }>
  remove(id: string): Promise<void>
}
```

**修改 `PostDetailPage.tsx`**
- 评论列表：`useInfiniteQuery(['comments', postId])` 调用 `commentService.list`
- 「加载更多」按钮（当 `nextCursor` 非空时显示）
- 每条顶级评论下方显示「展开 N 条回复」→ 点击时 `useQuery(['replies', commentId])` 懒加载
- 发评论表单：提交后 `queryClient.invalidateQueries(['comments', postId])` + 更新 `commentCount`
- 回复某条评论：点击「回复」→ 表单聚焦 + 填入 `parentId` 和 `replyToUserId`
- 删除自己的评论：带 confirm dialog，乐观删除
- 未登录时点击发评论 → `toast.info('请先登录')`

### 提交计划
1. `feat: commentService + PostDetailPage comment list with cursor pagination`
2. `feat: PostDetailPage comment create/delete + nested replies`

---

## Phase 2 — 关注 Feed + 大盘指数接通

### 目标
HomePage 关注 Tab 展示真实关注动态；LoginPage 股票指数卡显示实时数据。

### 后端现状（无需改动）
- `GET /api/v1/activities/following?cursor=&size=` — 关注用户的动态列表
  - `ActivityResponse { id, userId, type, targetType, targetId, payload(JSON), createdAt }`
  - `ActivityListResponse { items: ActivityResponse[], nextCursor: long|null }`
  - payload 结构视 type 而定：LIKE→`{postId,title}`, POST→`{postId,title}`, FOLLOW→`{targetUserId,nickname}`
- `GET /api/v1/stock/indices` — 大盘指数列表
  - `MarketIndexDTO { code, name, price, change, changePercent }`

### 前端改动

**新建 `src/services/activityService.ts`**
```typescript
export interface ActivityItem {
  id: string; userId: number; type: string;
  targetType: string; targetId: string;
  payload: Record<string, unknown>; createdAt: string;
  actor: { id: number; nickname: string; avatar: string | null };
}
export const activityService = {
  following(cursor?: string, size = 20): Promise<{ items: ActivityItem[]; nextCursor: string | null }>
}
```

**新建 `src/services/stockService.ts`**
```typescript
export interface MarketIndex { code: string; name: string; price: number; change: number; changePercent: number; }
export const stockService = { indices(): Promise<MarketIndex[]> }
```

**修改 `HomePage.tsx`**
- 关注 Tab：`useInfiniteQuery(['activities', 'following'])` 调用 `activityService.following`
- 活动卡片：根据 `type` 渲染不同文案（点赞了帖子、发布了帖子、关注了用户）
- 无关注内容时引导用户关注

**修改 `LoginPage.tsx`**
- 股票指数卡：`useQuery(['stock', 'indices'], stockService.indices, { refetchInterval: 15000 })`
- 显示涨跌幅（红/绿色）、价格、变化量

### 提交计划
1. `feat: activityService + HomePage following feed with real API`
2. `feat: stockService + LoginPage real-time market indices`

---

## Phase 3 — 发帖增强（图片上传 + 圈子发帖 + 封面图）

### 目标
CreatePage 实现：markdown 内嵌图片、封面图上传、发帖到指定圈子。

### 方案（已确认：A — markdown 内嵌图片）

**图片上传流程：**
1. 用户点击工具栏图片按钮 / 粘贴图片
2. 前端调用 `POST /api/v1/storage/presign?entityType=know_posts&entityId={draftId}&filename={name}&contentType=image/jpeg`
3. 拿到 presignUrl → 直传 OSS（PUT request with file body）
4. 将 `![](ossUrl)` 插入到 textarea 光标位置

**封面图上传流程：** 同上，只写入 `coverImage` 字段（不插入 markdown）

**圈子发帖：**
- 用户可选择「发布到圈子」→ 下拉显示已加入的圈子列表
- 选中后 publish request body 带 `circleId`

### 后端改动
- `KnowPostController.create` 已接受 `circleId`，无需改动
- `StorageController.presign` 已支持 draft 实体，无需改动

### 前端改动

**修改 `CreatePage.tsx`**
- 工具栏图片按钮：触发 `<input type="file" accept="image/*" multiple>` → presign → PUT OSS → 插入 markdown
- 粘贴事件监听：`onPaste` → 检测 `clipboardData.files` → 同上流程
- 上传进度：`useState<'idle'|'uploading'|'done'>` + 禁用按钮
- 封面图区域：click/drag → presign → PUT OSS → setState coverImage
- 圈子选择器：`useQuery(['circles', 'joined'])` → Select 组件（可置空=公开）
- 字符计数：title length / 100 显示

### 提交计划
1. `feat: CreatePage image upload via OSS presign (paste + toolbar)`
2. `feat: CreatePage cover image upload + circle post selection`

---

## Phase 4 — 搜索扩展（用户/话题/圈子全文搜索）

### 目标
SearchPage 四个 Tab（帖子/用户/话题/圈子）都有真实搜索结果。

### 后端改动

**新建 ES 索引文档类：**
- `UserSearchDocument { id, nickname, bio, roleTitle, avatarUrl, followerCount, verified }`
- `TopicSearchDocument { tag, postCount, viewCount }`
- `CircleSearchDocument { id, name, description, category, memberCount, avatarUrl }`

**修改 `SearchController`：**
```java
@GetMapping
public Object search(@RequestParam String q,
                     @RequestParam(defaultValue = "post") String type,
                     @RequestParam(defaultValue = "20") int size,
                     @RequestParam(required = false) String after) {
  return switch(type) {
    case "user"   -> searchService.searchUsers(q, size);
    case "topic"  -> searchService.searchTopics(q, size);
    case "circle" -> searchService.searchCircles(q, size);
    default       -> searchService.searchPosts(q, size, after);
  };
}
```

**修改 `SearchService`：** 新增 `searchUsers`, `searchTopics`, `searchCircles`  
**新建 Canal 消费者 / 初始化索引：** users/topics/circles 的 ES 全量同步 + Canal 增量更新

### 前端改动

**修改 `searchService.ts`：** 增加 `type` 参数

**修改 `SearchPage.tsx`：**
- 用户 Tab：搜索结果显示用户卡片（头像、昵称、认证、简介、粉丝数 + 关注按钮）
- 话题 Tab：显示话题标签卡（标签名、帖子数、点击跳转话题页）
- 圈子 Tab：显示圈子卡片（头像、名称、成员数 + 加入按钮）

### 提交计划
1. `feat(be): ES user/topic/circle index + search API multi-type`
2. `feat(fe): SearchPage user/topic/circle tabs with real results`

---

## Phase 5 — 圈子管理增强

### 目标
- 圈子广场可真实创建圈子
- 圈子详情页帖子 Tab、成员 Tab 显示真实数据

### 后端改动

**`CircleController.posts` 修正 DTO：**
- 返回 `CirclePostListResponse { items: FeedItemResponse[], nextCursor: String }`（复用现有 DTO）

**`CircleMemberController` 补充：**
- `GET /api/v1/circles/{id}/members?page=&size=` — 返回 `CircleMemberListResponse { items: CircleMemberItem[], total }`
- `CircleMemberItem { userId, nickname, avatar, role, joinedAt }`

### 前端改动

**`CircleSquarePage`：**
- 「创建圈子」按钮 → Dialog：名称(必填)、分类、简介、头像（OSS 上传）
- 创建成功后 `queryClient.invalidateQueries(['circles'])`

**`CircleDetailPage`：**
- 帖子 Tab：`useInfiniteQuery` 调用 `circleService.posts(id, cursor)` → 渲染 PostCard
- 成员 Tab：`useQuery` 调用新 API → 成员列表（头像、昵称、角色徽章 OWNER/ADMIN/MEMBER）
- `circleService.posts()` 修正返回类型

### 提交计划
1. `feat(be): circle posts DTO fix + member list API`
2. `feat(fe): CircleDetailPage posts + members tabs real data`
3. `feat(fe): CircleSquarePage create circle dialog`

---

## Phase 6 — 收藏夹分类

### 目标
CollectionsPage 右侧收藏夹分类可用：创建/删除分类夹，按分类过滤帖子。

### 后端改动

**新建 `favorite_folders` 表：**
```sql
CREATE TABLE favorite_folders (
  id        BIGINT PRIMARY KEY,
  user_id   BIGINT NOT NULL,
  name      VARCHAR(50) NOT NULL,
  cover_url VARCHAR(500),
  item_count INT DEFAULT 0,
  created_at DATETIME(3) DEFAULT NOW(3),
  INDEX idx_user(user_id)
);
```

**新建后端模块（在 counter 包内）：**
- `FavoriteFolderMapper.xml` + `FavoriteFolderMapper.java`
- `FavoriteFolderController`：
  - `GET /api/v1/favorites/folders` — 列出当前用户文件夹
  - `POST /api/v1/favorites/folders` — 新建（name 必填）
  - `DELETE /api/v1/favorites/folders/{id}` — 删除（需要是自己的）
- `FavoriteController.list` 增加 `folderId` 可选参数

**修改 `FavoriteMapper.xml`：** `favorites` 表增加 `folder_id BIGINT NULL` 字段（可选收藏夹归属）
（注：这是 ALTER TABLE，已有数据不受影响）

### 前端改动

**修改 `favoriteService.ts`：** 新增 folder 相关方法

**修改 `CollectionsPage.tsx`：**
- 右侧文件夹列表：真实加载 + 创建/删除 Dialog
- 点击文件夹过滤主列表（`queryKey: ['favorites', folderId]`）
- 收藏统计数字从 API 获取（`data?.total`）

### 提交计划
1. `feat(be): favorite_folders table + CRUD API`
2. `feat(fe): CollectionsPage folder management + filter`

---

## Phase 7 — 个人主页增强（浏览量 + 数据统计 + 等级）

### 目标
ProfilePage 数据统计显示真实近 7 天数据；用户等级 Lv.X 根据真实粉丝数显示。

### 后端改动

**新建 `post_views` 表（帖子浏览量）：**
```sql
CREATE TABLE post_views (
  post_id    BIGINT NOT NULL,
  user_id    BIGINT,           -- NULL 表示匿名
  viewed_at  DATETIME(3) DEFAULT NOW(3),
  INDEX idx_post(post_id),
  INDEX idx_time(viewed_at)
);
```

**`KnowPostController.getById` 修改：** 异步写入 post_views（`@Async` + 防刷：同一 user+post 1小时内只计一次，用 Redis SET NX TTL）

**新建 `GET /api/v1/users/{id}/stats`：**
```json
{ "postViews7d": 0, "newFollowers7d": 0, "likes7d": 0, "favs7d": 0 }
```
从 `post_views`、`activities` 表聚合近 7 天数据。

**用户等级规则（基于 followerCount）：**
- Lv.1: 0–50, Lv.2: 51–500, Lv.3: 501–5000, Lv.4: 5001–50000, Lv.5: 50001+

**成就徽章规则（基于 stats 阈值，由后端返回 earned badges）：**
- 优质内容：累计点赞 ≥ 100
- 深度分析：发帖 ≥ 10 且平均点赞 ≥ 20
- 活跃达人：连续发帖 7 天
- 长期贡献：注册满 30 天

**新建 `GET /api/v1/users/{id}/badges`：** 返回已获得的徽章列表

### 前端改动

**修改 `ProfilePage.tsx`：**
- 数据统计：`useQuery(['user-stats', userId], () => statsService.get(userId))`
- 等级徽章：`Lv.${level}` 从 `profile.followerCount` 计算（纯前端派生）
- 成就徽章：`useQuery(['user-badges', userId])` 从 API 加载

### 提交计划
1. `feat(be): post_views table + async view counting + user stats API`
2. `feat(be): user badges API with threshold rules`
3. `feat(fe): ProfilePage real stats + level badge + earned badges`

---

## 数据库变更汇总

| 变更 | Phase | 类型 |
|---|---|---|
| `favorite_folders` 新表 | 6 | CREATE TABLE |
| `favorites.folder_id` 新字段 | 6 | ALTER TABLE ADD COLUMN |
| `post_views` 新表 | 7 | CREATE TABLE |

---

## API 路由汇总（新增/修改）

| 方法 | 路径 | Phase | 状态 |
|---|---|---|---|
| POST | `/api/v1/comment` | 1 | 已有 |
| GET | `/api/v1/comment/list` | 1 | 已有 |
| GET | `/api/v1/comment/replies` | 1 | 已有 |
| DELETE | `/api/v1/comment/{id}` | 1 | 已有 |
| GET | `/api/v1/activities/following` | 2 | 已有 |
| GET | `/api/v1/stock/indices` | 2 | 已有 |
| GET | `/api/v1/search?type=user\|topic\|circle` | 4 | 修改 |
| GET | `/api/v1/circles/{id}/members` | 5 | 补充 |
| POST | `/api/v1/circles` | 5 | 已有 |
| GET | `/api/v1/favorites/folders` | 6 | 新建 |
| POST | `/api/v1/favorites/folders` | 6 | 新建 |
| DELETE | `/api/v1/favorites/folders/{id}` | 6 | 新建 |
| GET | `/api/v1/users/{id}/stats` | 7 | 新建 |
| GET | `/api/v1/users/{id}/badges` | 7 | 新建 |

---

## 质量保障

- 每个 Phase 完成后运行 `npm run lint && npm run test`
- 后端改动运行 `mvn compile -q`
- 所有新 API 都有 loading/error/empty 三态处理
- 所有用户操作都有 toast 反馈
- 不引入任何新的硬编码 mock 数据

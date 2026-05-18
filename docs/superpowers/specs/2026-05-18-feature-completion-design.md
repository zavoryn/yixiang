# 股知圈功能完善设计文档

**日期：** 2026-05-18  
**范围：** 通知中心、我的收藏页、圈子系统（广场 + 详情）  
**架构选型：** 方案 B — 事件驱动深度集成，复用现有 Kafka 基础设施

---

## 1. 总体架构决策

### 1.1 事件流复用

现有 Kafka 主题：
- `counter-events`：点赞/收藏增量事件（`CounterEvent`）
- `canal-outbox`：关注/取关事件（Canal → Kafka，`RelationEvent` payload）

新增 Kafka 主题：
- `comment-events`：评论创建事件（`CommentEvent`），由 `CommentServiceImpl` 发布

通知模块作为**独立消费者组**订阅上述三个主题，与现有消费者完全解耦，互不影响。

### 1.2 实时推送

通知角标（未读数）通过 **SSE** 推送，复用项目已有 SSE 技术栈（RAG Q&A 已用）。通知列表通过 REST 按需拉取，不走实时通道。

### 1.3 圈子与帖子集成

`know_posts` 表新增 `circle_id BIGINT NULL`，NULL 表示公开帖子，非 NULL 表示圈子帖子。圈子帖子复用现有 knowpost 的 feed、counter、search 体系，不重复建模。

---

## 2. 数据库 Schema

### 2.1 新增表

```sql
-- 通知表
CREATE TABLE notifications (
    id           BIGINT       PRIMARY KEY,
    recipient_id BIGINT       NOT NULL,
    actor_id     BIGINT       NULL,
    type         ENUM('LIKE','COMMENT','FOLLOW','SYSTEM') NOT NULL,
    entity_type  ENUM('POST','COMMENT') NULL,
    entity_id    BIGINT       NULL,
    content      VARCHAR(255) NULL,
    is_read      TINYINT      NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient_id, is_read, created_at)
);

-- 收藏记录表（支持列表查询，补充 counter 模块的计数能力）
CREATE TABLE user_favorites (
    id         BIGINT   PRIMARY KEY,
    user_id    BIGINT   NOT NULL,
    post_id    BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_post (user_id, post_id),
    INDEX idx_user (user_id, created_at)
);

-- 圈子表
CREATE TABLE circles (
    id           BIGINT       PRIMARY KEY,
    name         VARCHAR(50)  NOT NULL,
    description  TEXT         NULL,
    avatar_url   VARCHAR(512) NULL,
    owner_id     BIGINT       NOT NULL,
    visibility   ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    status       ENUM('ACTIVE','DISBANDED') NOT NULL DEFAULT 'ACTIVE',
    category     VARCHAR(50)  NULL,
    member_count INT          NOT NULL DEFAULT 0,
    post_count   INT          NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category, status)
);

-- 圈子成员表
CREATE TABLE circle_members (
    id        BIGINT PRIMARY KEY,
    circle_id BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    role      ENUM('OWNER','ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
    status    ENUM('ACTIVE','PENDING')       NOT NULL DEFAULT 'ACTIVE',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_circle_user (circle_id, user_id),
    INDEX idx_user (user_id, status)
);
```

### 2.2 修改现有表

```sql
-- know_posts 新增圈子外键和精华标记
ALTER TABLE know_posts ADD COLUMN circle_id   BIGINT  NULL    AFTER user_id;
ALTER TABLE know_posts ADD COLUMN is_featured TINYINT NOT NULL DEFAULT 0 AFTER circle_id;
ALTER TABLE know_posts ADD INDEX idx_circle (circle_id, created_at);
ALTER TABLE know_posts ADD INDEX idx_circle_featured (circle_id, is_featured, created_at);
```

---

## 3. 后端模块设计

### 3.1 通知模块（`com.tongji.notification`）

**包结构：**
```
notification/
  api/
    NotificationController.java       GET /api/v1/notifications
    NotificationSseController.java    GET /api/v1/notifications/stream (SSE)
    dto/
      NotificationDTO.java
      NotificationListResponse.java
  consumer/
    LikeNotificationConsumer.java     监听 counter-events，metric=like, delta=+1
    CommentNotificationConsumer.java  监听 comment-events
    FollowNotificationConsumer.java   监听 canal-outbox（新消费者组）
  event/
    CommentEvent.java                 新事件 DTO（由 comment 模块发布）
    CommentTopics.java                topic 常量 "comment-events"
  mapper/
    NotificationMapper.java
  model/
    Notification.java
  service/
    NotificationService.java
    impl/NotificationServiceImpl.java
  sse/
    SseEmitterRegistry.java           维护 userId → SseEmitter 映射（ConcurrentHashMap）
```

**API：**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/notifications` | 分页列表，支持 `?type=LIKE\|COMMENT\|FOLLOW\|SYSTEM&cursor=&size=20` |
| PUT | `/api/v1/notifications/read-all` | 全部标已读 |
| PUT | `/api/v1/notifications/{id}/read` | 单条标已读 |
| GET | `/api/v1/notifications/unread-count` | 初始化时拉未读总数 |
| GET | `/api/v1/notifications/stream` | SSE 长连接，服务端推送未读数变化 |

**事件触发链：**
- LIKE：`counter-events` topic → `LikeNotificationConsumer`（消费者组 `notification-like`）→ 查帖子作者 → 写 `notifications`
- COMMENT：`CommentServiceImpl.create()` 发布 `CommentEvent` → `CommentNotificationConsumer`（消费者组 `notification-comment`）→ 写 `notifications`
- FOLLOW：`canal-outbox` topic → `FollowNotificationConsumer`（消费者组 `notification-follow`）→ 写 `notifications`

**SSE 推送逻辑：** 每条通知写入 DB 后，`NotificationServiceImpl` 查询该 `recipient_id` 的最新未读数，通过 `SseEmitterRegistry` 推送 `{"unreadCount": N}`。

**comment 模块改动：**  
`CommentServiceImpl.create()` 在写库成功后，通过 `CommentEventProducer` 发布：
```json
{ "commentId": 123, "postId": 456, "postAuthorId": 789, "commenterId": 101, "contentSnippet": "前20字" }
```

### 3.2 收藏模块（扩展 `counter`）

**改动点：**
- `ActionController.fav()` 在调用 `counterService.fav()` 后，调用新的 `FavoriteService.add(userId, postId)`
- `ActionController.unfav()` 同理调用 `FavoriteService.remove(userId, postId)`
- 新增 `FavoriteService` + `FavoriteMapper`，操作 `user_favorites` 表

**新增 API：**
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/favorites` | 分页查询我的收藏，`?page=0&size=20`，返回帖子卡片列表 |

响应复用 `FeedItemResponse`（已有 DTO），与首页 feed 卡片结构一致。

### 3.3 圈子模块（`com.tongji.circle`）

**包结构：**
```
circle/
  api/
    CircleController.java
    CircleMemberController.java
    dto/
      CircleCreateRequest.java
      CircleResponse.java
      CircleDetailResponse.java
      CircleSummaryResponse.java
      JoinCircleRequest.java       私有圈加入申请（含申请理由）
  mapper/
    CircleMapper.java
    CircleMemberMapper.java
  model/
    Circle.java
    CircleMember.java
  service/
    CircleService.java
    impl/CircleServiceImpl.java
```

**API：**
| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/v1/circles` | 公开 | 圈子广场，支持 `?category=&keyword=&page=` |
| POST | `/api/v1/circles` | 登录 | 创建圈子 |
| GET | `/api/v1/circles/{id}` | 公开（私有圈需成员） | 圈子详情 |
| PUT | `/api/v1/circles/{id}` | 圈主/管理员 | 编辑圈子信息 |
| GET | `/api/v1/circles/{id}/posts` | 公开（私有圈需成员） | 圈子帖子列表 |
| GET | `/api/v1/circles/{id}/members` | 公开 | 成员列表 |
| POST | `/api/v1/circles/{id}/join` | 登录 | 加入（公开自动通过；私有创建 PENDING 记录） |
| DELETE | `/api/v1/circles/{id}/members/me` | 成员 | 退出圈子 |
| GET | `/api/v1/circles/joined` | 登录 | 我加入的圈子（首页侧边栏用） |
| PUT | `/api/v1/circles/{id}/members/{userId}/approve` | 圈主/管理员 | 批准入圈申请 |
| PUT | `/api/v1/circles/{id}/posts/{postId}/feature` | 圈主/管理员 | 标记/取消精华 |

**可见性规则（在 Service 层强制）：**
- PUBLIC 圈子：任何人可查看帖子，加入后可发帖
- PRIVATE 圈子：仅 ACTIVE 成员可查看帖子和详情，`join` 创建 PENDING 申请，圈主审批

**发帖集成：** `KnowPostController.createDraft()` 接收可选的 `circleId`，`KnowPostServiceImpl` 校验用户是否为该圈的 ACTIVE 成员后写入 `circle_id`。

---

## 4. 前端模块设计

### 4.1 路由新增

```tsx
// App.tsx 新增路由
<Route path="/notifications" element={<NotificationPage />} />
<Route path="/collections" element={<CollectionsPage />} />
<Route path="/circles" element={<CircleSquarePage />} />
<Route path="/circles/:id" element={<CircleDetailPage />} />
```

Header 通知图标链接到 `/notifications`，收藏图标链接到 `/collections`，左侧导航「圈子」链接到 `/circles`。

### 4.2 通知中心页（`NotificationPage.tsx`）

- 页面加载时调用 `GET /api/v1/notifications/unread-count` 初始化角标
- 切换到「全部」tab 时调用 `PUT /api/v1/notifications/read-all`
- SSE 连接在 `AuthContext` 初始化时建立（有 token 就连），断线自动重连
- 通知列表 4 tabs：全部 / 评论 / 点赞 / 关注，对应 `type` 参数过滤
- 新增 `notificationService.ts`，封装所有通知 API 调用

### 4.3 我的收藏页（`CollectionsPage.tsx`）

- 复用 `PostCard` 组件展示帖子卡片
- tab：全部 / 帖子（架构预留 tab 扩展点）
- 调用 `GET /api/v1/favorites` 分页加载，上拉加载更多
- 新增 `favoriteService.ts`

### 4.4 圈子广场页（`CircleSquarePage.tsx`）

- 顶部 category tab 行：全部 / 投资 / 科技 / 价值 / 宏观 / 行业（固定枚举，与 DB `category` 字段对应）
- 圈子卡片：头像、名称、简介、成员数、帖子数、加入按钮
- 右侧栏：我加入的圈子（调用 `GET /api/v1/circles/joined`）、推荐圈子
- 新增 `circleService.ts`

### 4.5 圈子详情页（`CircleDetailPage.tsx`）

- 顶部：圈子横幅、名称、简介、成员数、加入/已加入按钮
- tabs：帖子 / 精华（`is_featured=1` 的圈子帖子，由圈主/管理员通过 `PUT /api/v1/circles/{id}/posts/{postId}/feature` 标记） / 成员 / 关于
- 帖子 tab：调用 `GET /api/v1/circles/{id}/posts`，复用 `PostCard`
- 成员 tab：头像列表，展示 OWNER/ADMIN 角色标识
- 关于 tab：圈子描述、创建时间、类别

### 4.6 发帖页改动（`CreatePage.tsx`）

- 帖子类型选择新增「圈子帖子」选项（对应原型中的圈子选择器）
- 选择「圈子帖子」后展示圈子下拉（调用 `GET /api/v1/circles/joined`）
- 提交时携带 `circleId` 字段

---

## 5. 跨切面关注点

### 5.1 权限控制

圈子相关操作在 `SecurityConfig` 白名单基础上：
- 查看 PUBLIC 圈子：无需登录
- 发帖、加入、退出：需要登录（`@AuthenticationPrincipal`）
- 审批、编辑圈子：Service 层校验 `role == OWNER || ADMIN`，不通过抛 `BusinessException(ErrorCode.FORBIDDEN)`

### 5.2 计数一致性

`circles.member_count` 和 `circles.post_count` 采用与 counter 模块相同的**直接 UPDATE 原子递增**方式（`UPDATE circles SET member_count = member_count + 1 WHERE id = ?`），不经过 Kafka，因为圈子操作频率远低于点赞。

### 5.3 SSE 连接管理

`SseEmitterRegistry` 使用 `ConcurrentHashMap<Long, SseEmitter>` 维护连接。用户同一账号多 tab 情况：后登录的连接覆盖前者（`put` 语义）。连接断开时从 map 移除，避免内存泄漏。

### 5.4 私信（DM）

原型中左侧导航有「私信」入口，本次不实现（需要 WebSocket，独立子项目）。导航图标保留，点击提示「即将上线」。

---

## 6. 实现顺序

考虑依赖关系，建议按以下顺序实现：

1. **DB Schema 变更** — 所有新表 + `know_posts.circle_id`
2. **comment-events Kafka 事件** — 改动 `CommentServiceImpl`，发布评论事件
3. **通知模块后端** — consumer + service + SSE + API
4. **收藏模块后端** — `user_favorites` 表 + `FavoriteService` + API + 改 `ActionController`
5. **圈子模块后端** — `circle` 全新模块
6. **前端：通知中心页 + SSE 角标**
7. **前端：我的收藏页**
8. **前端：圈子广场页 + 圈子详情页**
9. **前端：发帖页圈子选择器**

# 颐享 (YiXiang)

知识共享社区平台 — 连接知识与投资的力量。

## 技术栈

### 前端 (`yixiang-web/`)

| 类别 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS v4 + CSS Variables |
| UI 组件 | shadcn/ui (Radix Primitives) |
| 服务端状态 | TanStack Query v5 |
| 路由 | React Router v6 |
| 表单 | react-hook-form + zod |
| 图标 | lucide-react |
| Toast | sonner |
| 日期 | date-fns |
| 测试 | Vitest + Testing Library |

### 后端 (`yixiang_be/`)

| 类别 | 选型 |
|------|------|
| 语言 | Java 21 |
| 框架 | Spring Boot 3.2.4 |
| 安全 | Spring Security + OAuth2 Resource Server (JWT RS256) |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis (Redisson) + Caffeine |
| 搜索 | Elasticsearch 9.x |
| 消息 | Kafka |
| 数据同步 | Canal (MySQL binlog → Kafka) |
| AI | Spring AI (DeepSeek + OpenAI) |
| 存储 | Alibaba Cloud OSS |
| ORM | MyBatis 3 |

## 本地起步

### 前置条件

- Node.js 18+
- Java 21 + Maven 3
- MySQL 8.0 / Redis / Elasticsearch / Kafka

### 前端

```bash
cd yixiang-web
npm install
cp .env.example .env   # 编辑 VITE_API_BASE_URL
npm run dev             # http://localhost:5173
```

### 后端

```bash
cd yixiang_be
cp src/main/resources/application.yml.example src/main/resources/application.yml
# 编辑数据库/Redis/ES/Kafka 连接信息
mvn spring-boot:run     # http://localhost:8080
```

> JWT 需要 RS256 密钥对：`src/main/resources/keys/public.pem`（已提交）+ `private.pem`（需自行生成）。

## 项目结构

```
yixiang-web/src/
├── app/            # 应用入口、路由表、全局 Providers、ProtectedRoute
├── pages/          # 12 页面组件（路由级别）
├── components/
│   ├── layout/     # AppLayout / Header / Sidebar / PageShell
│   ├── ui/         # shadcn primitives (Button, Dialog, Tabs, …)
│   ├── common/     # EmptyState / LoadingSkeleton / ErrorBoundary / InfiniteList
│   └── user/       # FollowButton 等业务组件
├── features/       # 业务 Hook (useQuery / useMutation + 乐观更新)
│   ├── profile/    # useProfile
│   ├── relation/   # useFollow / useUnfollow
│   └── notification/ # useNotifications / useUnreadCount
├── services/       # API 客户端薄层（纯 fetch wrapper）
├── types/          # 后端 DTO 类型定义
├── hooks/          # 通用 Hook (useDebounce)
├── lib/            # apiClient / queryClient / formatters / utils / sse
├── config/         # Feature flags / env
└── styles/         # globals.css / theme tokens / scrollbar
```

## 功能

### 核心功能
- **信息流**: 推荐 / 关注 / 最新三 tab，点赞/收藏乐观更新
- **知识帖子**: 发布（Markdown 编辑器）、详情页、评论、标签
- **圈子**: 圈子广场、圈子详情、加入/退出、圈子内帖子
- **搜索**: 全文搜索（Elasticsearch），搜索建议，搜索历史
- **通知**: 实时 SSE 推送未读计数，分类筛选，标记已读
- **用户**: 个人主页、编辑资料、关注/粉丝列表
- **认证**: JWT 双 Token（15min access + 7d refresh），注册/登录
- **收藏**: 收藏夹分类，收藏列表
- **AI 问答**: 基于帖子的 RAG 问答（DeepSeek），SSE 流式生成

### 延后功能（详见 ROADMAP.md）
- 私信 (DM)
- 管理后台
- 移动端响应式
- AI 推荐算法
- 第三方 OAuth 登录

## 脚本

```bash
npm run dev         # 启动开发服务器
npm run build       # tsc + vite build
npm run preview     # 预览生产构建
npm run lint        # tsc --noEmit 类型检查
npm run test        # Vitest 单元测试
```

## 架构亮点

- **Counter 系统**: 点赞/收藏计数存储在 Redis 紧凑二进制 SDS，Lua 原子更新，bitmap 去重，Kafka 异步写聚合
- **Outbox + Canal + Kafka**: 业务写与异步副作用（索引更新、动态推送）解耦，保证最终一致性
- **三级缓存**: Caffeine 本地 → Redis 页缓存 → Redis 片段缓存，热点探测 + 防击穿
- **JWT 即时吊销**: Redis refresh token 白名单，登出立即失效

## License

MIT — 详见 [LICENSE](./LICENSE)

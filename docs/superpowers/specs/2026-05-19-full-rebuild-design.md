# 颐享(YiXiang)前端推倒重建 + 后端缺口补齐设计

**版本:** 2026-05-19
**作者:** Ming Chen + Claude
**状态:** Draft — 待用户审核

---

## 1. 背景与目标

### 1.1 背景

项目原型(`E:\code\yixiang\原型设计图\preview\src\`)由 12 个独立的 React + Tailwind v4 + Lucide 页面组成,代表了完整产品的视觉与交互契约。现有 `yixiang_fe/` 已有过两轮 UI 重设计迭代,完成度约 80%,但仍与原型存在结构性差距,且工作目录有大量未提交修改,继续打磨成本高于重做。

后端 `yixiang_be/` 的核心高并发链路 — counter(点赞/收藏)、relation(关注)、search(ES + 推荐)、outbox / canal / kafka — 是项目设计亮点,**不在本次重建范围内**。原型中尚未实现的功能(热门、话题、私信、草稿、设置、推荐、关注动态、用户认证 V/角色)通过新增模块的方式补齐。

### 1.2 目标

1. **12 页面 1:1 还原原型**(像素级)
2. **生产可用、开源就绪** — 完整的真 API 接入、空态/loading/错误态、键盘可访问、合理的 README/ROADMAP/CONTRIBUTING
3. **可扩展** — 清晰的模块边界、配置外置、Feature flag,fork 者易于二次开发
4. **保留高并发亮点** — counter / relation / search 一行代码不动

### 1.3 非目标

- ❌ 移动端原生 App(RN/Flutter)
- ❌ 微信小程序
- ❌ 管理后台(本期延后,SQL 手动打标顶替)
- ❌ 私信功能(本期延后,前端图标占位 + toast 提示)
- ❌ AI 推荐算法(本期 popularity-based,留 ML 接口)
- ❌ 第三方 OAuth 登录
- ❌ 支付/会员

---

## 2. 总体策略

### 2.1 双轨并行:前端推倒 + 后端只做加法

| 项目 | 处理方式 |
|---|---|
| `yixiang_fe/` | 保留为历史参考与 services 代码迁出源,新项目 ready 后手动删除 |
| `yixiang_be/` 高并发模块(counter/relation/search/outbox/canal/kafka) | **零改动** |
| `yixiang_be/` 其他模块(auth/profile/knowpost/notification/circle/favorite/comment/llm/storage) | DTO 增强,字段扩展,**结构性逻辑不动** |
| **新建** `yixiang-web/` | 从零搭建,以 12 个原型 `.jsx` 为视觉契约源 |
| **新建** `yixiang_be/` 模块: `hot / topic / draft / settings / recommend / activity` | 严格沿用现有架构模式(MyBatis XML + Snowflake ID + BusinessException + Kafka 消费者) |
| **延后** `dm`(私信)、`admin` | 创建 `ROADMAP.md` 记录,代码里以 `// TODO(roadmap#X)` 锚点占位 |

### 2.2 项目结构

```
E:\code\yixiang\
├── yixiang_be/              # 后端,只做加法
├── yixiang_fe/              # 旧前端,新项目 ready 后删除
├── yixiang-web/             # 新前端(本设计核心)
├── 原型设计图/                # 12 .jsx 视觉契约源
├── docs/
│   ├── superpowers/
│   │   ├── specs/2026-05-19-full-rebuild-design.md  # 本文档
│   │   └── plans/           # 后续 writing-plans 产出
│   └── ROADMAP.md           # 延后项追踪(新建)
└── CLAUDE.md
```

**`yixiang-web/` 内部结构:**

```
yixiang-web/
├── src/
│   ├── app/                 # 应用入口、路由、全局 Providers
│   │   ├── App.tsx
│   │   ├── routes.tsx       # 集中路由表
│   │   ├── providers.tsx    # QueryClient + AuthProvider + Toaster
│   │   └── ProtectedRoute.tsx
│   ├── pages/               # 12 页面
│   ├── components/
│   │   ├── layout/          # Header / Sidebar / PageShell / RightRail
│   │   ├── post/            # FeedCard / PostBody / CommentList / LikeFavBar
│   │   ├── widgets/         # MyStats / HotTopics / ActivityFeed / RecommendUsers / RecommendCircles / MyCircles
│   │   ├── circle/          # CircleCard / CircleHeader / CircleMemberList
│   │   ├── user/            # UserCard / FollowButton / Avatar / VerifiedBadge / RoleTag
│   │   ├── common/          # EmptyState / LoadingSkeleton / ErrorBoundary / InfiniteList
│   │   └── ui/              # shadcn primitives(Button/Dialog/Tabs/...)
│   ├── features/            # 业务逻辑(useQuery/useMutation hook + 乐观更新规则)
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── post/
│   │   ├── notification/
│   │   ├── circle/
│   │   ├── favorite/
│   │   ├── search/
│   │   ├── topic/
│   │   ├── hot/
│   │   ├── draft/
│   │   ├── settings/
│   │   ├── recommend/
│   │   └── activity/
│   ├── services/            # 薄 API client(从 yixiang_fe 迁出整理)
│   ├── types/               # 后端 DTO 类型
│   ├── hooks/               # 通用 hook(useDebounce / useIntersection 等)
│   ├── lib/                 # apiClient / queryClient / utils / formatters / sse
│   ├── config/              # features.ts(Feature flag)、env.ts
│   ├── styles/              # globals.css / theme tokens
│   ├── i18n/                # 占位目录(后续接 i18next)
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
└── README.md
```

**目录设计要点:**

- `services/` 是薄 API client(纯 fetch wrapper),不含业务状态
- `features/` 是业务逻辑层(useQuery / useMutation hook + 乐观更新策略),组件里只看到 `useLike()` `useFav()`,看不到 fetch
- `components/ui/` 是 shadcn primitives,`components/{post,user,circle,widgets}/` 是业务组件,边界物理分离

---

## 3. 技术栈

### 3.1 选型

| 维度 | 选型 | 理由 |
|---|---|---|
| 构建 | Vite 5 + TypeScript 5 + React 18 | 与原型完全对齐 |
| 样式 | Tailwind CSS v4(@theme)+ CSS Vars | 原型同款,变量化便于主题扩展 |
| 路由 | React Router v6 | 项目规模足够 |
| 服务端状态 | **TanStack Query v5** | 替代手写 fetch + useState,自动缓存/重试/失效/乐观更新;点赞/关注的乐观更新是核心交互 |
| 客户端状态 | React Context + 局部 useState | Query 吃掉 80% 状态需求,剩下 Auth 用 Context |
| HTTP | 现有 `apiFetch<T>` 迁移并封装 | JWT 注入 + 401 自动 refresh + 错误归一化 |
| 表单 | react-hook-form + zod | schema 对应后端 DTO,运行时校验 + 类型推导 |
| UI 原语 | shadcn/ui(基于 Radix)| Dialog / Tabs / Popover / Tooltip / Select / Toast / Dropdown,带 ARIA |
| 图标 | lucide-react | 原型同款 |
| Toast | sonner | API 简洁 |
| 日期 | date-fns + zh-CN | "2 小时前" 用 formatDistanceToNow |
| Markdown | react-markdown + remark-gfm | 帖子详情 |
| SSE | 原生 EventSource 封装 hook | 通知未读数 |
| 代码规范 | ESLint + Prettier + husky + lint-staged + commitlint(conventional)| 开源项目门面 |
| 测试 | Vitest + RTL(关键 hook/util) | 不追求覆盖率,关键逻辑单测即可 |
| i18n | **占位不引入** | 中文文案集中到 `lib/messages.ts`,防止散布 |
| 暗色 | **占位不实现** | Tailwind v4 @theme 变量化,后续加 `[data-theme="dark"]` 即可 |
| 移动响应式 | 1280 桌面优先,移动端不破版 | 真实移动端体验放到未来 |
| Feature Flag | `src/config/features.ts` 静态配置 | 控制 DM_ENABLED / AI_QA_ENABLED 等开关 |
| 环境变量 | `.env.example` + `VITE_*` | `VITE_API_BASE_URL` 等 |

### 3.2 明确不引入

- redux / zustand / mobx(Query + Context 够用)
- antd / arco / MUI(样式优先级会与原型打架)
- storybook(开源加分项但非必备,延后)
- monorepo / pnpm workspaces(项目规模不够)
- TanStack Router(React Router v6 够用)
- Docker / GitHub Actions / Sentry(本期不交付,用户决定)

---

## 4. 后端缺口补齐

### 4.1 新模块清单

**约束:** counter / relation / search / outbox / canal / kafka 主干一行不改;所有新模块沿用现有架构模式。

| # | 模块包 | 解决的原型功能 | 新表 | 主要接口 | 工时 |
|---|---|---|---|---|---|
| 1 | `com.tongji.hot` | "热门"导航 + 首页热门 tab | 无(读 counter+post + Caffeine 60s 缓存) | `GET /api/v1/hot/posts?period=24h\|7d\|30d&cursor=` | 1-2d |
| 2 | `com.tongji.topic` | "话题"导航 + 话题详情 + 热门话题 widget | `topics`(tag PK, post_count, view_count, last_used_at)| `GET /api/v1/topics/hot`<br>`GET /api/v1/topics/{tag}/posts`<br>`POST /api/v1/topics/{tag}/view`(埋点)| 2-3d |
| 3 | `com.tongji.draft` | 草稿箱 | `drafts`(id, user_id, title, content_url, tags, circle_id, cover_image, updated_at)| `GET /api/v1/drafts`<br>`POST/PUT/DELETE /api/v1/drafts[/{id}]`<br>`POST /api/v1/drafts/{id}/publish` | 2d |
| 4 | `com.tongji.settings` | 设置 | `user_settings`(user_id PK, notification_pref JSON, privacy JSON, theme, language, updated_at)| `GET /PATCH /api/v1/settings` | 1d |
| 5 | `com.tongji.recommend` | 右栏推荐关注 + 推荐圈子 | 无(基于 follower_count / member_count)| `GET /api/v1/recommend/users?limit=5`<br>`GET /api/v1/recommend/circles?limit=5` | 1d |
| 6 | `com.tongji.activity` | 右栏关注动态 + 动态时间线 | `activities`(id, user_id, type, target_type, target_id, payload JSON, created_at) — 新 Kafka 消费者从 outbox 聚合写入 | `GET /api/v1/activities/following?cursor=` | 3d |

### 4.2 两处增强(非新模块)

| # | 改动 | 内容 |
|---|---|---|
| 7 | `users` 表 | 加 `verified BOOLEAN`、`role_title VARCHAR(20)`、`banner_image VARCHAR(500)` 三列;UserDTO / UserSummary 同步加字段 |
| 8 | "最近点赞人" | **不动** counter 主表 / bitmap。新建 Redis ZSET `recent:likers:{postId}`(top 5,member=userId,score=ts)。新加 Kafka 消费者订阅 `counter-events` 写入。FeedItem DTO 加 `recentLikers: UserBrief[]` + `likerSummary: string` |

### 4.3 延后项(TODO)

| 模块 | 延后原因 | 占位策略 |
|---|---|---|
| `com.tongji.dm`(私信) | 工作量 5d,本期优先级低 | 前端导航图标保留,点击 sonner toast "私信功能即将上线",代码 `// TODO(roadmap#dm)` |
| 管理后台 | 工程量大,本期 SQL 手工打标顶替 | `users.verified` / `role_title` 通过 `UPDATE users SET ...` 维护;`docs/ROADMAP.md` 记录 |

### 4.4 关键安全/性能约束

1. **DM 延后,本期无影响**
2. **activity 表防止无限增长** — `created_at` 索引 + 后台定时任务 90 天前归档(归档表 vs 物理删除,实施时决定)
3. **topic 计数避免热点 key** — 超热门 tag 用 Redis INCR + 异步落库,不直接 UPDATE topics 表
4. **recommend 接口加 Caffeine 60s 本地缓存** — 推荐对实时性要求低
5. **recentLikers ZSET 容量** — `ZADD` 后 `ZREMRANGEBYRANK key 0 -6` 保持 top 5,过期 7d
6. **所有新模块统一错误模型** — `throw new BusinessException(ErrorCode.XXX)`,新增 `DRAFT_NOT_FOUND` / `TOPIC_NOT_FOUND` 等错误码

### 4.5 后端总工时

约 **12 工作日 ≈ 2.5 周**(剔除 DM 后)。

---

## 5. 实施 Roadmap

### 5.1 四 Phase 总览

| Phase | 时长 | 内容 |
|---|---|---|
| **P0** 前端基建 | Week 1 | 新项目脚手架 + 设计系统 + Layout shell + 服务层迁移 + 路由 |
| **P1** 后端缺口 | Week 2 – 4.5 | 6 新模块 + DTO 增强(剔除 DM)|
| **P2** 12 页面 | Week 2.5 – 6(与 P1 重叠)| 12 页面 1:1 还原 + 真 API + 生产细节 |
| **P3** 上线打磨 | Week 6 – 6.5 | README + ROADMAP + CONTRIBUTING + LICENSE,用户手工测试通过 |

**总计 ~6.5 周专注开发。**

### 5.2 节奏图

```
Week 1  ▸ P0
Week 2  ▸ P1(DB 迁移 + DTO 增强)       + P2 启动(LoginPage / RegisterPage)
Week 3  ▸ P1(hot / topic / recommend) + P2(Profile / FollowList / Collections)
Week 4  ▸ P1(activity / draft / settings) + P2(Search / CircleSquare / CircleDetail)
Week 5  ▸ P1(recentLikers 收尾)        + P2(PostDetail / CreatePage)
Week 6  ▸ P2(HomePage 最后做)          + P3(文档)
```

### 5.3 Phase 2 实施顺序(由易到难)

对应原型 12 个 `.jsx` 页面,每一行一一对应。私信是导航项不是页面,在导航实现里以 toast 占位,不计入下表。

| 顺序 | 页面 | 原型文件 | 依赖 API | 复杂度 |
|---|---|---|---|---|
| 1 | 登录 | `登录页.jsx` | 现有 auth | ⭐ |
| 2 | 注册 | `注册页.jsx` | 现有 auth | ⭐ |
| 3 | 个人主页 | `个人主页.jsx` | user + 新 UserDTO | ⭐⭐ |
| 4 | 关注/粉丝列表 | `关注粉丝列表页.jsx` | relation | ⭐⭐ |
| 5 | 通知中心 | `通知中心页.jsx` | notification + SSE | ⭐⭐ |
| 6 | 我的收藏 | `我的收藏页.jsx` | favorite | ⭐⭐ |
| 7 | 搜索结果 | `搜索结果页.jsx` | search | ⭐⭐ |
| 8 | 圈子广场 | `圈子广场页.jsx` | circle | ⭐⭐ |
| 9 | 圈子详情 | `圈子详情页.jsx` | circle + post | ⭐⭐⭐ |
| 10 | 帖子详情 | `帖子详情页.jsx` | post + comment + recentLikers + AI Q&A SSE | ⭐⭐⭐⭐ |
| 11 | 发布帖子 | `发布帖子页.jsx` | post + OSS + draft + topic | ⭐⭐⭐⭐ |
| 12 | 首页信息流 | `首页信息流.jsx` | feed + activity + recommend + hot topic | ⭐⭐⭐⭐⭐ |

### 5.4 单页生产标准(P2 每页交付清单)

- [ ] 像素级对齐原型(截图比对)
- [ ] 真实 API 接入,无 hardcoded 数据
- [ ] 骨架屏(初始 loading)
- [ ] 空态(EmptyState + 文案)
- [ ] 错误态(ErrorBoundary + 友好提示)
- [ ] 乐观更新(点赞/收藏/关注等高频交互)
- [ ] 分页 / 无限滚动(列表页)
- [ ] 表单校验(zod schema)
- [ ] 键盘可访问(shadcn primitive 自带)
- [ ] 移动端不破版(min-width 360px)
- [ ] `tsc --noEmit` 通过

### 5.5 Phase 3 交付范围(用户确认后收窄)

- 完整 `README.md`(项目介绍 / 技术栈 / 架构图 / 本地起步 / Roadmap / License)
- `ROADMAP.md`(明确标记 DM / admin / 移动端 / AI 推荐等延后项)
- `CONTRIBUTING.md`(简版:分支策略、commit 规范、PR 流程)
- `LICENSE`(MIT 或 Apache 2.0,实施时确认)
- 用户手工测试通过

**不交付:** docker-compose / GitHub Actions / Sentry(后续可选)

---

## 6. Phase 0 详细拆解

P0 共 5 个工作日(1 周)。

### P0.1 项目初始化与工具链 — 0.5d

- `npm create vite@latest yixiang-web -- --template react-ts`
- `tsconfig.json` strict 模式 + `@/*` 路径别名
- `vite.config.ts`: `@/` alias + `/api` 代理到 `localhost:8080`
- 安装依赖(见 §6 附录依赖清单)
- 工具链: ESLint(`@typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`)+ Prettier + husky + lint-staged + commitlint
- `.editorconfig` / `.gitignore` / `.prettierrc`

### P0.2 设计系统与 Tailwind 主题 — 0.5d

- `src/styles/globals.css` 引入 tailwindcss + `@theme` 定义(从原型 index.css 拷贝并补全)
- `src/styles/scrollbar.css`、`base.css`
- 字体接入: Inter + PingFang SC

### P0.3 服务层迁移 — 1d

- `src/lib/apiClient.ts` 从 yixiang_fe 迁移并增强:
  - JWT 自动注入(localStorage)
  - 401 自动调 refresh,refresh 失败再 logout
  - 错误归一化为 `ApiError`
  - 支持 SSE 流式响应封装
- `src/types/*.ts` 全量迁移 + 按新模块预留占位类型
- `src/services/*.ts`:authService / knowpostService / profileService / relationService / searchService / notificationService / favoriteService / circleService 迁移

### P0.4 全局 Provider 与状态 — 0.5d

- `src/app/providers.tsx`:`<QueryClientProvider>` + `<AuthProvider>` + `<Toaster>`
- `src/context/AuthContext.tsx` 迁移(token 管理 + 60s 自动刷新轮询)
- `src/lib/queryClient.ts`:QueryClient 配置(staleTime 30s / retry 1 / refetchOnWindowFocus false)

### P0.5 Layout Shell — 1d

- `src/components/layout/AppLayout.tsx`:顶层容器(Header + Sidebar + Outlet)
- `src/components/layout/Sidebar.tsx`:1:1 复刻原型左栏(11 个导航 + 用户菜单 + 加入圈子卡片)
- `src/components/layout/Header.tsx`:logo + 搜索 + 发布按钮 + 通知/私信图标(带角标) + 用户下拉
- `src/components/layout/PageShell.tsx`:接受 `rightRail?: ReactNode` prop,max-w-[1280px] 居中 + 三栏布局

### P0.6 路由表与受保护路由 — 0.5d

- `src/app/routes.tsx`:集中路由表 + 12 页面 + Login/Register + 404
- `src/app/ProtectedRoute.tsx`:无 token 跳 login
- 12 个 page 文件每个先建 stub

### P0.7 通用 UI Primitives — 1d

- `src/components/ui/`:button / dialog / tabs / tooltip / popover / select / dropdown-menu / avatar / badge / input / textarea / skeleton
- `src/components/common/EmptyState.tsx`:icon + title + description + action
- `src/components/common/LoadingSkeleton.tsx`:FeedCardSkeleton / UserCardSkeleton / CircleCardSkeleton
- `src/components/common/ErrorBoundary.tsx`
- `src/components/common/InfiniteList.tsx`:cursor 分页 + IntersectionObserver 触底

### P0.8 文档与配置 — 0.5d

- `README.md` 简版
- `.env.example`:`VITE_API_BASE_URL=http://localhost:8080`
- `src/config/features.ts`:`DM_ENABLED=false`、`AI_QA_ENABLED=true` 等
- `src/lib/messages.ts`:中文文案集中地(后续 i18n 准备)

### P0.9 烟雾测试 — 0.5d

- `npm run dev` 启动成功
- 登录页可对接后端 `/auth/login`
- 登录后跳首页,看到完整布局(stub 内容)
- 导航各项可切换
- `npm run build` 通过
- `tsc --noEmit` 零错误

**P0 完成标志:** 能登录、能切页、三栏布局与原型一致(stub 内容),开发环境完全就绪。

### P0 附录:依赖清单

```jsonc
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.59.0",
    "@tanstack/react-query-devtools": "^5.59.0",
    "@radix-ui/react-dialog": "^1.1.x",
    "@radix-ui/react-tabs": "^1.1.x",
    "@radix-ui/react-popover": "^1.1.x",
    "@radix-ui/react-tooltip": "^1.1.x",
    "@radix-ui/react-select": "^2.1.x",
    "@radix-ui/react-dropdown-menu": "^2.1.x",
    "@radix-ui/react-toast": "^1.2.x",
    "@radix-ui/react-slot": "^1.1.x",
    "class-variance-authority": "^0.7.1",
    "tailwind-merge": "^2.5.x",
    "clsx": "^2.1.1",
    "lucide-react": "^0.460.0",
    "sonner": "^1.7.x",
    "date-fns": "^4.1.0",
    "react-hook-form": "^7.53.x",
    "@hookform/resolvers": "^3.9.x",
    "zod": "^3.23.x",
    "react-markdown": "^9.0.x",
    "remark-gfm": "^4.0.1",
    "framer-motion": "^11.x"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.6.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "eslint": "^9.x",
    "@typescript-eslint/eslint-plugin": "^8.x",
    "@typescript-eslint/parser": "^8.x",
    "eslint-plugin-react-hooks": "^5.x",
    "eslint-plugin-react-refresh": "^0.4.x",
    "prettier": "^3.x",
    "husky": "^9.x",
    "lint-staged": "^15.x",
    "@commitlint/cli": "^19.x",
    "@commitlint/config-conventional": "^19.x",
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x"
  }
}
```

---

## 7. 风险与权衡

| 风险 | 缓解 |
|---|---|
| 推倒重建后浪费现有 yixiang_fe 工作 | 已有工作的"成果"是验证可行性 + 沉淀视觉细节(已合并到原型),代码本身复用价值有限。services / types / Auth 这些有价值的部分明确迁出 |
| P1 / P2 重叠期 API 契约可能漂移 | DTO 增强(P1.1 / P1.2)是 P1 第一个礼拜的事,P2 启动前 DTO 必须冻结;之后纯加新接口不破坏现有 |
| TanStack Query 引入门槛 | 这是行业标准,文档完善,值得学习成本 |
| shadcn/ui 组件全部 copy-paste 进项目体积膨胀 | 只 copy 真用到的(P0.7 已列清单:button / dialog / tabs / tooltip / popover / select / dropdown-menu / avatar / badge / input / textarea / skeleton),后续按需添加 |
| 12 页面像素级对齐工作量被低估 | P2 顺序由易到难,前几页跑通后单页节奏会快(预估每页 2-3d) |
| recentLikers 新 Kafka 消费者引入额外的消息系统耦合 | 单独 consumer group,失败不影响主路径;ZSET 容量限制 ≤5 防止内存爆炸 |
| 开源项目 fork 者环境差异 | `.env.example` + README 详细指引,Phase 3 文档要回答"如何在新环境跑起来" |

---

## 8. 成功标准

P0 完成:
- 新项目可启动,能登录,能看到与原型一致的 stub 页面

P1 完成:
- 7 个新模块的接口在 Postman 跑通
- DTO 增强字段在现有接口的返回中体现

P2 完成:
- 12 页面与原型 1:1 对齐(用户截图核对)
- 全部接真 API,无 hardcoded 数据
- 单页清单(§5.4)全部勾选

P3 完成:
- README / ROADMAP / CONTRIBUTING / LICENSE 齐全
- 用户手工测试通过
- yixiang_fe/ 手动删除

整体成功标志:**项目可以推到 GitHub 公开仓库,陌生人 clone 下来按 README 跑起来,跑起来看到的就是原型 12 页面的样子。**

---

## 附录:与历史文档的关系

之前的 `2026-05-18-*` 系列 spec 与 plan 已全部删除,以本 spec 为唯一来源。它们的历史价值:

- **后端已实施部分** — notification / favorite / circle 三个模块已通过 commits `c912efd / 134ccf7 / 9f71ed8 / 3e65f4c` 落地,本 spec 在其基础上**继续加** 6 个新模块,不重做
- **前端已迭代部分** — 上一轮 UI 重设计的若干 layout / widget / FeedCard 实现思路已沉淀到 `原型设计图/`(视觉契约源),本 spec 选择推倒重来,代码不直接复用,但视觉决策已固化在原型里
- 完整历史可查 `git log --oneline -- docs/superpowers/`

`CLAUDE.md` — 项目级 readme,本设计完成后需更新模块表。

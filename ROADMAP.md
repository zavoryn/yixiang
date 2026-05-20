# Roadmap

颐享平台功能路线图。标记 `✅` 已完成，`🚧` 进行中，`📋` 计划中。

## 已完成 ✅

- [x] 用户注册/登录（JWT 双 Token 认证）
- [x] 个人信息编辑（头像、昵称、简介、标签）
- [x] 知识帖子发布/编辑/删除
- [x] 帖子详情页（内容、标签、点赞、收藏、评论）
- [x] 首页信息流（推荐/关注/最新 三 Tab）
- [x] 圈子广场 + 圈子详情 + 加入/退出
- [x] 全文搜索（Elasticsearch）
- [x] 通知中心（SSE 实时推送 + 分类筛选）
- [x] 收藏夹 + 收藏管理
- [x] 关注/粉丝系统
- [x] 点赞/收藏计数（Redis 计数器 + 乐观更新）
- [x] AI 帖子问答（RAG + SSE 流式生成）
- [x] 草稿箱 + 帖子发布工作流
- [x] 话题标签 + 热门话题
- [x] OSS 直传图片/文件

## 延后项 📋

### 私信 (DM) — `TODO(roadmap#1)`

一对一实时私信功能。

**当前占位:** 导航栏信封图标，点击 toast "私信功能即将上线"。
**代码标记:** `// TODO(roadmap#1)` 在 Header 组件中。
**预估工时:** ~5 天。
**依赖:** 后端 `dm` 模块（消息表、WebSocket/长轮询）。

### 管理后台 — `TODO(roadmap#2)`

用户管理、内容审核、认证打标、数据统计。

**当前替代方案:**
- `users.verified` / `users.role_title` 通过 SQL 手动 UPDATE 维护
- 内容审核暂跳过
**预估工时:** ~8 天。

### 移动端响应式 — `TODO(roadmap#3)`

当前 1280px 桌面优先，移动端不破版但不提供完整体验。

**预估工时:** ~5 天。

### AI 推荐算法 — `TODO(roadmap#4)`

当前使用 popularity-based 推荐（`GET /api/v1/recommend/users`），后续替换为协同过滤或内容推荐。

**接口预留:** 现有 recommend 模块可替换 service 实现层，API 契约不变。
**预估工时:** ~8 天。

### 第三方 OAuth 登录 — `TODO(roadmap#5)`

微信/企业微信/钉钉登录。

**当前状态:** 登录页已预留第三方登录按钮（点击 toast 提示即将上线）。
**预估工时:** ~5 天。

### i18n 国际化 — `TODO(roadmap#6)`

当前中文文案集中管理在 `lib/messages.ts`，后续引入 i18next。

**预估工时:** ~3 天。

### 暗色模式 — `TODO(roadmap#7)`

Tailwind v4 `@theme` 已变量化，加 `[data-theme="dark"]` 即可启用。

**预估工时:** ~2 天。

### CI/CD — `TODO(roadmap#8)`

GitHub Actions / Docker Compose / Sentry 错误监控。

**预估工时:** ~3 天。

## 贡献

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

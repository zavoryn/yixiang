颐享平台功能路线图。标记 `✅` 已完成，`🚧` 进行中，`📋` 计划中。

## 已完成 ✅

- [x] 用户注册/登录（JWT 双 Token 认证）
- [x] 个人信息编辑（头像、昵称、简介、标签）
- [x] 知识帖子发布/编辑/删除（基础 CRUD）
- [x] 圈子广场 + 圈子详情 + 加入/退出
- [x] 通知中心（SSE 实时推送 + 分类筛选）
- [x] 关注/粉丝系统
- [x] 点赞/收藏计数（Redis 计数器 + 乐观更新）
- [x] 全局搜索：帖子搜索已接入 Elasticsearch
- [x] 首页信息流（推荐/最新/关注）
- [x] 帖子详情 + AI 问答（RAG + SSE 流式生成）
- [x] 私信（一对一实时私信）
- [x] 收藏夹（创建/编辑/分类管理）
- [x] 访客统计 + 成就徽章
- [x] 股票行情挂件

## 待实现 📋（欢迎贡献）

### 管理后台
用户管理、内容审核、数据统计 Dashboard、运营配置等后台管理系统。

### 移动端 App
iOS / Android 客户端（React Native / Flutter / 原生均可）。

### 第三方 OAuth 登录
微信/企业微信/钉钉登录。

### AI 推荐算法
当前使用 popularity-based 推荐，后续可替换为协同过滤或内容推荐。

### i18n 国际化
当前中文文案集中管理在 `lib/messages.ts`，后续可引入 i18next。

### 暗色模式
Tailwind v4 `@theme` 已变量化，加 `[data-theme="dark"]` 即可启用。

### CI/CD
GitHub Actions / Docker Compose / Sentry 错误监控。

## 贡献

详见 README.md 中的贡献指南。

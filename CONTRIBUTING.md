# Contributing

感谢你对颐享的关注！本文档介绍如何参与项目开发。

## 行为准则

- 尊重他人，文明交流
- 代码评审客观、建设性
- 不接受人身攻击、歧视性言论

## 分支策略

- `main` — 稳定分支，可随时部署
- `feat/<feature-name>` — 功能分支，从 main 切出
- `fix/<bug-name>` — 修复分支

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

feat: 新功能
fix: 修复 bug
docs: 文档
refactor: 重构
test: 测试
chore: 构建/工具
```

示例:
```
feat: 添加帖子收藏功能
fix: 修复通知未读数不更新的问题
docs: 更新 README 本地起步指南
```

## PR 流程

1. 从 `main` 创建功能分支
2. 开发和本地测试（`npm run build && npm test`）
3. 提交代码，遵循 commit 规范
4. 推送到远端
5. 创建 Pull Request 到 `main`
6. PR 标题遵循 commit 规范，描述写清楚改动原因和影响
7. 等待 Review，通过后合并

## 开发环境

### 前端

```bash
cd yixiang-web
npm install
npm run dev       # 启动在 :5173
npm run build     # 类型检查 + 构建
npm run test      # 运行测试
```

### 后端

```bash
cd yixiang_be
mvn spring-boot:run   # 启动在 :8080
mvn test              # 运行测试
```

## 代码风格

### 前端

- TypeScript strict 模式
- 使用 shadcn/ui 组件，不引入第三方 UI 库
- API 调用通过 `services/` → `features/` Hook → 页面组件
- 交互状态用 TanStack Query（useQuery / useMutation），不手写 fetch + useState
- 乐观更新：`onMutate` 改缓存 → `onError` 回滚 → `onSettled` invalidateQueries

### 后端

- 严格分层：`api/` (Controller + DTO) → `service/` (接口 + impl) → `mapper/` (MyBatis)
- 异常统一用 `throw new BusinessException(ErrorCode.XXX)`
- ID 生成：`ThreadLocalRandom.current().nextLong(Long.MAX_VALUE)`（Snowflake 风格）
- Kafka 消费者：`@KafkaListener` + `Acknowledgment` 手动 ack
- 认证：`@AuthenticationPrincipal Jwt jwt` + `jwtService.extractUserId(jwt)`

## 项目结构

```
yixiang_be/src/main/java/com/tongji/
├── auth/         # JWT 认证 + Token 刷新
├── counter/      # Redis 点赞/收藏计数器
├── knowpost/     # 知识帖子 CRUD
├── relation/     # 关注/粉丝（Outbox 模式）
├── search/       # ES 搜索索引
├── circle/       # 圈子管理
├── notification/ # 通知 + SSE
├── comment/      # 评论
├── favorite/     # 收藏
├── hot/          # 热门内容
├── topic/        # 话题标签
├── draft/        # 草稿箱
├── settings/     # 用户设置
├── recommend/    # 推荐用户/圈子
├── activity/     # 关注动态
├── profile/      # 用户资料
├── storage/      # OSS 文件上传
├── llm/          # AI 问答（Spring AI + RAG）
├── cache/        # 三级缓存
└── common/       # 全局异常 + 错误码
```

## License

MIT — 详见 [LICENSE](./LICENSE)。

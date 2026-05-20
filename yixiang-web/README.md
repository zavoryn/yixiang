# yixiang-web

颐享(YiXiang)前端 — 知识共享社区。

## 技术栈

- Vite + React 18 + TypeScript
- Tailwind CSS v4 + shadcn/ui(Radix)
- TanStack Query v5(服务端状态)
- React Router v6
- lucide-react + sonner + date-fns + react-hook-form + zod

## 本地起步

```bash
npm install
cp .env.example .env
npm run dev
```

默认 dev server 在 http://localhost:5173,API 代理到 http://localhost:8080。

## 脚本

- `npm run dev` — 启动开发服务器
- `npm run build` — 类型检查 + 生产构建
- `npm run preview` — 预览生产构建
- `npm run lint` — ESLint 检查
- `npm run format` — Prettier 格式化
- `npm run typecheck` — 单独跑类型检查
- `npm run test` — Vitest 单元测试

## 项目结构

- `src/app/` — 应用入口、路由、Providers
- `src/pages/` — 页面级组件
- `src/components/{ui,common,layout,...}/` — UI primitives + 业务组件
- `src/features/` — 业务逻辑(useQuery / useMutation)
- `src/services/` — API client(薄封装)
- `src/types/` — 后端 DTO 类型
- `src/lib/` — apiClient / queryClient / utils
- `src/config/` — Feature flags / env
- `src/styles/` — 全局 css / theme tokens

## 后端

后端 Spring Boot 在同 monorepo `../yixiang_be/`,详见根 README 与 `CLAUDE.md`。

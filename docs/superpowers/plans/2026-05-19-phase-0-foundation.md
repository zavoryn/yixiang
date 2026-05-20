# Phase 0 — 前端基建(yixiang-web)Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `E:\code\yixiang\yixiang-web\` 从零建立 Vite + React 18 + TS + Tailwind v4 + TanStack Query + shadcn/ui 项目骨架,实现"可登录、能切页、布局与原型一致(stub 内容),开发环境就绪"。

**Architecture:** SPA。一个集中 routes 表 + Outlet 模式。Providers 三层:QueryClient(服务端状态)+ AuthContext(token 管理 + 60s 自动刷新)+ Toaster。Layout 三栏:Header + Sidebar + PageShell(内容 + 可选 right rail)。1280px 居中。

**Tech Stack:** Vite 5、React 18、TypeScript 5(strict)、Tailwind v4(`@theme`)、React Router v6、TanStack Query v5、shadcn/ui(Radix)、lucide-react、sonner、date-fns、react-hook-form + zod、ESLint + Prettier + husky + lint-staged + commitlint、Vitest + RTL。

**Reference files:**
- Spec: `docs/superpowers/specs/2026-05-19-full-rebuild-design.md`
- 视觉契约源: `E:\code\yixiang\原型设计图\preview\src\` 12 个 `.jsx`
- 旧前端(迁移源): `E:\code\yixiang\yixiang_fe\src\`
- 后端 API base: `http://localhost:8080`

---

## File Map

**Create(新文件):**

```
E:\code\yixiang\yixiang-web\
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── .gitignore
├── .editorconfig
├── .prettierrc
├── .eslintrc.cjs
├── commitlint.config.cjs
├── .husky/pre-commit
├── .husky/commit-msg
├── .env.example
├── README.md
├── LICENSE
├── public/favicon.svg
└── src/
    ├── main.tsx
    ├── styles/
    │   ├── globals.css            # tailwind + @theme tokens
    │   └── scrollbar.css
    ├── app/
    │   ├── App.tsx
    │   ├── routes.tsx
    │   ├── providers.tsx
    │   └── ProtectedRoute.tsx
    ├── lib/
    │   ├── apiClient.ts           # JWT + 401 refresh + ApiError
    │   ├── apiClient.test.ts
    │   ├── queryClient.ts
    │   ├── sse.ts                 # EventSource hook 封装
    │   ├── utils.ts               # cn() classnames 合并
    │   └── env.ts
    ├── context/
    │   ├── AuthContext.tsx
    │   └── AuthContext.test.tsx
    ├── services/                  # 薄 API client(从 yixiang_fe 迁移)
    │   ├── authService.ts
    │   ├── knowpostService.ts
    │   ├── profileService.ts
    │   ├── relationService.ts
    │   ├── searchService.ts
    │   ├── notificationService.ts
    │   ├── favoriteService.ts
    │   └── circleService.ts
    ├── types/                     # 后端 DTO 类型(从 yixiang_fe 迁移)
    │   ├── auth.ts
    │   ├── profile.ts
    │   ├── knowpost.ts
    │   ├── search.ts
    │   ├── content.ts
    │   ├── relation.ts
    │   ├── notification.ts
    │   ├── favorite.ts
    │   ├── circle.ts
    │   └── api.ts
    ├── config/
    │   ├── features.ts            # Feature flag 静态配置
    │   └── env.ts
    ├── components/
    │   ├── ui/                    # shadcn primitives
    │   │   ├── button.tsx
    │   │   ├── dialog.tsx
    │   │   ├── tabs.tsx
    │   │   ├── tooltip.tsx
    │   │   ├── popover.tsx
    │   │   ├── select.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── avatar.tsx
    │   │   ├── badge.tsx
    │   │   ├── input.tsx
    │   │   ├── textarea.tsx
    │   │   └── skeleton.tsx
    │   ├── common/
    │   │   ├── EmptyState.tsx
    │   │   ├── LoadingSkeleton.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   └── InfiniteList.tsx
    │   │   └── InfiniteList.test.tsx
    │   └── layout/
    │       ├── AppLayout.tsx
    │       ├── Sidebar.tsx
    │       ├── Header.tsx
    │       └── PageShell.tsx
    ├── pages/                     # 12 个 stub
    │   ├── HomePage.tsx
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── ProfilePage.tsx
    │   ├── FollowListPage.tsx
    │   ├── NotificationPage.tsx
    │   ├── CollectionsPage.tsx
    │   ├── SearchPage.tsx
    │   ├── CircleSquarePage.tsx
    │   ├── CircleDetailPage.tsx
    │   ├── PostDetailPage.tsx
    │   ├── CreatePage.tsx
    │   └── NotFoundPage.tsx
    └── lib/messages.ts            # 中文文案集中地(i18n 准备)
```

**Reference but do NOT modify:**
- `yixiang_fe/` — 旧前端,P3 完成后才删
- `yixiang_be/` — 后端,P0 完全不动

---

## Task 1: Bootstrap Vite + TypeScript Project

**Files:**
- Create: `yixiang-web/package.json`(自动生成)
- Create: `yixiang-web/vite.config.ts`
- Create: `yixiang-web/index.html`
- Create: `yixiang-web/tsconfig.json`
- Create: `yixiang-web/tsconfig.node.json`
- Create: `yixiang-web/.gitignore`
- Create: `yixiang-web/.editorconfig`

- [ ] **Step 1: 创建项目目录并初始化 Vite**

```bash
cd E:\code\yixiang
npm create vite@latest yixiang-web -- --template react-ts
cd yixiang-web
```

Expected: 控制台提示 "Done. Now run: cd yixiang-web && npm install"。**不**执行 `npm install` 这里,留到 Task 2 一起装齐依赖。

- [ ] **Step 2: 写入 vite.config.ts**

替换默认生成的 `yixiang-web/vite.config.ts` 内容为:

```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: 写入 tsconfig.json**

替换默认生成的 `yixiang-web/tsconfig.json` 内容为:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vite.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 写入 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 写入 .gitignore**

```
node_modules
dist
dist-ssr
*.local
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Test
coverage
```

- [ ] **Step 6: 写入 .editorconfig**

```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 7: 替换 index.html 默认标题**

替换 `yixiang-web/index.html` 中的 `<title>` 为 `<title>颐享 — 知识共享社区</title>`。

- [ ] **Step 8: Commit**

```bash
cd E:\code\yixiang
git add yixiang-web/
git commit -m "feat(web): bootstrap Vite + React + TS project for yixiang-web"
```

Expected: commit 成功,只追踪了配置文件,不含 node_modules。

---

## Task 2: Install Runtime Dependencies

**Files:**
- Modify: `yixiang-web/package.json`(通过 npm install 自动更新)

- [ ] **Step 1: 安装核心 React 生态依赖**

```bash
cd E:\code\yixiang\yixiang-web
npm install react@^18.3.1 react-dom@^18.3.1 react-router-dom@^6.26.0
```

- [ ] **Step 2: 安装 TanStack Query**

```bash
npm install @tanstack/react-query@^5.59.0 @tanstack/react-query-devtools@^5.59.0
```

- [ ] **Step 3: 安装 Radix primitives**

```bash
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-toast @radix-ui/react-slot @radix-ui/react-avatar @radix-ui/react-label
```

- [ ] **Step 4: 安装样式工具与图标**

```bash
npm install class-variance-authority@^0.7.1 tailwind-merge@^2.5.0 clsx@^2.1.1 lucide-react@^0.460.0
```

- [ ] **Step 5: 安装表单、通知、日期、Markdown、动画**

```bash
npm install sonner@^1.7.0 date-fns@^4.1.0 react-hook-form@^7.53.0 @hookform/resolvers@^3.9.0 zod@^3.23.0 react-markdown@^9.0.0 remark-gfm@^4.0.1 framer-motion@^11.0.0
```

- [ ] **Step 6: 验证 package.json 包含所有依赖**

Run:
```bash
cat yixiang-web/package.json
```

Expected: `dependencies` 字段包含上述全部包,版本号符号 `^`。

- [ ] **Step 7: Commit**

```bash
git add yixiang-web/package.json yixiang-web/package-lock.json
git commit -m "feat(web): install runtime dependencies"
```

---

## Task 3: Install Dev Dependencies & Toolchain

**Files:**
- Modify: `yixiang-web/package.json`
- Create: `yixiang-web/.prettierrc`
- Create: `yixiang-web/.eslintrc.cjs`
- Create: `yixiang-web/commitlint.config.cjs`
- Create: `yixiang-web/.husky/pre-commit`
- Create: `yixiang-web/.husky/commit-msg`

- [ ] **Step 1: 安装 Tailwind v4 与构建工具**

```bash
cd E:\code\yixiang\yixiang-web
npm install -D tailwindcss@^4.0.0 @tailwindcss/vite@^4.0.0
```

- [ ] **Step 2: 安装 ESLint + 插件**

```bash
npm install -D eslint@^9.0.0 @typescript-eslint/eslint-plugin@^8.0.0 @typescript-eslint/parser@^8.0.0 eslint-plugin-react-hooks@^5.0.0 eslint-plugin-react-refresh@^0.4.0 eslint-config-prettier@^9.1.0
```

- [ ] **Step 3: 安装 Prettier 与 git hooks 工具**

```bash
npm install -D prettier@^3.0.0 husky@^9.0.0 lint-staged@^15.0.0 @commitlint/cli@^19.0.0 @commitlint/config-conventional@^19.0.0
```

- [ ] **Step 4: 安装测试工具**

```bash
npm install -D vitest@^2.0.0 @testing-library/react@^16.0.0 @testing-library/jest-dom@^6.0.0 @testing-library/user-event@^14.0.0 jsdom@^25.0.0
```

- [ ] **Step 5: 创建 .prettierrc**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 6: 创建 .eslintrc.cjs**

```js
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'warn',
  },
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs'],
};
```

- [ ] **Step 7: 创建 commitlint.config.cjs**

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
```

- [ ] **Step 8: 修改 yixiang-web/package.json,加 scripts、lint-staged、type:module**

打开 `yixiang-web/package.json`,把 `scripts` 字段替换为:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "format": "prettier --write \"src/**/*.{ts,tsx,css,md,json}\"",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:run": "vitest run",
  "prepare": "husky"
}
```

在 `package.json` 末尾(`devDependencies` 后)增加:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{css,md,json}": ["prettier --write"]
}
```

- [ ] **Step 9: 初始化 husky**

```bash
npx husky init
```

Expected: 创建 `.husky/pre-commit` 默认内容 `npm test`。

- [ ] **Step 10: 替换 .husky/pre-commit 内容**

替换 `.husky/pre-commit` 为:

```sh
npx lint-staged
```

- [ ] **Step 11: 创建 .husky/commit-msg**

```sh
npx --no -- commitlint --edit "$1"
```

- [ ] **Step 12: 验证 lint 命令可跑**

```bash
npm run lint
```

Expected: 退出码 0,可能有 0 警告(因为目前只有 Vite 默认 `src/App.tsx` 等文件)。

- [ ] **Step 13: Commit**

```bash
git add yixiang-web/
git commit -m "feat(web): add lint, format, test, git hooks toolchain"
```

---

## Task 4: Configure Tailwind v4 Theme & Globals

**Files:**
- Delete: `yixiang-web/src/App.css`(Vite 默认,不用)
- Delete: `yixiang-web/src/index.css`(Vite 默认,要替换)
- Create: `yixiang-web/src/styles/globals.css`
- Create: `yixiang-web/src/styles/scrollbar.css`
- Modify: `yixiang-web/src/main.tsx`

- [ ] **Step 1: 删除 Vite 默认样式**

```bash
cd E:\code\yixiang\yixiang-web
rm src/App.css src/index.css
mkdir -p src/styles
```

(PowerShell 用 `Remove-Item src/App.css, src/index.css; New-Item -ItemType Directory -Path src/styles -Force`)

- [ ] **Step 2: 创建 src/styles/globals.css**

```css
@import "tailwindcss";
@import "./scrollbar.css";

@theme {
  --color-background: #f4f5f7;
  --color-foreground: #1c1e21;
  --color-card: #ffffff;
  --color-card-foreground: #1c1e21;
  --color-primary: #1677ff;
  --color-primary-foreground: #ffffff;
  --color-primary-hover: #0958d9;
  --color-primary-light: #e6f4ff;
  --color-secondary: #f5f5f5;
  --color-secondary-foreground: #1c1e21;
  --color-muted: #f0f0f0;
  --color-muted-foreground: #8c8c8c;
  --color-accent: #f0f2f5;
  --color-accent-foreground: #1c1e21;
  --color-destructive: #ff4d4f;
  --color-destructive-foreground: #ffffff;
  --color-success: #52c41a;
  --color-warning: #faad14;
  --color-border: #e8e8e8;
  --color-input: #e8e8e8;
  --color-ring: #1677ff;
  --color-sidebar-background: #ffffff;
  --color-sidebar-foreground: #1c1e21;
  --color-sidebar-border: #f0f0f0;
  --color-sidebar-active: #e6f4ff;
  --color-sidebar-active-foreground: #1677ff;

  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.625rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;

  --font-sans: "Inter", "PingFang SC", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}

* {
  border-color: var(--color-border);
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.card-base {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

- [ ] **Step 3: 创建 src/styles/scrollbar.css**

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
```

- [ ] **Step 4: 修改 src/main.tsx 引入 globals.css**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/app/App';
import '@/styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

(注意:`App` 暂时还不存在,下个 Task 才创建。如果 Vite 默认在 `src/App.tsx`,先保留它。)

- [ ] **Step 5: 验证 dev 启动**

```bash
npm run dev
```

打开浏览器 http://localhost:5173,验证页面背景是 `#f4f5f7` 浅灰。Ctrl+C 停掉。

- [ ] **Step 6: Commit**

```bash
git add yixiang-web/
git commit -m "feat(web): tailwind v4 theme tokens & globals"
```

---

## Task 5: Migrate Type Definitions from yixiang_fe

**Files:**
- Create: `yixiang-web/src/types/auth.ts`
- Create: `yixiang-web/src/types/profile.ts`
- Create: `yixiang-web/src/types/knowpost.ts`
- Create: `yixiang-web/src/types/search.ts`
- Create: `yixiang-web/src/types/content.ts`
- Create: `yixiang-web/src/types/relation.ts`
- Create: `yixiang-web/src/types/notification.ts`
- Create: `yixiang-web/src/types/favorite.ts`
- Create: `yixiang-web/src/types/circle.ts`
- Create: `yixiang-web/src/types/api.ts`

- [ ] **Step 1: 创建 types 目录**

```bash
mkdir -p yixiang-web/src/types
```

- [ ] **Step 2: 复制现有类型文件作为基线**

源:`yixiang_fe/src/types/*.ts`。逐个 copy 到 `yixiang-web/src/types/`。

```bash
# PowerShell
Copy-Item E:\code\yixiang\yixiang_fe\src\types\*.ts E:\code\yixiang\yixiang-web\src\types\
```

- [ ] **Step 3: 创建 src/types/api.ts(统一 API 错误与分页类型)**

```ts
export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export interface PageRequest {
  cursor?: string;
  limit?: number;
}
```

- [ ] **Step 4: 在 src/types/knowpost.ts 的 FeedItem 上加新字段(P1 后端会补齐)**

打开 `yixiang-web/src/types/knowpost.ts`,在 `FeedItem` interface 末尾增加:

```ts
// 来自 P1 后端缺口补齐
recentLikers?: UserBrief[];
likerSummary?: string;
isFollowingAuthor?: boolean;
```

如果 `UserBrief` 尚未定义,在文件顶部添加:

```ts
export interface UserBrief {
  id: string;
  nickname: string;
  avatar: string;
  verified?: boolean;
  roleTitle?: string;
}
```

- [ ] **Step 5: 在 src/types/profile.ts 的 UserProfile 上加新字段**

打开 `yixiang-web/src/types/profile.ts`,在 `UserProfile` interface 末尾增加:

```ts
verified?: boolean;
roleTitle?: string;
bannerImage?: string;
```

- [ ] **Step 6: 创建 notification.ts / favorite.ts / circle.ts(如不存在)**

如果旧 `yixiang_fe` 已有,跳过。否则创建最小占位:

```ts
// src/types/notification.ts
export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorNickname: string;
  actorAvatar: string;
  targetType: 'POST' | 'COMMENT' | 'USER';
  targetId: string;
  text: string;
  unread: boolean;
  createdAt: string;
}
```

```ts
// src/types/favorite.ts
import type { FeedItem } from './knowpost';

export interface FavoritesResponse {
  items: FeedItem[];
  nextCursor: string | null;
}
```

```ts
// src/types/circle.ts
export type CircleVisibility = 'PUBLIC' | 'PRIVATE';

export interface Circle {
  id: string;
  name: string;
  avatar: string;
  banner?: string;
  description: string;
  memberCount: number;
  postCount: number;
  visibility: CircleVisibility;
  isMember: boolean;
  createdAt: string;
}
```

- [ ] **Step 7: 运行 typecheck 验证**

```bash
cd E:\code\yixiang\yixiang-web
npm run typecheck
```

Expected: 退出码 0(可能有未使用类型的警告,忽略)。

- [ ] **Step 8: Commit**

```bash
git add yixiang-web/src/types/
git commit -m "feat(web): migrate type definitions from yixiang_fe"
```

---

## Task 6: API Client with JWT Auto-Refresh (TDD)

**Files:**
- Create: `yixiang-web/src/lib/env.ts`
- Create: `yixiang-web/src/lib/apiClient.ts`
- Test: `yixiang-web/src/lib/apiClient.test.ts`
- Create: `yixiang-web/vitest.config.ts`

- [ ] **Step 1: 创建 vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 2: 创建 vitest.setup.ts**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: 创建 src/lib/env.ts**

```ts
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  isDev: import.meta.env.DEV,
};
```

- [ ] **Step 4: 写失败测试 src/lib/apiClient.test.ts**

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { apiFetch, ApiError, setTokenStore } from './apiClient';

const fetchMock = vi.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

describe('apiFetch', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    setTokenStore({
      getAccessToken: () => 'access-1',
      getRefreshToken: () => 'refresh-1',
      onTokensUpdated: vi.fn(),
      onAuthFailed: vi.fn(),
    });
  });

  it('attaches Authorization header from token store', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    await apiFetch<{ ok: boolean }>('/test');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer access-1',
    });
  });

  it('throws ApiError with parsed body on 4xx', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ code: 'NOT_FOUND', message: '资源不存在' }),
        { status: 404 },
      ),
    );
    await expect(apiFetch('/missing')).rejects.toBeInstanceOf(ApiError);
  });

  it('refreshes token on 401 and retries once', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ accessToken: 'access-2', refreshToken: 'refresh-2', accessExpiresAt: 999 }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    const result = await apiFetch<{ ok: boolean }>('/test');
    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('calls onAuthFailed if refresh also returns 401', async () => {
    const onAuthFailed = vi.fn();
    setTokenStore({
      getAccessToken: () => 'access-1',
      getRefreshToken: () => 'refresh-1',
      onTokensUpdated: vi.fn(),
      onAuthFailed,
    });
    fetchMock
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }));

    await expect(apiFetch('/test')).rejects.toBeInstanceOf(ApiError);
    expect(onAuthFailed).toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: 运行测试,确认失败**

```bash
cd E:\code\yixiang\yixiang-web
npx vitest run src/lib/apiClient.test.ts
```

Expected: FAIL,提示 `apiFetch`、`ApiError`、`setTokenStore` 未定义。

- [ ] **Step 6: 实现 src/lib/apiClient.ts**

```ts
import { env } from './env';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface TokenStore {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onTokensUpdated: (tokens: { accessToken: string; refreshToken: string; accessExpiresAt: number }) => void;
  onAuthFailed: () => void;
}

let tokenStore: TokenStore | null = null;

export function setTokenStore(store: TokenStore): void {
  tokenStore = store;
}

interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!tokenStore) return false;
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;
  const resp = await fetch(`${env.apiBaseUrl}/auth/token/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  tokenStore.onTokensUpdated(data);
  return true;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const url = path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`;

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };
    if (!skipAuth && tokenStore) {
      const token = tokenStore.getAccessToken();
      if (token) h.Authorization = `Bearer ${token}`;
    }
    return h;
  };

  let resp = await fetch(url, { ...rest, headers: buildHeaders() });

  if (resp.status === 401 && !skipAuth) {
    const ok = await refreshAccessToken();
    if (ok) {
      resp = await fetch(url, { ...rest, headers: buildHeaders() });
    }
    if (resp.status === 401) {
      tokenStore?.onAuthFailed();
    }
  }

  if (!resp.ok) {
    let body: { code?: string; message?: string; details?: unknown } = {};
    try {
      body = await resp.json();
    } catch {
      /* non-JSON */
    }
    throw new ApiError(body.code ?? 'UNKNOWN', body.message ?? resp.statusText, resp.status, body.details);
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}
```

- [ ] **Step 7: 运行测试,确认通过**

```bash
npx vitest run src/lib/apiClient.test.ts
```

Expected: PASS,4 个用例全部通过。

- [ ] **Step 8: Commit**

```bash
git add yixiang-web/src/lib/ yixiang-web/vitest.config.ts yixiang-web/vitest.setup.ts
git commit -m "feat(web): api client with JWT auto-refresh + tests"
```

---

## Task 7: Migrate Service Modules

**Files:**
- Create: `yixiang-web/src/services/authService.ts`
- Create: `yixiang-web/src/services/knowpostService.ts`
- Create: `yixiang-web/src/services/profileService.ts`
- Create: `yixiang-web/src/services/relationService.ts`
- Create: `yixiang-web/src/services/searchService.ts`
- Create: `yixiang-web/src/services/notificationService.ts`
- Create: `yixiang-web/src/services/favoriteService.ts`
- Create: `yixiang-web/src/services/circleService.ts`

- [ ] **Step 1: 复制旧服务文件作为基线**

```bash
# PowerShell
mkdir E:\code\yixiang\yixiang-web\src\services
Copy-Item E:\code\yixiang\yixiang_fe\src\services\*.ts E:\code\yixiang\yixiang-web\src\services\
```

- [ ] **Step 2: 全局替换旧服务里的 apiClient 引入路径**

打开每个 service 文件,把 `import { apiFetch } from '../apiClient'` (或类似)替换为:

```ts
import { apiFetch } from '@/lib/apiClient';
```

如果旧 service 用了 `ApiError`,同样改为 `import { ApiError } from '@/lib/apiClient'`。

- [ ] **Step 3: 全局替换类型引入路径**

把 `import type { ... } from '../types/...'` 替换为 `import type { ... } from '@/types/...'`。

- [ ] **Step 4: 写入 authService.ts(参考模板)**

如果旧 authService 不完整,用以下完整版替换 `src/services/authService.ts`:

```ts
import { apiFetch } from '@/lib/apiClient';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthUserResponse,
  PasswordResetRequest,
  SendCodeRequest,
} from '@/types/auth';

export const authService = {
  login: (body: LoginRequest) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  register: (body: RegisterRequest) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  refresh: (refreshToken: string) =>
    apiFetch<AuthResponse>('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    }),

  logout: (refreshToken: string) =>
    apiFetch<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  me: () => apiFetch<AuthUserResponse>('/auth/me'),

  sendVerificationCode: (body: SendCodeRequest) =>
    apiFetch<void>('/auth/code/send', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),

  resetPassword: (body: PasswordResetRequest) =>
    apiFetch<void>('/auth/password/reset', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
};
```

- [ ] **Step 5: 运行 typecheck**

```bash
cd E:\code\yixiang\yixiang-web
npm run typecheck
```

如果有错误,大概率是某些类型字段还未迁移完整。逐一对照旧 `yixiang_fe/src/types/` 补齐 import 与字段。

- [ ] **Step 6: Commit**

```bash
git add yixiang-web/src/services/
git commit -m "feat(web): migrate service modules from yixiang_fe"
```

---

## Task 8: AuthContext with Token Management (TDD)

**Files:**
- Create: `yixiang-web/src/context/AuthContext.tsx`
- Test: `yixiang-web/src/context/AuthContext.test.tsx`

- [ ] **Step 1: 写失败测试 src/context/AuthContext.test.tsx**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(async () => ({
      accessToken: 'at-1',
      refreshToken: 'rt-1',
      accessExpiresAt: Date.now() + 10_000,
      user: { id: 'u1', nickname: 'tester', avatar: '' },
    })),
    logout: vi.fn(async () => undefined),
    me: vi.fn(async () => ({ id: 'u1', nickname: 'tester', avatar: '' })),
  },
}));

function Consumer() {
  const { user, login, logout, isAuthenticated } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="name">{user?.nickname ?? '-'}</span>
      <button onClick={() => login({ identifier: 'a', password: 'b' })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('starts unauthenticated when no tokens in storage', () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId('auth')).toHaveTextContent('no');
  });

  it('becomes authenticated after login', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await act(async () => {
      screen.getByText('login').click();
    });
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('yes'));
    expect(screen.getByTestId('name')).toHaveTextContent('tester');
  });

  it('clears state after logout', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );
    await act(async () => {
      screen.getByText('login').click();
    });
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('yes'));
    await act(async () => {
      screen.getByText('logout').click();
    });
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('no'));
  });
});
```

- [ ] **Step 2: 运行测试,确认失败**

```bash
npx vitest run src/context/AuthContext.test.tsx
```

Expected: FAIL,`AuthProvider`、`useAuth` 未定义。

- [ ] **Step 3: 实现 src/context/AuthContext.tsx**

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '@/services/authService';
import { setTokenStore } from '@/lib/apiClient';
import type { AuthResponse, LoginRequest, RegisterRequest, AuthUserResponse } from '@/types/auth';

interface TokensState {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
}

interface AuthState {
  user: AuthUserResponse | null;
  tokens: TokensState | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const STORAGE_KEY = 'yixiang_auth_tokens';
const REFRESH_BEFORE_MS = 5_000;
const REFRESH_INTERVAL_MS = 60_000;

const AuthContext = createContext<AuthState | null>(null);

function readStored(): { tokens: TokensState | null; user: AuthUserResponse | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tokens: null, user: null };
    return JSON.parse(raw);
  } catch {
    return { tokens: null, user: null };
  }
}

function writeStored(tokens: TokensState | null, user: AuthUserResponse | null): void {
  if (!tokens) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tokens, user }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readStored();
  const [tokens, setTokens] = useState<TokensState | null>(initial.tokens);
  const [user, setUser] = useState<AuthUserResponse | null>(initial.user);
  const [isLoading, setIsLoading] = useState(false);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;

  const applyAuth = useCallback((resp: AuthResponse) => {
    const nextTokens: TokensState = {
      accessToken: resp.accessToken,
      refreshToken: resp.refreshToken,
      accessExpiresAt: resp.accessExpiresAt,
    };
    setTokens(nextTokens);
    setUser(resp.user);
    writeStored(nextTokens, resp.user);
  }, []);

  const clearAuth = useCallback(() => {
    setTokens(null);
    setUser(null);
    writeStored(null, null);
  }, []);

  const login = useCallback(
    async (body: LoginRequest) => {
      setIsLoading(true);
      try {
        const resp = await authService.login(body);
        applyAuth(resp);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuth],
  );

  const register = useCallback(
    async (body: RegisterRequest) => {
      setIsLoading(true);
      try {
        const resp = await authService.register(body);
        applyAuth(resp);
      } finally {
        setIsLoading(false);
      }
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    const rt = tokensRef.current?.refreshToken;
    try {
      if (rt) await authService.logout(rt);
    } catch {
      /* logout 失败也清理本地 */
    }
    clearAuth();
  }, [clearAuth]);

  const reloadUser = useCallback(async () => {
    if (!tokensRef.current) return;
    const me = await authService.me();
    setUser(me);
    writeStored(tokensRef.current, me);
  }, []);

  // 配置 apiClient 的 token store(单向适配)
  useEffect(() => {
    setTokenStore({
      getAccessToken: () => tokensRef.current?.accessToken ?? null,
      getRefreshToken: () => tokensRef.current?.refreshToken ?? null,
      onTokensUpdated: (next) => {
        const updated: TokensState = {
          accessToken: next.accessToken,
          refreshToken: next.refreshToken,
          accessExpiresAt: next.accessExpiresAt,
        };
        setTokens(updated);
        writeStored(updated, user);
      },
      onAuthFailed: () => {
        clearAuth();
      },
    });
  }, [user, clearAuth]);

  // 60s 轮询自动刷新
  useEffect(() => {
    if (!tokens) return;
    const timer = setInterval(() => {
      if (!tokensRef.current) return;
      const remaining = tokensRef.current.accessExpiresAt - Date.now();
      if (remaining < REFRESH_BEFORE_MS) {
        authService
          .refresh(tokensRef.current.refreshToken)
          .then((resp) => applyAuth(resp))
          .catch(() => clearAuth());
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [tokens, applyAuth, clearAuth]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      tokens,
      isAuthenticated: !!tokens && !!user,
      isLoading,
      login,
      register,
      logout,
      reloadUser,
    }),
    [user, tokens, isLoading, login, register, logout, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 4: 运行测试,确认通过**

```bash
npx vitest run src/context/AuthContext.test.tsx
```

Expected: PASS,3 个用例全部通过。

- [ ] **Step 5: Commit**

```bash
git add yixiang-web/src/context/
git commit -m "feat(web): AuthContext with token persistence and auto-refresh"
```

---

## Task 9: QueryClient Setup

**Files:**
- Create: `yixiang-web/src/lib/queryClient.ts`

- [ ] **Step 1: 创建 src/lib/queryClient.ts**

```ts
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './apiClient';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add yixiang-web/src/lib/queryClient.ts
git commit -m "feat(web): TanStack QueryClient config"
```

---

## Task 10: App Providers Composition

**Files:**
- Create: `yixiang-web/src/app/providers.tsx`
- Create: `yixiang-web/src/lib/utils.ts`

- [ ] **Step 1: 创建 src/lib/utils.ts(classnames 合并工具)**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: 创建 src/app/providers.tsx**

```tsx
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/context/AuthContext';
import { env } from '@/lib/env';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
          <Toaster richColors closeButton position="top-center" />
        </AuthProvider>
      </BrowserRouter>
      {env.isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add yixiang-web/src/app/providers.tsx yixiang-web/src/lib/utils.ts
git commit -m "feat(web): app providers composition (Query + Router + Auth + Toaster)"
```

---

## Task 11: ProtectedRoute Component (TDD)

**Files:**
- Create: `yixiang-web/src/app/ProtectedRoute.tsx`
- Test: `yixiang-web/src/app/ProtectedRoute.test.tsx`

- [ ] **Step 1: 写失败测试 src/app/ProtectedRoute.test.tsx**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

const useAuthMock = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

function renderRoute(authed: boolean, path = '/secret') {
  useAuthMock.mockReturnValue({ isAuthenticated: authed });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>secret content</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('renders children when authenticated', () => {
    renderRoute(true);
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderRoute(false);
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret content')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试,确认失败**

```bash
npx vitest run src/app/ProtectedRoute.test.tsx
```

Expected: FAIL,`ProtectedRoute` 未定义。

- [ ] **Step 3: 实现 src/app/ProtectedRoute.tsx**

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
```

- [ ] **Step 4: 运行测试,确认通过**

```bash
npx vitest run src/app/ProtectedRoute.test.tsx
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add yixiang-web/src/app/
git commit -m "feat(web): ProtectedRoute redirects unauthenticated users"
```

---

## Task 12: shadcn UI Primitives — Button & Helpers

**Files:**
- Create: `yixiang-web/src/components/ui/button.tsx`

- [ ] **Step 1: 创建 src/components/ui/button.tsx(shadcn 标准版)**

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm',
        secondary:
          'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[#d6e8ff]',
        ghost: 'hover:bg-[var(--color-muted)] text-[var(--color-foreground)]',
        outline:
          'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)] text-[var(--color-foreground)]',
        destructive:
          'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[#e63b3d]',
        link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
```

- [ ] **Step 2: Commit**

```bash
git add yixiang-web/src/components/ui/button.tsx
git commit -m "feat(web): shadcn Button primitive"
```

---

## Task 13: shadcn UI Primitives — Dialog, Tabs, Tooltip, Popover, Select, DropdownMenu

**Files:**
- Create: `yixiang-web/src/components/ui/dialog.tsx`
- Create: `yixiang-web/src/components/ui/tabs.tsx`
- Create: `yixiang-web/src/components/ui/tooltip.tsx`
- Create: `yixiang-web/src/components/ui/popover.tsx`
- Create: `yixiang-web/src/components/ui/select.tsx`
- Create: `yixiang-web/src/components/ui/dropdown-menu.tsx`

- [ ] **Step 1: 创建 src/components/ui/dialog.tsx**

```tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-lg rounded-2xl',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 text-left', className)} {...props} />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--color-muted-foreground)]', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
```

- [ ] **Step 2: 创建 src/components/ui/tabs.tsx**

```tsx
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('inline-flex h-10 items-center justify-start gap-8 border-b border-[var(--color-border)]', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center justify-center whitespace-nowrap pb-2 text-[15px] font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] data-[state=active]:text-[var(--color-primary)] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-1px] data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3px] data-[state=active]:after:bg-[var(--color-primary)] data-[state=active]:after:rounded-t-full',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-4 focus-visible:outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

- [ ] **Step 3: 创建 src/components/ui/tooltip.tsx**

```tsx
import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md bg-[var(--color-foreground)] px-3 py-1.5 text-xs text-white shadow-md',
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

- [ ] **Step 4: 创建 src/components/ui/popover.tsx**

```tsx
import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-md outline-none',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };
```

- [ ] **Step 5: 创建 src/components/ui/select.tsx**

```tsx
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        'z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-card)] shadow-md',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-[var(--color-muted)]',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem };
```

- [ ] **Step 6: 创建 src/components/ui/dropdown-menu.tsx**

```tsx
import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-md',
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-[var(--color-muted)]',
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('my-1 h-px bg-[var(--color-border)]', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
```

- [ ] **Step 7: 运行 typecheck**

```bash
npm run typecheck
```

Expected: 退出码 0。

- [ ] **Step 8: Commit**

```bash
git add yixiang-web/src/components/ui/
git commit -m "feat(web): shadcn primitives - dialog/tabs/tooltip/popover/select/dropdown"
```

---

## Task 14: shadcn UI Primitives — Avatar, Badge, Input, Textarea, Skeleton

**Files:**
- Create: `yixiang-web/src/components/ui/avatar.tsx`
- Create: `yixiang-web/src/components/ui/badge.tsx`
- Create: `yixiang-web/src/components/ui/input.tsx`
- Create: `yixiang-web/src/components/ui/textarea.tsx`
- Create: `yixiang-web/src/components/ui/skeleton.tsx`

- [ ] **Step 1: 创建 src/components/ui/avatar.tsx**

```tsx
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex h-full w-full items-center justify-center bg-[var(--color-muted)] text-sm', className)}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
```

- [ ] **Step 2: 创建 src/components/ui/badge.tsx**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
        secondary: 'bg-[var(--color-muted)] text-[var(--color-foreground)]',
        destructive: 'bg-[var(--color-destructive)] text-white',
        outline: 'border border-[var(--color-border)] text-[var(--color-foreground)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
```

- [ ] **Step 3: 创建 src/components/ui/input.tsx**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
```

- [ ] **Step 4: 创建 src/components/ui/textarea.tsx**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
```

- [ ] **Step 5: 创建 src/components/ui/skeleton.tsx**

```tsx
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[var(--color-muted)]', className)}
      {...props}
    />
  );
}
```

- [ ] **Step 6: 运行 typecheck**

```bash
npm run typecheck
```

Expected: 退出码 0。

- [ ] **Step 7: Commit**

```bash
git add yixiang-web/src/components/ui/
git commit -m "feat(web): shadcn primitives - avatar/badge/input/textarea/skeleton"
```

---

## Task 15: Common Components — EmptyState

**Files:**
- Create: `yixiang-web/src/components/common/EmptyState.tsx`

- [ ] **Step 1: 创建 src/components/common/EmptyState.tsx**

```tsx
import type { ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-muted)]">
        <Icon className="h-8 w-8 text-[var(--color-muted-foreground)]" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">{title}</h3>
      {description && (
        <p className="mb-6 max-w-sm text-sm text-[var(--color-muted-foreground)]">{description}</p>
      )}
      {action}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add yixiang-web/src/components/common/EmptyState.tsx
git commit -m "feat(web): EmptyState common component"
```

---

## Task 16: Common Components — LoadingSkeleton Variants

**Files:**
- Create: `yixiang-web/src/components/common/LoadingSkeleton.tsx`

- [ ] **Step 1: 创建 src/components/common/LoadingSkeleton.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function FeedCardSkeleton() {
  return (
    <article className="card-base mb-4 p-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-[90px] w-[140px] rounded-xl" />
      </div>
    </article>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
}

export function CircleCardSkeleton() {
  return (
    <div className="card-base p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add yixiang-web/src/components/common/LoadingSkeleton.tsx
git commit -m "feat(web): LoadingSkeleton variants"
```

---

## Task 17: Common Components — ErrorBoundary

**Files:**
- Create: `yixiang-web/src/components/common/ErrorBoundary.tsx`

- [ ] **Step 1: 创建 src/components/common/ErrorBoundary.tsx**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-[var(--color-destructive)]" />
          <h3 className="mb-1 text-lg font-semibold">出错了</h3>
          <p className="mb-6 max-w-md text-sm text-[var(--color-muted-foreground)]">
            {this.state.error.message || '页面加载时发生未知错误'}
          </p>
          <Button onClick={this.reset}>重试</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add yixiang-web/src/components/common/ErrorBoundary.tsx
git commit -m "feat(web): ErrorBoundary common component"
```

---

## Task 18: Common Components — InfiniteList (TDD)

**Files:**
- Create: `yixiang-web/src/components/common/InfiniteList.tsx`
- Test: `yixiang-web/src/components/common/InfiniteList.test.tsx`

- [ ] **Step 1: 写失败测试 src/components/common/InfiniteList.test.tsx**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InfiniteList } from './InfiniteList';

class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds: number[] = [];
}

(globalThis as any).IntersectionObserver = IntersectionObserverMock;

describe('InfiniteList', () => {
  it('renders all current items', () => {
    render(
      <InfiniteList
        items={['a', 'b', 'c']}
        getKey={(s) => s}
        hasMore={false}
        isLoading={false}
        onLoadMore={() => undefined}
        renderItem={(s) => <div>{s}</div>}
      />,
    );
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('c')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <InfiniteList
        items={[]}
        getKey={(s: string) => s}
        hasMore
        isLoading
        onLoadMore={() => undefined}
        renderItem={(s) => <div>{s}</div>}
      />,
    );
    expect(screen.getByTestId('infinite-list-loading')).toBeInTheDocument();
  });

  it('shows empty state when no items and not loading and no more', () => {
    render(
      <InfiniteList
        items={[]}
        getKey={(s: string) => s}
        hasMore={false}
        isLoading={false}
        onLoadMore={() => undefined}
        renderItem={(s) => <div>{s}</div>}
        emptyState={<div data-testid="empty">没有数据</div>}
      />,
    );
    expect(screen.getByTestId('empty')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试,确认失败**

```bash
npx vitest run src/components/common/InfiniteList.test.tsx
```

Expected: FAIL,`InfiniteList` 未定义。

- [ ] **Step 3: 实现 src/components/common/InfiniteList.tsx**

```tsx
import { useEffect, useRef, type ReactNode } from 'react';

export interface InfiniteListProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  loadingIndicator?: ReactNode;
  endIndicator?: ReactNode;
  rootMargin?: string;
}

export function InfiniteList<T>({
  items,
  getKey,
  hasMore,
  isLoading,
  onLoadMore,
  renderItem,
  emptyState,
  loadingIndicator,
  endIndicator,
  rootMargin = '200px',
}: InfiniteListProps<T>) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onLoadMore();
          }
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, rootMargin]);

  if (items.length === 0 && !isLoading && !hasMore) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {items.map((item, i) => (
        <div key={getKey(item)}>{renderItem(item, i)}</div>
      ))}
      {isLoading && (
        <div data-testid="infinite-list-loading" className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
          {loadingIndicator ?? '加载中...'}
        </div>
      )}
      {!hasMore && items.length > 0 && (
        <div className="py-6 text-center text-xs text-[var(--color-muted-foreground)]">
          {endIndicator ?? '— 到底啦 —'}
        </div>
      )}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
    </>
  );
}
```

- [ ] **Step 4: 运行测试,确认通过**

```bash
npx vitest run src/components/common/InfiniteList.test.tsx
```

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add yixiang-web/src/components/common/InfiniteList.tsx yixiang-web/src/components/common/InfiniteList.test.tsx
git commit -m "feat(web): InfiniteList common component with IntersectionObserver"
```

---

## Task 19: Layout — Header

**Files:**
- Create: `yixiang-web/src/components/layout/Header.tsx`

- [ ] **Step 1: 创建 src/components/layout/Header.tsx**

参考原型 `原型设计图/preview/src/main.jsx` 第 69-118 行的 `<header>` 结构。

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Bell, Mail, ChevronDown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[var(--color-border)] bg-white px-6">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="rounded-lg bg-[var(--color-primary)] p-1 text-white">
              <TrendingUp size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">颐享</span>
          </Link>

          <div
            className="relative flex w-[420px] cursor-pointer items-center"
            onClick={() => navigate('/search')}
          >
            <Search className="absolute left-4 text-[var(--color-muted-foreground)]" size={18} />
            <input
              type="text"
              readOnly
              placeholder="搜索帖子、用户、话题"
              className="h-10 w-full rounded-full bg-[var(--color-muted)] pl-11 pr-4 text-sm placeholder-[var(--color-muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Button onClick={() => navigate('/create')} className="rounded-full">
            <Plus size={16} /> 发布
          </Button>

          <div className="flex items-center gap-5 text-[var(--color-muted-foreground)]">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative transition-colors hover:text-[var(--color-primary)]"
              aria-label="通知"
            >
              <Bell size={22} />
            </button>
            <button
              type="button"
              onClick={() => toast.info('私信功能即将上线')}
              className="transition-colors hover:text-[var(--color-primary)]"
              aria-label="私信"
            >
              <Mail size={22} />
            </button>
          </div>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-[var(--color-muted)]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.nickname} />
                  <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.nickname}</span>
                <ChevronDown size={16} className="text-[var(--color-muted-foreground)]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>我的主页</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/drafts')}>草稿箱</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>设置</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void logout().then(() => navigate('/login'))}>
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add yixiang-web/src/components/layout/Header.tsx
git commit -m "feat(web): Header layout component"
```

---

## Task 20: Layout — Sidebar

**Files:**
- Create: `yixiang-web/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: 创建 src/components/layout/Sidebar.tsx**

参考原型 `main.jsx` 第 123-192 行 `<aside>` 结构。

```tsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, UserPlus, Users, Flame, Hash, Star,
  User, Bell, Mail, FileEdit, Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  badge?: number;
  onClick?: () => void;
}

export function Sidebar({ unreadCount = 0 }: { unreadCount?: number }) {
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/following', icon: UserPlus, label: '关注' },
    { to: '/circles', icon: Users, label: '圈子' },
    { to: '/hot', icon: Flame, label: '热门' },
    { to: '/topics', icon: Hash, label: '话题' },
    { to: '/collections', icon: Star, label: '收藏' },
    { to: '/profile', icon: User, label: '我的主页' },
    { to: '/notifications', icon: Bell, label: '通知', badge: unreadCount },
    { to: '#dm', icon: Mail, label: '私信', onClick: () => toast.info('私信功能即将上线') },
  ];

  const userItems: NavItem[] = [
    { to: '/drafts', icon: FileEdit, label: '草稿箱' },
    { to: '/settings', icon: Settings, label: '设置' },
  ];

  return (
    <aside className="sticky top-[88px] flex h-[calc(100vh-88px)] w-[220px] shrink-0 flex-col overflow-y-auto pb-6 no-scrollbar">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          if (item.onClick) {
            return (
              <button
                key={item.to}
                type="button"
                onClick={item.onClick}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="text-[15px]">{item.label}</span>
                </div>
              </button>
            );
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 transition-colors',
                  isActive
                    ? 'bg-[var(--color-sidebar-active)] font-semibold text-[var(--color-sidebar-active-foreground)]'
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[15px]">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="rounded-full bg-[var(--color-destructive)] px-2 py-0.5 text-[11px] font-bold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="my-4 mx-4 border-t border-[var(--color-border)]" />

      <nav className="flex flex-col gap-1">
        {userItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
                isActive
                  ? 'bg-[var(--color-sidebar-active)] font-semibold text-[var(--color-sidebar-active-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
              )
            }
          >
            <item.icon size={20} />
            <span className="text-[15px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 mx-2 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <h4 className="mb-1 text-[15px] font-semibold">加入圈子,获取更多观点</h4>
        <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">与同道高手一起交流学习</p>
        <button
          type="button"
          onClick={() => navigate('/circles')}
          className="w-full rounded-xl bg-[var(--color-primary)] py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          发现圈子
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add yixiang-web/src/components/layout/Sidebar.tsx
git commit -m "feat(web): Sidebar layout component (1:1 match prototype)"
```

---

## Task 21: Layout — AppLayout + PageShell

**Files:**
- Create: `yixiang-web/src/components/layout/AppLayout.tsx`
- Create: `yixiang-web/src/components/layout/PageShell.tsx`

- [ ] **Step 1: 创建 src/components/layout/AppLayout.tsx**

```tsx
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto flex max-w-[1280px] items-start gap-6 px-4 pb-12 pt-6">
        <Sidebar />
        <div className="flex flex-1 gap-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 创建 src/components/layout/PageShell.tsx**

```tsx
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageShellProps {
  children: ReactNode;
  rightRail?: ReactNode;
  contentClassName?: string;
}

export function PageShell({ children, rightRail, contentClassName }: PageShellProps) {
  return (
    <>
      <section className={cn('flex-1 max-w-[620px]', contentClassName)}>{children}</section>
      {rightRail && (
        <aside className="sticky top-[88px] flex w-[320px] shrink-0 flex-col gap-4">{rightRail}</aside>
      )}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add yixiang-web/src/components/layout/
git commit -m "feat(web): AppLayout + PageShell"
```

---

## Task 22: Routes & 12 Page Stubs

**Files:**
- Create: `yixiang-web/src/app/App.tsx`
- Create: `yixiang-web/src/app/routes.tsx`
- Create: `yixiang-web/src/pages/HomePage.tsx`
- Create: `yixiang-web/src/pages/LoginPage.tsx`
- Create: `yixiang-web/src/pages/RegisterPage.tsx`
- Create: `yixiang-web/src/pages/ProfilePage.tsx`
- Create: `yixiang-web/src/pages/FollowListPage.tsx`
- Create: `yixiang-web/src/pages/NotificationPage.tsx`
- Create: `yixiang-web/src/pages/CollectionsPage.tsx`
- Create: `yixiang-web/src/pages/SearchPage.tsx`
- Create: `yixiang-web/src/pages/CircleSquarePage.tsx`
- Create: `yixiang-web/src/pages/CircleDetailPage.tsx`
- Create: `yixiang-web/src/pages/PostDetailPage.tsx`
- Create: `yixiang-web/src/pages/CreatePage.tsx`
- Create: `yixiang-web/src/pages/NotFoundPage.tsx`

- [ ] **Step 1: 创建 12 个 page stub(每个用同样模板)**

每个文件按以下模板,改 `[PAGE_NAME]` 与 `[ROUTE]`:

```tsx
// src/pages/HomePage.tsx 示例
import { PageShell } from '@/components/layout/PageShell';

export default function HomePage() {
  return (
    <PageShell>
      <div className="card-base p-6">
        <h1 className="text-xl font-bold">首页(Home)— P0 stub</h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Phase 2 实施时替换为原型完整内容。
        </p>
      </div>
    </PageShell>
  );
}
```

按上述模板分别创建剩余 11 个 stub:`LoginPage.tsx`(登录)、`RegisterPage.tsx`(注册)、`ProfilePage.tsx`(个人主页)、`FollowListPage.tsx`(关注/粉丝)、`NotificationPage.tsx`(通知中心)、`CollectionsPage.tsx`(我的收藏)、`SearchPage.tsx`(搜索)、`CircleSquarePage.tsx`(圈子广场)、`CircleDetailPage.tsx`(圈子详情)、`PostDetailPage.tsx`(帖子详情)、`CreatePage.tsx`(发布帖子)。Login/Register 模板里去掉 `<PageShell>` 包装(它们是全屏页),只渲染卡片。

NotFoundPage:

```tsx
// src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center text-center">
      <h1 className="mb-2 text-7xl font-bold text-[var(--color-primary)]">404</h1>
      <p className="mb-6 text-[var(--color-muted-foreground)]">页面不存在或已被删除</p>
      <Button asChild>
        <Link to="/">回到首页</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: 创建 src/app/routes.tsx**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import HomePage from '@/pages/HomePage';
import ProfilePage from '@/pages/ProfilePage';
import FollowListPage from '@/pages/FollowListPage';
import NotificationPage from '@/pages/NotificationPage';
import CollectionsPage from '@/pages/CollectionsPage';
import SearchPage from '@/pages/SearchPage';
import CircleSquarePage from '@/pages/CircleSquarePage';
import CircleDetailPage from '@/pages/CircleDetailPage';
import PostDetailPage from '@/pages/PostDetailPage';
import CreatePage from '@/pages/CreatePage';
import NotFoundPage from '@/pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppLayout />}>
        {/* 公开路由 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/hot" element={<HomePage />} />
        <Route path="/topics" element={<HomePage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/circles" element={<CircleSquarePage />} />
        <Route path="/circles/:id" element={<CircleDetailPage />} />
        <Route path="/users/:id" element={<ProfilePage />} />

        {/* 需要登录 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/following" element={<HomePage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:tab" element={<ProfilePage />} />
          <Route path="/followlist" element={<FollowListPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/drafts" element={<CreatePage />} />
          <Route path="/settings" element={<CreatePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 3: 创建 src/app/App.tsx**

```tsx
import { AppProviders } from './providers';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
```

- [ ] **Step 4: 运行 typecheck**

```bash
npm run typecheck
```

Expected: 退出码 0。

- [ ] **Step 5: Commit**

```bash
git add yixiang-web/src/app/ yixiang-web/src/pages/
git commit -m "feat(web): routes + 12 page stubs + app entry"
```

---

## Task 23: SSE Hook (lib/sse.ts)

**Files:**
- Create: `yixiang-web/src/lib/sse.ts`

- [ ] **Step 1: 创建 src/lib/sse.ts**

```ts
import { useEffect, useRef } from 'react';
import { env } from './env';

export interface UseSSEOptions {
  url: string;
  withCredentials?: boolean;
  enabled?: boolean;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onOpen?: () => void;
}

export function useSSE({ url, withCredentials = false, enabled = true, onMessage, onError, onOpen }: UseSSEOptions) {
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const full = url.startsWith('http') ? url : `${env.apiBaseUrl}${url}`;
    const source = new EventSource(full, { withCredentials });
    sourceRef.current = source;
    if (onMessage) source.onmessage = onMessage;
    if (onError) source.onerror = onError;
    if (onOpen) source.onopen = onOpen;
    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [url, withCredentials, enabled, onMessage, onError, onOpen]);

  return sourceRef;
}
```

- [ ] **Step 2: Commit**

```bash
git add yixiang-web/src/lib/sse.ts
git commit -m "feat(web): SSE EventSource hook"
```

---

## Task 24: Feature Flags & Messages & Env Files

**Files:**
- Create: `yixiang-web/src/config/features.ts`
- Create: `yixiang-web/src/lib/messages.ts`
- Create: `yixiang-web/.env.example`

- [ ] **Step 1: 创建 src/config/features.ts**

```ts
export const features = {
  DM_ENABLED: false,
  AI_QA_ENABLED: true,
  RECENT_LIKERS_VISIBLE: true,
  RECOMMENDATIONS_VISIBLE: true,
  HOT_TAB_VISIBLE: true,
  TOPICS_TAB_VISIBLE: true,
} as const;

export type FeatureFlag = keyof typeof features;
```

- [ ] **Step 2: 创建 src/lib/messages.ts**

```ts
export const messages = {
  // 通用
  loading: '加载中...',
  loadingMore: '正在加载更多...',
  endOfList: '— 到底啦 —',
  retry: '重试',
  error: '出错了',
  cancel: '取消',
  confirm: '确认',
  save: '保存',

  // 登录/注册
  loginTitle: '欢迎回到颐享',
  loginSubmit: '登录',
  registerTitle: '注册新账号',
  registerSubmit: '注册',
  logoutSuccess: '已退出登录',

  // Feed
  feedEmpty: '还没有任何内容',
  feedEmptyHint: '关注几个用户或加入一个圈子,这里就会有内容',

  // 私信占位
  dmComingSoon: '私信功能即将上线',

  // 通知
  notificationEmpty: '暂无通知',

  // 圈子
  circleJoined: '已加入圈子',
  circleLeft: '已退出圈子',

  // 帖子操作
  liked: '已点赞',
  unliked: '取消点赞',
  favorited: '已收藏',
  unfavorited: '取消收藏',
  followed: '已关注',
  unfollowed: '取消关注',

  // 错误
  networkError: '网络错误,请稍后重试',
  unauthorized: '请先登录',
  forbidden: '没有权限',
  notFound: '未找到资源',
} as const;
```

- [ ] **Step 3: 创建 .env.example**

```
# 后端 API base URL(开发环境用 vite 代理,生产填实际域名)
VITE_API_BASE_URL=/api
```

- [ ] **Step 4: Commit**

```bash
git add yixiang-web/src/config/ yixiang-web/src/lib/messages.ts yixiang-web/.env.example
git commit -m "feat(web): feature flags, message constants, env example"
```

---

## Task 25: README & LICENSE Placeholder

**Files:**
- Create: `yixiang-web/README.md`
- Create: `yixiang-web/LICENSE`

- [ ] **Step 1: 创建 README.md**

```markdown
# yixiang-web

颐享(YiXiang)前端 — 知识共享社区。

## 技术栈

- Vite 5 + React 18 + TypeScript 5
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
```

- [ ] **Step 2: 创建 LICENSE(MIT)**

```
MIT License

Copyright (c) 2026 Ming Chen and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Commit**

```bash
git add yixiang-web/README.md yixiang-web/LICENSE
git commit -m "feat(web): README + MIT LICENSE"
```

---

## Task 26: Smoke Test Verification

**Files:** 无新文件,只跑命令验证

- [ ] **Step 1: typecheck 全过**

```bash
cd E:\code\yixiang\yixiang-web
npm run typecheck
```

Expected: 退出码 0,无错误。如有错误,逐一修复(通常是 import 路径、缺失字段)。

- [ ] **Step 2: lint 全过**

```bash
npm run lint
```

Expected: 退出码 0。如有 warning > 0,逐一修复。

- [ ] **Step 3: test 全过**

```bash
npm run test:run
```

Expected: 全部用例 PASS(apiClient 4 个 + AuthContext 3 个 + ProtectedRoute 2 个 + InfiniteList 3 个 = 12 个用例)。

- [ ] **Step 4: build 成功**

```bash
npm run build
```

Expected: 退出码 0,生成 `dist/` 目录。

- [ ] **Step 5: dev 启动并手工测试**

启动后端:在 `yixiang_be/` 目录跑 `mvn spring-boot:run`。

启动前端:

```bash
cd E:\code\yixiang\yixiang-web
npm run dev
```

浏览器打开 http://localhost:5173,验证清单:

- [ ] 5.1 页面背景 `#f4f5f7` 浅灰
- [ ] 5.2 Header 顶部 sticky,Logo + 搜索框 + "发布" + 通知/私信 + 登录按钮
- [ ] 5.3 无 token 时默认跳转 `/`,看到首页(空 stub)
- [ ] 5.4 访问 `/profile` 跳转 `/login`(ProtectedRoute 生效)
- [ ] 5.5 登录页可输入,提交后调用后端 `/api/auth/login`,成功返回后跳 `/`
- [ ] 5.6 登录后 Header 右上角显示用户名 + 头像 + 下拉菜单
- [ ] 5.7 左侧 Sidebar 11 个导航项 + 用户菜单 + "加入圈子"卡片
- [ ] 5.8 点 "私信" 图标 sonner toast 显示 "私信功能即将上线"
- [ ] 5.9 点击导航各项,active 高亮样式正确(蓝色背景 + 蓝字)
- [ ] 5.10 各 page stub 显示 "[PAGE_NAME] — P0 stub" 文字
- [ ] 5.11 浏览器 DevTools Network 面板可见 `/api/*` 请求带 `Authorization: Bearer ...` header
- [ ] 5.12 点击退出登录,跳回 `/login`,Header 显示登录按钮

- [ ] **Step 6: Commit "smoke test 通过"标记**

```bash
git commit --allow-empty -m "test(web): P0 smoke test passed - foundation ready"
```

---

## Definition of Done(P0 完成标志)

- 所有 26 个 Task 全部勾选
- `npm run typecheck && npm run lint && npm run test:run && npm run build` 全过
- 手工 smoke test 12 项全过
- `yixiang-web/` 在 git 历史中有完整的 commit 记录
- 现有 `yixiang_fe/` 未删除,仍可独立运行(用作对比)
- 项目结构符合 spec §2.2 文件树

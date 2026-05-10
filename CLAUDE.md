# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

颐享 (YiXiang) — a knowledge-sharing community platform. Two sub-projects: `zhiguang_be` (Spring Boot backend) and `zhiguang_fe` (React frontend).

---

## zhiguang_be — Backend

**Stack:** Java 21, Spring Boot 3.2.4, Spring Security + OAuth2 Resource Server (JWT RS256), MyBatis, MySQL 8.0, Redis (Redisson), Elasticsearch 9.x, Kafka, Caffeine, Canal, Spring AI (DeepSeek + OpenAI), Alibaba Cloud OSS

### Build & Run

```bash
# Build
cd zhiguang_be && ./mvnw clean package -DskipTests

# Run tests
./mvnw test                     # all tests
./mvnw test -Dtest=ClassName    # single test class

# Run app (needs MySQL, Redis, ES, Kafka running)
./mvnw spring-boot:run
```

Spring Boot entry point: `com.tongji.ZhiGuangApplication` (no custom annotations beyond `@SpringBootApplication`).

### Architecture (module overview)

The codebase is organized by domain module under `com.tongji`:

| Module | Package | Responsibility |
|--------|---------|----------------|
| **auth** | `com.tongji.auth` | JWT dual-token auth (RS256), 15-min access + 7-day refresh tokens, Redis refresh whitelist, instant revocation, phone/email verification codes |
| **counter** | `com.tongji.counter` | Like/fav counters stored in Redis as compact binary SDS, Lua atomic updates, bitmaps for dedup/idempotency. Kafka async write aggregation for high-concurrency writes. Sampling consistency checks with self-healing rebuild. |
| **knowpost** | `com.tongji.knowpost` | CRUD for knowledge posts ("知文"), progressive publish workflow (draft → review → published), Snowflake ID generation, OSS pre-signed URL direct upload for images/video/markdown content |
| **relation** | `com.tongji.relation` | Follow/unfollow with **Outbox pattern**: writes to `following`/`follower` tables + `outbox` table in same DB transaction, then Canal subscribes to outbox binlog → Kafka → async updates to counters, caches, lists |
| **search** | `com.tongji.search` | Elasticsearch content indexing, `search_after` cursor pagination, `function_score` mixing BM25 + business weights, `completion` suggester for prefix search. Separate Canal→Kafka consumer for outbox-driven index updates. |
| **llm** | `com.tongji.llm` | Spring AI integration (DeepSeek/OpenAI), RAG pipeline: check index → vector retrieval → prompt construction → SSE streaming generation. Per-document Q&A with chunked indexing and idempotent deletion. |
| **profile** | `com.tongji.profile` | User profile CRUD, avatar upload (OSS), tag management |
| **storage** | `com.tongji.storage` | OSS pre-signed URL generation for direct frontend uploads |
| **user** | `com.tongji.user` | User domain model, mapper |
| **cache** | `com.tongji.cache` | Three-tier feed cache (Caffeine local → Redis page → Redis fragment), hotkey detector with sliding window, single-flight lock against thundering herd on cache misses |
| **common** | `com.tongji.common` | `BusinessException`, `ErrorCode`, `GlobalExceptionHandler` (@RestControllerAdvice) |

### Key architecture patterns

- **Dual-token auth flow:** Login returns access token (15min, RS256 signed JWT) + refresh token (7 days, opaque, stored in Redis whitelist). `/auth/token/refresh` validates refresh against Redis and issues new pair. `/auth/logout` removes refresh from whitelist for instant revocation.
- **Outbox + Canal + Kafka:** Used by both `relation` and `search` modules. Services write to `outbox` table in the same DB transaction as the business write. Canal monitors MySQL binlog, picks up outbox inserts, pushes to Kafka topics. Downstream consumers (relation processor, search indexer) consume from Kafka with manual ack. This decouples the write path from async side effects.
- **Counter system:** Like/fav counts stored as Redis SDS binary (compact integers). Bitmaps track per-user state for idempotency. Writes are fired async via Kafka aggregation (`CounterAggregationConsumer`). On read, if count vs bitmap mismatch detected, a rebuild is triggered. Kafka-based "disaster replay" as last-resort recovery.
- **Feed caching:** Three-tier: Caffeine (local, shortest TTL) → Redis page cache → Redis fragment cache. `HotKeyDetector` uses sliding window counts to classify keys as NONE/LOW/MEDIUM/HIGH and dynamically extend TTL for hotter entries. Single-flight lock prevents concurrent cache-backfill storms for the same key.
- **Search indexing:** `SearchIndexService.upsertKnowPost()` pulls post details, fetches content from OSS URL, enriches with counter values, and indexes into ES. `CanalOutboxConsumerSearch` listens to outbox events to trigger re-index on post updates/deletes.
- **Security:** Stateless JWT auth via `oauth2ResourceServer`. Public endpoints include `/actuator/health`, auth endpoints, GET feed/detail/QA-stream. Everything else requires authentication. Method-level security available via `@PreAuthorize`.
- **Global error handling:** `GlobalExceptionHandler` catches `BusinessException` and returns structured JSON with `ErrorCode`.

### Data layer

- MyBatis with XML mappers in `src/main/resources/mapper/`
- Primary DB tables: `users`, `know_posts`, `outbox`, `following`, `follower`, `login_logs`
- Snowflake IDs generated at the application layer (not auto-increment) for `know_posts`, `following`, `follower`, `outbox`
- JSON columns used for `tags`, `img_urls`, `tags_json`, `payload`

---

## zhiguang_fe — Frontend

**Stack:** React 18, TypeScript 5, Vite 5, React Router v6, CSS Modules

### Commands

```bash
cd zhiguang_fe
npm run dev       # Vite dev server on :5173, proxies /api → localhost:8080
npm run build     # tsc --noEmit + vite build
npm run lint      # tsc --noEmit (type checking only)
npm run preview   # preview production build
```

### Architecture

- **`src/services/`** — API client layer. `apiClient.ts` provides a generic `apiFetch<T>()` function that auto-attaches JWT Bearer tokens from localStorage (`yixiang_auth_tokens`), handles CSRF tokens, and throws typed `ApiError`. Domain-specific services (`authService`, `knowpostService`, `profileService`, `relationService`, `searchService`) build on this.
- **`src/context/AuthContext.tsx`** — Central auth state. Manages tokens (access + refresh + expiry) in localStorage, auto-refreshes on a 60s interval if expiring within 5s, provides `login`/`register`/`logout`/`refresh`/`reloadUser`. Must wrap the app.
- **`src/types/`** — TypeScript type definitions matching backend DTOs (`auth.ts`, `profile.ts`, `knowpost.ts`, `search.ts`, `content.ts`, `relation.ts`).
- **`src/pages/`** — Route-level page components: `HomePage` (feed), `SearchPage`, `CreatePage`, `LearningPage`, `ProfilePage`, `EditProfilePage`, `CourseDetailPage` (post detail), `LoginPage`, `RegisterPage`.
- **`src/components/`** — Reusable UI: `layout/` (AppLayout, MainHeader, Sidebar), `common/` (LikeFavBar, FollowButton, SearchBar, TagInput, RelationListModal, UserBadge), `cards/` (CourseCard), `icons/`.
- **`src/theme/`** — Design tokens and theme config.
- **Path alias:** `@/` maps to `src/` (configured in both `tsconfig.json` and `vite.config.ts`).
- **Styling:** CSS Modules (`.module.css` files colocated with components).

### Key flows

- **Auth guard:** Routes that need login check for `tokens` in context; public routes (feed, detail, search) render regardless.
- **API calls:** All go through service functions → `apiFetch` → token auto-attach → error handling. SSE streaming (RAG Q&A) handled directly with `fetch` + `ReadableStream` in the detail page.
- **State:** No global state library — React Context for auth, local `useState`/`useEffect` for page-level state. Props drilling for component state.

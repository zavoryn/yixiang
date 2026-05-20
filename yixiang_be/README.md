# 颐享 (YiXiang)

知识获取与分享社区平台

## 项目简介

颐享是一个面向技术人群的知识分享社区，专注于 Java、AI、Agent 等技术领域。用户可以发布知文、点赞收藏、关注互动、AI 智能问答等。

## 技术栈

**后端：** Java 21 + Spring Boot 3.2 + Spring Security + Spring AI + MyBatis + MySQL + Redis + Kafka + Elasticsearch + 阿里云 OSS + Canal

**前端：** React 18 + TypeScript + Vite 5 + CSS Modules

## 核心功能

- **JWT 双令牌认证**：RS256 签名，15 分钟访问令牌 + 7 天刷新令牌，Redis 白名单即时撤销
- **计数系统**：Redis SDS 紧凑计数 + Lua 原子更新 + Kafka 异步写聚合 + 位图幂等判重
- **发布系统**：渐进式发布流程，OSS 预签名直传，AI 生成摘要
- **用户关系**：Outbox + Canal + Kafka 事件驱动，关注/粉丝异步更新
- **Feed 流**：三级缓存（Caffeine → Redis 页面 → Redis 片段），热点检测 + 单飞锁防击穿
- **搜索**：Elasticsearch 全文检索，search_after 游标分页，function_score 混合排序
- **AI 问答**：Spring AI + RAG，向量检索 + SSE 流式生成

## 本地运行

### 后端

```bash
cd zhiguang_be
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```

需要：MySQL 8.0、Redis、Elasticsearch 9.x、Kafka

### 前端

```bash
cd zhiguang_fe
npm install
npm run dev
```

前端开发服务器启动在 `:5173`，自动代理 `/api` 到后端 `:8080`。

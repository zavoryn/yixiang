# 颐享 (YiXiang) - 社区互动平台

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-3.x-231F20?style=flat-square&logo=apachekafka&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-9.x-005571?style=flat-square&logo=elasticsearch&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)

> 一个面向证券社区的社交互动平台，为股票投资者提供发帖互动、知识分享与用户关系链服务。后端采用 Spring Boot 微服务架构，重点解决了高频互动场景下的性能与数据一致性问题。

## 技术架构

| 层级 | 技术选型 |
|------|---------|
| **后端框架** | Java 21 + Spring Boot 3.2 + Spring Security + MyBatis-Plus |
| **数据存储** | MySQL 8.0 + Redis 7 (Lua 脚本) + Elasticsearch 9.x |
| **消息中间件** | Kafka + Canal (Binlog 监听) |
| **缓存策略** | Caffeine (本地) + Redis (分布式) 三级缓存 |
| **AI 能力** | Spring AI + RAG 向量检索 + SSE 流式生成 |
| **对象存储** | 阿里云 OSS |
| **前端** | React 18 + TypeScript + Vite 5 + CSS Modules |

## 核心亮点 & 性能优化

### 1. 点赞/收藏链路优化
**问题：** 高频互动场景下数据库写压力大、接口抖动

**方案：** Redis + Lua 原子更新 + 异步写回/批量聚合

**效果：**
- 峰值支撑 **1000~1500 QPS**
- 接口耗时 120~200ms → **70ms**（降低 50%~65%）
- 数据库写压力下降 **50%~70%**

### 2. 互动链路一致性保障
**问题：** 缓存异常与写入失败导致数据不一致

**方案：** BitMap 实现幂等防重与状态重建 + Kafka 回放机制异常补偿

**效果：**
- 重复写入异常下降 **50%~70%**
- 补偿成功率达 **75%+**
- 异常恢复时间控制在 **10~30 分钟**

### 3. 关注/取关链路优化
**问题：** 同步更新粉丝表、计数表、缓存导致高耦合与高延迟

**方案：** Outbox + Canal + Kafka 事件驱动，将 3 类下游逻辑异步解耦

**效果：**
- 接口 RT 从 200~350ms → **100~120ms**（降低 50%~65%）
- 系统吞吐提升 **40%~60%**

### 4. 其他核心功能
- **JWT 双令牌认证：** RS256 签名，15 分钟访问令牌 + 7 天刷新令牌，Redis 白名单即时撤销
- **Feed 流：** 三级缓存（Caffeine → Redis 页面 → Redis 片段），热点检测 + 单飞锁防击穿
- **全文搜索：** Elasticsearch 全文检索，search_after 游标分页，function_score 混合排序
- **AI 智能问答：** Spring AI + RAG 向量检索 + SSE 流式生成

## 项目结构

```
yixiang/
├── zhiguang_be/          # 后端 - Spring Boot
│   ├── src/main/java/
│   │   ├── controller/   # 接口层
│   │   ├── service/      # 业务逻辑层
│   │   ├── mapper/       # 数据访问层
│   │   ├── config/       # 配置类
│   │   └── common/       # 通用组件
│   └── src/main/resources/
└── zhiguang_fe/          # 前端 - React 18
    ├── src/
    │   ├── components/   # UI 组件
    │   ├── pages/        # 页面
    │   ├── hooks/        # 自定义 Hooks
    │   └── api/          # 接口请求
    └── package.json
```

## 本地运行

### 环境要求
- JDK 21+
- Node.js 18+
- MySQL 8.0
- Redis 7.x
- Elasticsearch 9.x
- Kafka 3.x

### 后端

```bash
cd zhiguang_be
./mvnw clean package -DskipTests
./mvnw spring-boot:run
```

### 前端

```bash
cd zhiguang_fe
npm install
npm run dev
```

前端开发服务器启动在 :5173，自动代理 /api 到后端 :8080。

## License

本项目仅用于学习与展示，不可用于商业用途。

# Phase 1: Notification Center

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete notification system — backend consumers that create notifications from existing Kafka events, an SSE endpoint that pushes real-time unread count, REST APIs for listing and marking-as-read, and a frontend `NotificationPage` with tab filters.

**Architecture:** Three Kafka consumers (one each for LIKE, COMMENT, FOLLOW) write to the `notifications` table using independent consumer groups — they do not interfere with existing consumers. Unread count is pushed via SSE; the notification list is REST-only. Frontend connects SSE inside `AuthContext` on login, disconnects on logout.

**Tech Stack:** Java 21, Spring Boot 3, Kafka, Spring Web SSE (SseEmitter), MyBatis XML, React 18, TypeScript

**Prerequisite:** Phase 0 must be complete (DB tables exist, comment-events topic wired up).

---

## File Structure

**Backend — new files:**
```
notification/
  api/
    NotificationController.java
    NotificationSseController.java
    dto/
      NotificationDTO.java
      NotificationListResponse.java
  consumer/
    LikeNotificationConsumer.java
    CommentNotificationConsumer.java
    FollowNotificationConsumer.java
  mapper/
    NotificationMapper.java
  model/
    Notification.java
  service/
    NotificationService.java
    impl/NotificationServiceImpl.java
  sse/
    SseEmitterRegistry.java
src/main/resources/mapper/NotificationMapper.xml
```

**Frontend — new files:**
```
src/pages/NotificationPage.tsx
src/services/notificationService.ts
src/types/notification.ts
```

**Frontend — modified files:**
```
src/App.tsx                    (add /notifications route)
src/context/AuthContext.tsx    (add SSE connection management)
src/components/layout/Header.tsx  (wire unread badge to SSE state)
```

---

### Task 1: Notification Model and Mapper

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/notification/model/Notification.java`
- Create: `yixiang_be/src/main/java/com/tongji/notification/mapper/NotificationMapper.java`
- Create: `yixiang_be/src/main/resources/mapper/NotificationMapper.xml`

- [ ] **Step 1: Create Notification model**

```java
// com/tongji/notification/model/Notification.java
package com.tongji.notification.model;

import lombok.Data;
import java.time.Instant;

@Data
public class Notification {
    private Long id;
    private Long recipientId;
    private Long actorId;
    private String type;       // LIKE | COMMENT | FOLLOW | SYSTEM
    private String entityType; // POST | COMMENT | null
    private Long entityId;
    private String content;
    private boolean isRead;
    private Instant createdAt;
}
```

- [ ] **Step 2: Create NotificationMapper interface**

```java
// com/tongji/notification/mapper/NotificationMapper.java
package com.tongji.notification.mapper;

import com.tongji.notification.model.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationMapper {
    void insert(Notification notification);

    List<Notification> listByRecipient(@Param("recipientId") long recipientId,
                                       @Param("type") String type,
                                       @Param("lastId") Long lastId,
                                       @Param("size") int size);

    int countUnread(@Param("recipientId") long recipientId);

    int markAllRead(@Param("recipientId") long recipientId);

    int markOneRead(@Param("id") long id, @Param("recipientId") long recipientId);
}
```

- [ ] **Step 3: Create NotificationMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.notification.mapper.NotificationMapper">

    <insert id="insert">
        INSERT INTO notifications (id, recipient_id, actor_id, type, entity_type, entity_id, content, is_read, created_at)
        VALUES (#{id}, #{recipientId}, #{actorId}, #{type}, #{entityType}, #{entityId}, #{content}, 0, NOW(3))
    </insert>

    <select id="listByRecipient" resultType="com.tongji.notification.model.Notification">
        SELECT id, recipient_id AS recipientId, actor_id AS actorId, type, entity_type AS entityType,
               entity_id AS entityId, content, is_read AS isRead, created_at AS createdAt
        FROM notifications
        WHERE recipient_id = #{recipientId}
        <if test="type != null">AND type = #{type}</if>
        <if test="lastId != null">AND id &lt; #{lastId}</if>
        ORDER BY id DESC
        LIMIT #{size}
    </select>

    <select id="countUnread" resultType="int">
        SELECT COUNT(1) FROM notifications
        WHERE recipient_id = #{recipientId} AND is_read = 0
    </select>

    <update id="markAllRead">
        UPDATE notifications SET is_read = 1
        WHERE recipient_id = #{recipientId} AND is_read = 0
    </update>

    <update id="markOneRead">
        UPDATE notifications SET is_read = 1
        WHERE id = #{id} AND recipient_id = #{recipientId}
    </update>

</mapper>
```

- [ ] **Step 4: Compile check**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/notification/
git add yixiang_be/src/main/resources/mapper/NotificationMapper.xml
git commit -m "feat: add notification model, mapper, and XML"
```

---

### Task 2: SSE Registry and Notification Service

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/notification/sse/SseEmitterRegistry.java`
- Create: `yixiang_be/src/main/java/com/tongji/notification/service/NotificationService.java`
- Create: `yixiang_be/src/main/java/com/tongji/notification/service/impl/NotificationServiceImpl.java`
- Create: `yixiang_be/src/main/java/com/tongji/notification/api/dto/NotificationDTO.java`
- Create: `yixiang_be/src/main/java/com/tongji/notification/api/dto/NotificationListResponse.java`

- [ ] **Step 1: Create SseEmitterRegistry**

```java
// com/tongji/notification/sse/SseEmitterRegistry.java
package com.tongji.notification.sse;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SseEmitterRegistry {

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter register(long userId) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError(e -> emitters.remove(userId));
        emitters.put(userId, emitter);
        return emitter;
    }

    public void sendUnreadCount(long userId, int count) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event().name("unread").data("{\"unreadCount\":" + count + "}"));
        } catch (IOException e) {
            emitters.remove(userId);
        }
    }
}
```

- [ ] **Step 2: Create DTOs**

```java
// com/tongji/notification/api/dto/NotificationDTO.java
package com.tongji.notification.api.dto;

import java.time.Instant;

public record NotificationDTO(
        long id,
        Long actorId,
        String actorNickname,
        String actorAvatar,
        String type,
        String entityType,
        Long entityId,
        String content,
        boolean isRead,
        Instant createdAt
) {}
```

```java
// com/tongji/notification/api/dto/NotificationListResponse.java
package com.tongji.notification.api.dto;

import java.util.List;

public record NotificationListResponse(
        List<NotificationDTO> items,
        Long nextCursor,   // last id in current page, null if no more
        boolean hasMore
) {}
```

- [ ] **Step 3: Create NotificationService interface**

```java
// com/tongji/notification/service/NotificationService.java
package com.tongji.notification.service;

import com.tongji.notification.api.dto.NotificationListResponse;
import com.tongji.notification.model.Notification;

public interface NotificationService {
    void create(Notification notification);
    NotificationListResponse list(long recipientId, String type, Long cursor, int size);
    int unreadCount(long recipientId);
    void markAllRead(long recipientId);
    void markOneRead(long id, long recipientId);
}
```

- [ ] **Step 4: Write failing test for NotificationServiceImpl**

```java
// src/test/java/com/tongji/notification/service/impl/NotificationServiceImplTest.java
package com.tongji.notification.service.impl;

import com.tongji.notification.mapper.NotificationMapper;
import com.tongji.notification.model.Notification;
import com.tongji.notification.sse.SseEmitterRegistry;
import com.tongji.user.service.UserService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class NotificationServiceImplTest {

    private final NotificationMapper mapper = mock(NotificationMapper.class);
    private final SseEmitterRegistry registry = mock(SseEmitterRegistry.class);
    private final UserService userService = mock(UserService.class);
    private final NotificationServiceImpl service =
            new NotificationServiceImpl(mapper, registry, userService);

    @Test
    void createPersistsAndPushesUnreadCount() {
        when(mapper.countUnread(42L)).thenReturn(3);
        when(mapper.listByRecipient(anyLong(), any(), any(), anyInt())).thenReturn(List.of());

        Notification n = new Notification();
        n.setRecipientId(42L);
        n.setActorId(7L);
        n.setType("LIKE");
        n.setEntityType("POST");
        n.setEntityId(100L);
        n.setContent("有人点赞了你的帖子");
        service.create(n);

        verify(mapper).insert(argThat(notif -> notif.getId() != null && notif.getRecipientId() == 42L));
        verify(registry).sendUnreadCount(42L, 3);
    }

    @Test
    void markAllReadDelegatesToMapper() {
        service.markAllRead(99L);
        verify(mapper).markAllRead(99L);
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

```bash
cd yixiang_be && mvn test -Dtest=NotificationServiceImplTest -q 2>&1 | tail -5
```

Expected: FAIL — `NotificationServiceImpl` doesn't exist yet.

- [ ] **Step 6: Implement NotificationServiceImpl**

```java
// com/tongji/notification/service/impl/NotificationServiceImpl.java
package com.tongji.notification.service.impl;

import com.tongji.notification.api.dto.NotificationDTO;
import com.tongji.notification.api.dto.NotificationListResponse;
import com.tongji.notification.mapper.NotificationMapper;
import com.tongji.notification.model.Notification;
import com.tongji.notification.service.NotificationService;
import com.tongji.notification.sse.SseEmitterRegistry;
import com.tongji.user.domain.User;
import com.tongji.user.service.UserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper mapper;
    private final SseEmitterRegistry registry;
    private final UserService userService;

    public NotificationServiceImpl(NotificationMapper mapper,
                                   SseEmitterRegistry registry,
                                   UserService userService) {
        this.mapper = mapper;
        this.registry = registry;
        this.userService = userService;
    }

    @Override
    public void create(Notification notification) {
        notification.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        mapper.insert(notification);
        int unread = mapper.countUnread(notification.getRecipientId());
        registry.sendUnreadCount(notification.getRecipientId(), unread);
    }

    @Override
    public NotificationListResponse list(long recipientId, String type, Long cursor, int size) {
        int querySize = size + 1;
        List<Notification> rows = mapper.listByRecipient(recipientId, type, cursor, querySize);
        boolean hasMore = rows.size() > size;
        if (hasMore) rows = rows.subList(0, size);

        List<NotificationDTO> items = rows.stream().map(n -> {
            String nickname = null;
            String avatar = null;
            if (n.getActorId() != null) {
                User actor = userService.findById(n.getActorId()).orElse(null);
                if (actor != null) {
                    nickname = actor.getNickname();
                    avatar = actor.getAvatar();
                }
            }
            return new NotificationDTO(n.getId(), n.getActorId(), nickname, avatar,
                    n.getType(), n.getEntityType(), n.getEntityId(),
                    n.getContent(), n.isRead(), n.getCreatedAt());
        }).toList();

        Long nextCursor = hasMore ? rows.get(rows.size() - 1).getId() : null;
        return new NotificationListResponse(items, nextCursor, hasMore);
    }

    @Override
    public int unreadCount(long recipientId) {
        return mapper.countUnread(recipientId);
    }

    @Override
    public void markAllRead(long recipientId) {
        mapper.markAllRead(recipientId);
    }

    @Override
    public void markOneRead(long id, long recipientId) {
        mapper.markOneRead(id, recipientId);
    }
}
```

- [ ] **Step 7: Run test to verify it passes**

```bash
cd yixiang_be && mvn test -Dtest=NotificationServiceImplTest
```

Expected: BUILD SUCCESS, 2 tests passed.

- [ ] **Step 8: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/notification/
git add yixiang_be/src/test/java/com/tongji/notification/
git commit -m "feat: notification service with SSE registry"
```

---

### Task 3: Kafka Consumers

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/notification/consumer/LikeNotificationConsumer.java`
- Create: `yixiang_be/src/main/java/com/tongji/notification/consumer/CommentNotificationConsumer.java`
- Create: `yixiang_be/src/main/java/com/tongji/notification/consumer/FollowNotificationConsumer.java`

- [ ] **Step 1: Create LikeNotificationConsumer**

Subscribes to `counter-events` (same topic as `CounterAggregationConsumer`) with a **different** consumer group `notification-like` so both consumers receive every message independently.

```java
// com/tongji/notification/consumer/LikeNotificationConsumer.java
package com.tongji.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.counter.event.CounterEvent;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import com.tongji.notification.model.Notification;
import com.tongji.notification.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class LikeNotificationConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final KnowPostMapper knowPostMapper;

    public LikeNotificationConsumer(ObjectMapper objectMapper,
                                    NotificationService notificationService,
                                    KnowPostMapper knowPostMapper) {
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
        this.knowPostMapper = knowPostMapper;
    }

    @KafkaListener(topics = "counter-events", groupId = "notification-like")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            CounterEvent evt = objectMapper.readValue(message, CounterEvent.class);
            // 只处理点赞 +1，忽略取消点赞和收藏事件
            if (!"like".equals(evt.getMetric()) || evt.getDelta() != 1) {
                ack.acknowledge();
                return;
            }
            KnowPost post = knowPostMapper.findById(Long.parseLong(evt.getEntityId()));
            if (post == null || post.getCreatorId() == null) {
                ack.acknowledge();
                return;
            }
            // 不给自己发通知
            if (post.getCreatorId() == evt.getUserId()) {
                ack.acknowledge();
                return;
            }
            Notification n = new Notification();
            n.setRecipientId(post.getCreatorId());
            n.setActorId(evt.getUserId());
            n.setType("LIKE");
            n.setEntityType("POST");
            n.setEntityId(Long.parseLong(evt.getEntityId()));
            n.setContent("点赞了你的帖子");
            notificationService.create(n);
            ack.acknowledge();
        } catch (Exception e) {
            // 不 ack，让 Kafka 重试
        }
    }
}
```

- [ ] **Step 2: Create CommentNotificationConsumer**

```java
// com/tongji/notification/consumer/CommentNotificationConsumer.java
package com.tongji.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.comment.event.CommentEvent;
import com.tongji.comment.event.CommentTopics;
import com.tongji.notification.model.Notification;
import com.tongji.notification.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class CommentNotificationConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public CommentNotificationConsumer(ObjectMapper objectMapper,
                                       NotificationService notificationService) {
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = CommentTopics.EVENTS, groupId = "notification-comment")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            CommentEvent evt = objectMapper.readValue(message, CommentEvent.class);
            Notification n = new Notification();
            n.setRecipientId(evt.postAuthorId());
            n.setActorId(evt.commenterId());
            n.setType("COMMENT");
            n.setEntityType("POST");
            n.setEntityId(evt.postId());
            n.setContent(evt.contentSnippet());
            notificationService.create(n);
            ack.acknowledge();
        } catch (Exception e) {
            // 不 ack，让 Kafka 重试
        }
    }
}
```

- [ ] **Step 3: Create FollowNotificationConsumer**

Subscribes to `canal-outbox` with group `notification-follow`. The `RelationEvent` is embedded in the outbox `payload` field, same as `CanalOutboxConsumer`.

```java
// com/tongji/notification/consumer/FollowNotificationConsumer.java
package com.tongji.notification.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.common.util.OutboxMessageUtil;
import com.tongji.notification.model.Notification;
import com.tongji.notification.service.NotificationService;
import com.tongji.relation.event.RelationEvent;
import com.tongji.relation.outbox.OutboxTopics;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FollowNotificationConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public FollowNotificationConsumer(ObjectMapper objectMapper,
                                      NotificationService notificationService) {
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = OutboxTopics.CANAL_OUTBOX, groupId = "notification-follow")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            List<JsonNode> rows = OutboxMessageUtil.extractRows(objectMapper, message);
            for (JsonNode row : rows) {
                JsonNode payloadNode = row.get("payload");
                if (payloadNode == null) continue;
                RelationEvent evt = objectMapper.readValue(payloadNode.asText(), RelationEvent.class);
                if (!"FOLLOW".equals(evt.type())) continue;

                Notification n = new Notification();
                n.setRecipientId(evt.toUserId());
                n.setActorId(evt.fromUserId());
                n.setType("FOLLOW");
                n.setEntityType(null);
                n.setEntityId(null);
                n.setContent("关注了你");
                notificationService.create(n);
            }
            ack.acknowledge();
        } catch (Exception e) {
            // 不 ack，让 Kafka 重试
        }
    }
}
```

- [ ] **Step 4: Compile check**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/notification/consumer/
git commit -m "feat: notification kafka consumers for like, comment, follow"
```

---

### Task 4: REST and SSE Controllers

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/notification/api/NotificationController.java`
- Create: `yixiang_be/src/main/java/com/tongji/notification/api/NotificationSseController.java`
- Modify: `yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java` (whitelist SSE endpoint)

- [ ] **Step 1: Create NotificationController**

```java
// com/tongji/notification/api/NotificationController.java
package com.tongji.notification.api;

import com.tongji.auth.token.JwtService;
import com.tongji.notification.api.dto.NotificationListResponse;
import com.tongji.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtService jwtService;

    public NotificationController(NotificationService notificationService, JwtService jwtService) {
        this.notificationService = notificationService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public NotificationListResponse list(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "cursor", required = false) Long cursor,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return notificationService.list(uid, type, cursor, Math.min(size, 50));
    }

    @GetMapping("/unread-count")
    public Map<String, Integer> unreadCount(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return Map.of("unreadCount", notificationService.unreadCount(uid));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> readAll(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        notificationService.markAllRead(uid);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> readOne(@PathVariable long id,
                                        @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        notificationService.markOneRead(id, uid);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 2: Create NotificationSseController**

```java
// com/tongji/notification/api/NotificationSseController.java
package com.tongji.notification.api;

import com.tongji.auth.token.JwtService;
import com.tongji.notification.service.NotificationService;
import com.tongji.notification.sse.SseEmitterRegistry;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationSseController {

    private final SseEmitterRegistry registry;
    private final NotificationService notificationService;
    private final JwtService jwtService;

    public NotificationSseController(SseEmitterRegistry registry,
                                     NotificationService notificationService,
                                     JwtService jwtService) {
        this.registry = registry;
        this.notificationService = notificationService;
        this.jwtService = jwtService;
    }

    @GetMapping("/stream")
    public SseEmitter stream(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        SseEmitter emitter = registry.register(uid);
        // 立即推送当前未读数作为初始化确认
        try {
            int unread = notificationService.unreadCount(uid);
            emitter.send(SseEmitter.event().name("unread").data("{\"unreadCount\":" + unread + "}"));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        return emitter;
    }
}
```

- [ ] **Step 3: Add notification endpoints to SecurityConfig whitelist**

In `SecurityConfig.java`, find the `requestMatchers` section that lists public endpoints and add:

```java
// 现有公开端点下面追加：
.requestMatchers(HttpMethod.GET, "/api/v1/notifications/stream").authenticated()
```

The other notification endpoints (`/api/v1/notifications/**`) are already protected by default (require authentication) — no change needed. Only `/api/v1/notifications/stream` needs special handling because it's a long-lived SSE connection.

- [ ] **Step 4: Compile check**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/notification/api/
git add yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java
git commit -m "feat: notification REST and SSE controllers"
```

---

### Task 5: Frontend — Type Definitions and Service

**Files:**
- Create: `yixiang_fe/src/types/notification.ts`
- Create: `yixiang_fe/src/services/notificationService.ts`

- [ ] **Step 1: Create types**

```typescript
// src/types/notification.ts
export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'SYSTEM';

export interface NotificationItem {
  id: number;
  actorId: number | null;
  actorNickname: string | null;
  actorAvatar: string | null;
  type: NotificationType;
  entityType: 'POST' | 'COMMENT' | null;
  entityId: number | null;
  content: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  nextCursor: number | null;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
```

- [ ] **Step 2: Create service**

```typescript
// src/services/notificationService.ts
import { apiFetch } from './apiClient';
import type { NotificationListResponse, UnreadCountResponse } from '@/types/notification';

const BASE = '/api/v1/notifications';

export const notificationService = {
  list: (params: { type?: string; cursor?: number; size?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.cursor) query.set('cursor', String(params.cursor));
    query.set('size', String(params.size ?? 20));
    return apiFetch<NotificationListResponse>(`${BASE}?${query.toString()}`);
  },

  unreadCount: () =>
    apiFetch<UnreadCountResponse>(`${BASE}/unread-count`),

  markAllRead: () =>
    apiFetch<void>(`${BASE}/read-all`, { method: 'PUT' }),

  markOneRead: (id: number) =>
    apiFetch<void>(`${BASE}/${id}/read`, { method: 'PUT' }),
};
```

- [ ] **Step 3: Commit**

```bash
git add yixiang_fe/src/types/notification.ts yixiang_fe/src/services/notificationService.ts
git commit -m "feat: notification types and service"
```

---

### Task 6: Frontend — SSE in AuthContext

**Files:**
- Modify: `yixiang_fe/src/context/AuthContext.tsx`

The goal is to maintain `unreadCount` state that is updated via SSE. Components read it from context.

- [ ] **Step 1: Add unreadCount to AuthContextValue type and state**

In `AuthContext.tsx`:

1. Add `unreadCount: number` and `setUnreadCount: (n: number) => void` to `AuthContextValue`.

2. Add `const [unreadCount, setUnreadCount] = useState(0);` inside `AuthProvider`.

3. Add a `useEffect` that starts an SSE connection when `tokens` is available and closes it on logout:

```typescript
const sseRef = useRef<EventSource | null>(null);

useEffect(() => {
  if (!tokens?.accessToken) {
    sseRef.current?.close();
    sseRef.current = null;
    setUnreadCount(0);
    return;
  }
  // EventSource doesn't support custom headers; pass token as query param
  const url = `/api/v1/notifications/stream?access_token=${tokens.accessToken}`;
  const es = new EventSource(url);
  sseRef.current = es;

  es.addEventListener('unread', (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as { unreadCount: number };
      setUnreadCount(data.unreadCount);
    } catch { /* ignore */ }
  });

  es.onerror = () => {
    es.close();
    sseRef.current = null;
  };

  return () => {
    es.close();
    sseRef.current = null;
  };
}, [tokens?.accessToken]);
```

4. Expose `unreadCount` and `setUnreadCount` in the context value and `AuthContextValue` type.

**Note on SSE auth:** `EventSource` can't send `Authorization` headers. The backend `NotificationSseController.stream()` needs to accept `?access_token=` query param. Add a Spring Security filter or a `HandlerInterceptor` that reads `access_token` query param and sets it on the security context — OR configure `oauth2ResourceServer` to also accept the token from query params.

Add to `SecurityConfig.java` the bearer token resolver that falls back to query param:

```java
// In the http.oauth2ResourceServer() configuration, add:
.bearerTokenResolver(request -> {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
        return header.substring(7);
    }
    return request.getParameter("access_token");
})
```

- [ ] **Step 2: Compile the frontend**

```bash
cd yixiang_fe && npm run lint
```

Expected: No errors. Fix any TypeScript errors related to the new context fields before continuing.

- [ ] **Step 3: Commit**

```bash
git add yixiang_fe/src/context/AuthContext.tsx
git add yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java
git commit -m "feat: SSE unread count in AuthContext, bearer token from query param"
```

---

### Task 7: Frontend — NotificationPage

**Files:**
- Create: `yixiang_fe/src/pages/NotificationPage.tsx`
- Modify: `yixiang_fe/src/App.tsx`
- Modify: `yixiang_fe/src/components/layout/Header.tsx`

- [ ] **Step 1: Create NotificationPage**

```tsx
// src/pages/NotificationPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';
import type { NotificationItem, NotificationType } from '@/types/notification';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const TABS: { label: string; value: string }[] = [
  { label: '全部', value: '' },
  { label: '评论', value: 'COMMENT' },
  { label: '点赞', value: 'LIKE' },
  { label: '关注', value: 'FOLLOW' },
];

export default function NotificationPage() {
  const { tokens, setUnreadCount } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (tab: string, reset: boolean) => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await notificationService.list({
        type: tab || undefined,
        cursor: reset ? undefined : (cursor ?? undefined),
      });
      setItems(prev => reset ? res.items : [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, [tokens, cursor]);

  useEffect(() => {
    // Mark all read on mount, reset unread badge
    if (tokens) {
      notificationService.markAllRead().catch(() => {});
      setUnreadCount(0);
    }
    load(activeTab, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tokens]);

  if (!tokens) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">通知中心</h1>
      </div>

      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setCursor(null); }}>
        <TabsList className="mb-4">
          {TABS.map(t => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 ${!item.isRead ? 'bg-blue-50' : ''}`}
            onClick={() => item.entityId && navigate(`/post/${item.entityId}`)}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={item.actorAvatar ?? undefined} />
              <AvatarFallback>{item.actorNickname?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{item.actorNickname ?? '系统'}</span>
                {' '}{item.content}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: zhCN })}
              </p>
            </div>
            {!item.isRead && <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
          </div>
        ))}
        {items.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-12">暂无通知</p>
        )}
        {hasMore && (
          <Button variant="ghost" className="w-full" onClick={() => load(activeTab, false)} disabled={loading}>
            {loading ? '加载中…' : '加载更多'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route in App.tsx**

Add import and route:

```tsx
import NotificationPage from "@/pages/NotificationPage";
// Inside <Route element={<Layout />}>:
<Route path="notifications" element={<NotificationPage />} />
```

- [ ] **Step 3: Wire unread badge in Header.tsx**

In `Header.tsx`, read `unreadCount` from `useAuth()` and display it on the notification icon:

```tsx
const { unreadCount } = useAuth();

// On the notification bell icon, wrap with a relative div:
<div className="relative">
  <BellIcon className="h-5 w-5" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )}
</div>
```

Make the bell icon a `<Link to="/notifications">` if it isn't already.

- [ ] **Step 4: Type check**

```bash
cd yixiang_fe && npm run lint
```

Expected: No type errors.

- [ ] **Step 5: Install date-fns if not already present**

```bash
cd yixiang_fe && npm ls date-fns 2>/dev/null || npm install date-fns
```

- [ ] **Step 6: Commit**

```bash
git add yixiang_fe/src/pages/NotificationPage.tsx
git add yixiang_fe/src/App.tsx
git add yixiang_fe/src/components/layout/Header.tsx
git commit -m "feat: notification center page with SSE badge"
```

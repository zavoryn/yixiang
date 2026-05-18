# Phase 0: Foundation — DB Schema & Comment Kafka Event

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all new database tables required by phases 1–3, add FORBIDDEN error code, and wire up the comment-events Kafka topic so the notification module can consume comment events.

**Architecture:** One SQL migration script adds all tables and columns up-front. The comment Kafka event follows the exact same producer pattern as `CounterEventProducer`. Both changes are prerequisites for all other phases — complete this phase before starting any other.

**Tech Stack:** MySQL 8.0, Spring Boot 3, Kafka, Java 21, MyBatis XML

---

### Task 1: DB Migration Script

**Files:**
- Create: `yixiang_be/db/migrations/V1__feature_completion.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- yixiang_be/db/migrations/V1__feature_completion.sql

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
    id           BIGINT       NOT NULL PRIMARY KEY,
    recipient_id BIGINT       NOT NULL,
    actor_id     BIGINT       NULL,
    type         ENUM('LIKE','COMMENT','FOLLOW','SYSTEM') NOT NULL,
    entity_type  ENUM('POST','COMMENT') NULL,
    entity_id    BIGINT       NULL,
    content      VARCHAR(255) NULL,
    is_read      TINYINT      NOT NULL DEFAULT 0,
    created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_recipient (recipient_id, is_read, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏记录表（支持列表查询，补充 counter 模块只存计数的不足）
CREATE TABLE IF NOT EXISTS user_favorites (
    id         BIGINT      NOT NULL PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    post_id    BIGINT      NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_user_post (user_id, post_id),
    INDEX idx_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 圈子表
CREATE TABLE IF NOT EXISTS circles (
    id           BIGINT       NOT NULL PRIMARY KEY,
    name         VARCHAR(50)  NOT NULL,
    description  TEXT         NULL,
    avatar_url   VARCHAR(512) NULL,
    owner_id     BIGINT       NOT NULL,
    visibility   ENUM('PUBLIC','PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    status       ENUM('ACTIVE','DISBANDED') NOT NULL DEFAULT 'ACTIVE',
    category     VARCHAR(50)  NULL,
    member_count INT          NOT NULL DEFAULT 0,
    post_count   INT          NOT NULL DEFAULT 0,
    created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_category (category, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 圈子成员表
CREATE TABLE IF NOT EXISTS circle_members (
    id        BIGINT NOT NULL PRIMARY KEY,
    circle_id BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    role      ENUM('OWNER','ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
    status    ENUM('ACTIVE','PENDING')       NOT NULL DEFAULT 'ACTIVE',
    joined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_circle_user (circle_id, user_id),
    INDEX idx_user (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- know_posts 新增圈子关联列和精华标记
ALTER TABLE know_posts
    ADD COLUMN circle_id   BIGINT  NULL    COMMENT '所属圈子ID，NULL表示公开帖子' AFTER creator_id,
    ADD COLUMN is_featured TINYINT NOT NULL DEFAULT 0 COMMENT '是否被圈主标为精华' AFTER circle_id;

ALTER TABLE know_posts ADD INDEX idx_circle (circle_id, create_time);
ALTER TABLE know_posts ADD INDEX idx_circle_featured (circle_id, is_featured, create_time);
```

- [ ] **Step 2: Apply to local dev DB**

```bash
mysql -u root -p your_db_name < yixiang_be/db/migrations/V1__feature_completion.sql
```

Expected: No errors. If `know_posts` columns already exist, the ALTER will fail — safe to ignore.

- [ ] **Step 3: Commit**

```bash
git add yixiang_be/db/migrations/V1__feature_completion.sql
git commit -m "feat: add db schema for notifications, favorites, circles"
```

---

### Task 2: Add FORBIDDEN Error Code

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/common/exception/ErrorCode.java`

- [ ] **Step 1: Add FORBIDDEN and CIRCLE_NOT_FOUND to the enum**

In `ErrorCode.java`, add after `INTERNAL_ERROR`:

```java
    FORBIDDEN("FORBIDDEN", "无操作权限"),
    CIRCLE_NOT_FOUND("CIRCLE_NOT_FOUND", "圈子不存在"),
    NOT_CIRCLE_MEMBER("NOT_CIRCLE_MEMBER", "需要先加入圈子"),
    ALREADY_CIRCLE_MEMBER("ALREADY_CIRCLE_MEMBER", "已经是圈子成员");
```

- [ ] **Step 2: Verify compile**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/common/exception/ErrorCode.java
git commit -m "feat: add FORBIDDEN and circle error codes"
```

---

### Task 3: Comment Kafka Event (prerequisite for notification)

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/comment/event/CommentEvent.java`
- Create: `yixiang_be/src/main/java/com/tongji/comment/event/CommentTopics.java`
- Create: `yixiang_be/src/main/java/com/tongji/comment/event/CommentEventProducer.java`
- Modify: `yixiang_be/src/main/java/com/tongji/comment/service/impl/CommentServiceImpl.java`

- [ ] **Step 1: Create CommentTopics**

```java
// com/tongji/comment/event/CommentTopics.java
package com.tongji.comment.event;

public final class CommentTopics {
    public static final String EVENTS = "comment-events";
    private CommentTopics() {}
}
```

- [ ] **Step 2: Create CommentEvent**

```java
// com/tongji/comment/event/CommentEvent.java
package com.tongji.comment.event;

public record CommentEvent(
        long commentId,
        long postId,
        long postAuthorId,
        long commenterId,
        String contentSnippet  // 前 50 字，用于通知预览
) {}
```

- [ ] **Step 3: Create CommentEventProducer**

Follows the exact same pattern as `CounterEventProducer`:

```java
// com/tongji/comment/event/CommentEventProducer.java
package com.tongji.comment.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class CommentEventProducer {
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper objectMapper;

    public CommentEventProducer(KafkaTemplate<String, String> kafka, ObjectMapper objectMapper) {
        this.kafka = kafka;
        this.objectMapper = objectMapper;
    }

    public void publish(CommentEvent event) {
        try {
            kafka.send(CommentTopics.EVENTS, objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException ignored) {}
    }
}
```

- [ ] **Step 4: Write the failing test**

```java
// src/test/java/com/tongji/comment/event/CommentEventProducerTest.java
package com.tongji.comment.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.kafka.core.KafkaTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class CommentEventProducerTest {

    @Test
    void publishSerializesEventToCorrectTopic() throws Exception {
        KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        ObjectMapper mapper = new ObjectMapper();
        CommentEventProducer producer = new CommentEventProducer(kafka, mapper);

        CommentEvent event = new CommentEvent(1L, 2L, 3L, 4L, "测试评论内容");
        producer.publish(event);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> payloadCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafka).send(topicCaptor.capture(), payloadCaptor.capture());

        assertThat(topicCaptor.getValue()).isEqualTo("comment-events");
        assertThat(payloadCaptor.getValue()).contains("\"commentId\":1");
        assertThat(payloadCaptor.getValue()).contains("\"postAuthorId\":3");
    }
}
```

- [ ] **Step 5: Run test to verify it fails**

```bash
cd yixiang_be && mvn test -Dtest=CommentEventProducerTest -q
```

Expected: FAIL — `CommentEventProducer` doesn't exist yet (you just created the file, so it should pass if you created in step 3; this step confirms the test was written before running)

- [ ] **Step 6: Run test to verify it passes**

```bash
cd yixiang_be && mvn test -Dtest=CommentEventProducerTest
```

Expected: BUILD SUCCESS, 1 test passed.

- [ ] **Step 7: Inject producer into CommentServiceImpl and publish on create**

Add `CommentEventProducer` field to `CommentServiceImpl`. The post author ID requires a lookup — inject `KnowPostMapper`:

In `CommentServiceImpl.java`, change constructor and `create()` method:

```java
// Add fields
private final CommentEventProducer commentEventProducer;
// KnowPostMapper is already available via the knowpost module — inject it

public CommentServiceImpl(CommentMapper commentMapper,
                          CounterService counterService,
                          UserService userService,
                          KnowPostMapper knowPostMapper,
                          CommentEventProducer commentEventProducer) {
    this.commentMapper = commentMapper;
    this.counterService = counterService;
    this.userService = userService;
    this.knowPostMapper = knowPostMapper;
    this.commentEventProducer = commentEventProducer;
}
```

At the end of the `create()` method, after `counterService.incrementComment(...)`:

```java
// Publish comment event for notification consumers (best-effort, non-transactional)
try {
    KnowPost post = knowPostMapper.findById(request.postId());
    if (post != null && post.getCreatorId() != null && post.getCreatorId() != userId) {
        String snippet = request.content().length() > 50
                ? request.content().substring(0, 50) : request.content();
        commentEventProducer.publish(new CommentEvent(id, request.postId(),
                post.getCreatorId(), userId, snippet));
    }
} catch (Exception ignored) {}
```

Also add `import com.tongji.knowpost.mapper.KnowPostMapper;` and `import com.tongji.knowpost.model.KnowPost;` and `import com.tongji.comment.event.*;` at the top of the file.

- [ ] **Step 8: Verify compile**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 9: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/comment/
git add yixiang_be/src/test/java/com/tongji/comment/
git commit -m "feat: publish comment-events to Kafka on comment create"
```

# Phase 1: Backend Gap Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 6 new backend modules (hot / topic / draft / settings / recommend / activity) and 2 enhancements (User+DTO triple-field upgrade, recentLikers ZSET) that frontend Phase 2 will consume, while leaving counter / relation / search / outbox / canal / kafka mainline untouched.

**Architecture:** Each new module follows the existing layered pattern `api/` (controllers + DTO records) → `service/` (interface + impl/) → `mapper/` (MyBatis XML in `src/main/resources/mapper/`) → `model/` (domain class). Application-layer Snowflake-style IDs via `ThreadLocalRandom.current().nextLong(Long.MAX_VALUE)`. All errors thrown as `BusinessException(ErrorCode.XXX)`. Kafka consumers use `@KafkaListener` + `Acknowledgment` for manual ack. Redisson is the gateway to all Redis usage. New `activity` and `recentLikers` consumers subscribe to the existing `counter-events` topic without changing the producer.

**Tech Stack:** Java 21, Spring Boot 3.2.4, MyBatis 3.0.3, MySQL 8.0, Redis (Redisson), Kafka, Caffeine, Lombok.

---

## File Structure

**Migration (1 file):**
- Create: `yixiang_be/db/migrations/V2__p1_base.sql` — users 3 cols + topics + drafts + user_settings + activities

**Cross-cutting changes (existing files):**
- Modify: `com/tongji/common/exception/ErrorCode.java` — add 7 codes
- Modify: `com/tongji/user/domain/User.java` — add 3 fields
- Modify: `resources/mapper/UserMapper.xml` — ResultMap + updateProfile + listSummariesByIds
- Modify: `com/tongji/user/mapper/UserMapper.java` — declare listSummariesByIds
- Modify: `com/tongji/profile/api/dto/ProfileResponse.java` — add 3 fields
- Modify: `com/tongji/profile/service/impl/ProfileServiceImpl.java` — pass 3 fields through

**New shared DTOs (2 files):**
- Create: `com/tongji/user/api/dto/UserSummary.java` — full user info for cards
- Create: `com/tongji/user/api/dto/UserBrief.java` — id+nickname+avatar+verified for chips

**hot module:** `com.tongji.hot` — Controller + Service + ServiceImpl + HotPostResponse DTO

**topic module:** `com.tongji.topic` — Model + Mapper(.java+.xml) + Service + ServiceImpl + Controller + DTOs

**draft module:** `com.tongji.draft` — Model + Mapper(.java+.xml) + Service + ServiceImpl + Controller + 3 DTOs

**settings module:** `com.tongji.settings` — Model + Mapper(.java+.xml) + Service + ServiceImpl + Controller + 2 DTOs

**recommend module:** `com.tongji.recommend` — Controller + Service + ServiceImpl + 2 DTOs (Caffeine 60s cache)

**activity module:** `com.tongji.activity` — Model + Mapper(.java+.xml) + Service + ServiceImpl + 2 Consumers + Controller + DTO

**recentLikers enhancement:**
- Create: `com/tongji/counter/recent/RecentLikersService.java` + `RecentLikersConsumer.java`
- Modify: FeedItem DTO (find via grep) — add `recentLikers: List<UserBrief>` + `likerSummary: String`
- Modify: feed-building service to populate

---

## Verification commands

Run from `yixiang_be/`:

```bash
mvn compile                          # fastest — compile check only
mvn test -Dtest=ClassName            # single test class
mvn test                             # full suite
mvn clean package -DskipTests        # final build artifact
```

Migrations are NOT applied by the executor — DBA runs Flyway. Executor only writes SQL files and reviews them visually against `V1__feature_completion.sql` patterns.

---

## Section A: Base — DB Migration + User/DTO Enhancement + ErrorCode

**Goal:** Lay foundation that every subsequent section depends on. After Section A: codebase compiles, Spring Boot still starts, new tables and 3 new User fields exist in schema and Java model. Functionality unchanged.

---

### Task 1: Create V2 migration file

**Files:**
- Create: `yixiang_be/db/migrations/V2__p1_base.sql`

- [ ] **Step 1: Create the file with full content**

```sql
-- yixiang_be/db/migrations/V2__p1_base.sql
-- Phase 1 base: users 3 new cols + 4 new tables (topics, drafts, user_settings, activities).

-- 1. users 三列新字段 -----------------------------------------------------
ALTER TABLE users
    ADD COLUMN verified     TINYINT      NOT NULL DEFAULT 0   COMMENT '认证标记: 0=普通,1=已认证 (管理后台上线前由 SQL 手工更新)' AFTER tags_json,
    ADD COLUMN role_title   VARCHAR(20)  NULL                 COMMENT '角色头衔，如「华润元大基金管理-公司基金经理」'                AFTER verified,
    ADD COLUMN banner_image VARCHAR(500) NULL                 COMMENT '个人主页顶部 banner 图 URL'                                    AFTER role_title;

-- 2. topics 表 -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS topics (
    tag           VARCHAR(64)  NOT NULL PRIMARY KEY,
    post_count    INT          NOT NULL DEFAULT 0,
    view_count    BIGINT       NOT NULL DEFAULT 0,
    last_used_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_hot (post_count DESC, last_used_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '话题主表，PK=tag (话题字符串本身)';

-- 3. drafts 表 -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS drafts (
    id           BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    user_id      BIGINT UNSIGNED NOT NULL,
    title        VARCHAR(120) NULL,
    content_url  VARCHAR(500) NULL              COMMENT 'OSS markdown URL，与 know_posts.content_url 同结构',
    tags         JSON         NULL,
    circle_id    BIGINT UNSIGNED NULL,
    cover_image  VARCHAR(500) NULL,
    updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_user (user_id, updated_at DESC),
    CONSTRAINT fk_draft_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    CONSTRAINT fk_draft_circle FOREIGN KEY (circle_id) REFERENCES circles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '草稿箱: 每个用户的未发布稿件';

-- 4. user_settings 表 ----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
    user_id           BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    notification_pref JSON         NULL                  COMMENT '通知偏好 JSON，如 {"like":true,"comment":true,"follow":false,"system":true}',
    privacy           JSON         NULL                  COMMENT '隐私设置 JSON，如 {"hideFollowing":false,"hideCollections":true}',
    theme             VARCHAR(16)  NOT NULL DEFAULT 'light',
    language          VARCHAR(16)  NOT NULL DEFAULT 'zh-CN',
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '用户偏好设置';

-- 5. activities 表 -------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id          BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL                COMMENT '行为发起人',
    type        ENUM('POST','LIKE','FAVORITE','FOLLOW','JOIN_CIRCLE') NOT NULL,
    target_type ENUM('POST','USER','CIRCLE') NOT NULL,
    target_id   BIGINT UNSIGNED NOT NULL,
    payload     JSON         NULL                       COMMENT '冗余信息，如 post 标题/封面，避免读放大',
    created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_user_time (user_id, created_at DESC),
    INDEX idx_archive (created_at)                      COMMENT '90 天归档定时任务用',
    CONSTRAINT fk_act_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT '用户行为时间线，由 Kafka 消费者从 counter-events 和 outbox 聚合';
```

- [ ] **Step 2: Visual review against V1 patterns**

Compare against `V1__feature_completion.sql`. Confirm:
- 表都用 `BIGINT UNSIGNED NOT NULL PRIMARY KEY` (应用层 ID); 唯一例外是 topics (PK=tag string)
- 时间列都用 `DATETIME(3)`
- 引擎 `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
- 外键显式 `ON DELETE CASCADE` 或 `SET NULL`
- 索引命名 `idx_xxx` / 唯一键 `uk_xxx` / 外键 `fk_xxx_xxx`

- [ ] **Step 3: Commit**

```bash
git add yixiang_be/db/migrations/V2__p1_base.sql
git commit -m "feat(db): V2 migration — users 3 cols + topics/drafts/user_settings/activities tables"
```

---

### Task 2: Extend User domain class

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/user/domain/User.java`

- [ ] **Step 1: Add 3 new fields**

Open the file. Find:

```java
    private String tagsJson;
    private Instant createdAt;
```

Replace with:

```java
    private String tagsJson;
    private Boolean verified;
    private String roleTitle;
    private String bannerImage;
    private Instant createdAt;
```

`Boolean` (boxed) is used, not `boolean`, so legacy rows with unmapped values surface as null (safer for partial mapper coverage).

- [ ] **Step 2: Verify compile**

```bash
cd yixiang_be && mvn compile
```

Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/user/domain/User.java
git commit -m "feat(user): add verified, roleTitle, bannerImage to User domain"
```

---

### Task 3: Update UserMapper.xml + UserMapper.java

**Files:**
- Modify: `yixiang_be/src/main/resources/mapper/UserMapper.xml`
- Modify: `yixiang_be/src/main/java/com/tongji/user/mapper/UserMapper.java`

- [ ] **Step 1: Extend UserResultMap with 3 new columns**

In `UserMapper.xml`, find the `<resultMap id="UserResultMap" ...>` block (lines 7–22). After `<result column="tags_json" property="tagsJson"/>` add:

```xml
        <result column="verified" property="verified"/>
        <result column="role_title" property="roleTitle"/>
        <result column="banner_image" property="bannerImage"/>
```

- [ ] **Step 2: Skip insert changes**

The 3 new columns have DB defaults (verified=0, role_title/banner_image NULL). New rows pick defaults — `insert` does NOT need changes.

- [ ] **Step 3: Extend updateProfile to allow updating bannerImage and roleTitle**

In `<update id="updateProfile">` (lines 100–114), after `<if test="avatar != null">avatar = #{avatar},</if>` add:

```xml
            <if test="roleTitle != null">role_title = #{roleTitle},</if>
            <if test="bannerImage != null">banner_image = #{bannerImage},</if>
```

`verified` is NOT updatable via profile endpoint — only via direct SQL by admin.

- [ ] **Step 4: Add listSummariesByIds query**

After the existing `<select id="listByIds">` block (lines 125–132), add:

```xml
    <select id="listSummariesByIds" resultMap="UserResultMap">
        SELECT id, nickname, avatar, bio, verified, role_title, banner_image
        FROM users
        WHERE id IN
        <foreach collection="ids" item="id" open="(" separator="," close=")">
            #{id}
        </foreach>
    </select>
```

(Reuses UserResultMap; uncovered columns return null — fine for summary cards.)

- [ ] **Step 5: Declare the method on UserMapper interface**

Open `yixiang_be/src/main/java/com/tongji/user/mapper/UserMapper.java`. Add method:

```java
    List<User> listSummariesByIds(@Param("ids") Collection<Long> ids);
```

If `@Param` and `Collection` imports missing, add at top:

```java
import org.apache.ibatis.annotations.Param;
import java.util.Collection;
```

- [ ] **Step 6: Verify compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/resources/mapper/UserMapper.xml yixiang_be/src/main/java/com/tongji/user/mapper/UserMapper.java
git commit -m "feat(user): extend mapper with 3 new cols + listSummariesByIds"
```

---

### Task 4: Add UserSummary record

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/user/api/dto/UserSummary.java`

- [ ] **Step 1: Create directory + file**

Create directory if absent: `yixiang_be/src/main/java/com/tongji/user/api/dto/`

Create `UserSummary.java`:

```java
package com.tongji.user.api.dto;

import com.tongji.user.domain.User;

/**
 * 完整用户摘要，含 banner / verified / roleTitle — 用于个人主页、卡片等富信息场景。
 */
public record UserSummary(
        Long id,
        String nickname,
        String avatar,
        String bio,
        Boolean verified,
        String roleTitle,
        String bannerImage
) {
    public static UserSummary from(User u) {
        return new UserSummary(
                u.getId(),
                u.getNickname(),
                u.getAvatar(),
                u.getBio(),
                u.getVerified() != null && u.getVerified(),
                u.getRoleTitle(),
                u.getBannerImage()
        );
    }
}
```

- [ ] **Step 2: Verify compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/user/api/dto/UserSummary.java
git commit -m "feat(user): add UserSummary DTO record"
```

---

### Task 5: Add UserBrief record

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/user/api/dto/UserBrief.java`

- [ ] **Step 1: Create file**

```java
package com.tongji.user.api.dto;

import com.tongji.user.domain.User;

/**
 * 最小用户信息，用于 recentLikers chip、关注按钮等空间受限场景。
 */
public record UserBrief(
        Long id,
        String nickname,
        String avatar,
        Boolean verified
) {
    public static UserBrief from(User u) {
        return new UserBrief(
                u.getId(),
                u.getNickname(),
                u.getAvatar(),
                u.getVerified() != null && u.getVerified()
        );
    }
}
```

- [ ] **Step 2: Verify compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/user/api/dto/UserBrief.java
git commit -m "feat(user): add UserBrief DTO record"
```

---

### Task 6: Add 7 new ErrorCodes

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/common/exception/ErrorCode.java`

- [ ] **Step 1: Append new codes**

Find:

```java
    ALREADY_CIRCLE_MEMBER("ALREADY_CIRCLE_MEMBER", "已经是圈子成员");
```

Replace with:

```java
    ALREADY_CIRCLE_MEMBER("ALREADY_CIRCLE_MEMBER", "已经是圈子成员"),
    TOPIC_NOT_FOUND("TOPIC_NOT_FOUND", "话题不存在"),
    DRAFT_NOT_FOUND("DRAFT_NOT_FOUND", "草稿不存在"),
    DRAFT_FORBIDDEN("DRAFT_FORBIDDEN", "无权操作该草稿"),
    DRAFT_PUBLISH_INVALID("DRAFT_PUBLISH_INVALID", "草稿信息不完整,无法发布"),
    SETTINGS_INVALID_PAYLOAD("SETTINGS_INVALID_PAYLOAD", "设置项格式错误"),
    HOT_PERIOD_INVALID("HOT_PERIOD_INVALID", "热门时间窗口参数错误"),
    RECOMMEND_TYPE_INVALID("RECOMMEND_TYPE_INVALID", "推荐类型错误");
```

- [ ] **Step 2: Verify compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/common/exception/ErrorCode.java
git commit -m "feat(common): add 7 ErrorCodes for hot/topic/draft/settings/recommend"
```

---

### Task 7: Extend ProfileResponse with 3 new fields

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/profile/api/dto/ProfileResponse.java`
- Modify: `yixiang_be/src/main/java/com/tongji/profile/service/impl/ProfileServiceImpl.java`

- [ ] **Step 1: Add 3 fields to ProfileResponse record**

Replace the entire record with:

```java
package com.tongji.profile.api.dto;

import java.time.LocalDate;

public record ProfileResponse(
        Long id,
        String nickname,
        String avatar,
        String bio,
        String zgId,
        String gender,
        LocalDate birthday,
        String school,
        String phone,
        String email,
        String tagJson,
        Boolean verified,
        String roleTitle,
        String bannerImage
) {}
```

- [ ] **Step 2: Update every `new ProfileResponse(...)` call site**

Open `ProfileServiceImpl.java`. Use `grep` to locate all `new ProfileResponse(` occurrences:

```bash
grep -n "new ProfileResponse(" yixiang_be/src/main/java/com/tongji/profile/service/impl/ProfileServiceImpl.java
```

For each call, append three arguments matching the new record fields, in order:

```java
                u.getVerified() != null && u.getVerified(),
                u.getRoleTitle(),
                u.getBannerImage()
```

- [ ] **Step 3: Verify compile**

```bash
cd yixiang_be && mvn compile
```

Expected: BUILD SUCCESS. If compile fails because more callers exist (e.g., a `UserResponse` adapter elsewhere), grep wider and fix all of them:

```bash
grep -rn "new ProfileResponse(" yixiang_be/src
```

- [ ] **Step 4: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/profile/api/dto/ProfileResponse.java yixiang_be/src/main/java/com/tongji/profile/service/impl/ProfileServiceImpl.java
git commit -m "feat(profile): pass verified/roleTitle/bannerImage through ProfileResponse"
```

---

### Task 8: Section A smoke test

**Files:** none modified.

- [ ] **Step 1: Full build (skip tests that need live DB)**

```bash
cd yixiang_be && mvn clean package -DskipTests
```

Expected: BUILD SUCCESS.

- [ ] **Step 2: Run pure-unit tests that don't need DB**

```bash
mvn test -Dtest=JwtServiceTest,HotKeyDetectorTest,CommentEventProducerTest
```

Expected: all pass.

- [ ] **Step 3: Mark Section A done**

No commit needed. Section A is complete; Sections B–H can now proceed.

---

## Section B: hot module — `com.tongji.hot`

**Goal:** Implement `GET /api/v1/hot/posts?period=24h|7d|30d&cursor=&size=` that returns top posts ordered by like-count in the period. No new tables. Read from `know_posts` + counter Redis SDS. Caffeine 60s cache (key = period+cursor+size).

**Endpoint contract:**
```
GET /api/v1/hot/posts?period=24h&cursor=&size=20
→ 200 { items: [HotPostResponse], nextCursor: "<base64-or-null>" }
period ∈ {"24h","7d","30d"}; default "24h"; invalid → 400 HOT_PERIOD_INVALID
size: default 20, max 50
cursor: opaque; first call omits it
```

---

### Task 9: Create HotPostResponse DTO

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/hot/api/dto/HotPostResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/hot/api/dto/HotPostListResponse.java`

- [ ] **Step 1: Create directories**

```bash
mkdir -p yixiang_be/src/main/java/com/tongji/hot/api/dto
mkdir -p yixiang_be/src/main/java/com/tongji/hot/service/impl
```

- [ ] **Step 2: Create HotPostResponse**

`yixiang_be/src/main/java/com/tongji/hot/api/dto/HotPostResponse.java`:

```java
package com.tongji.hot.api.dto;

import com.tongji.user.api.dto.UserBrief;

import java.time.Instant;
import java.util.List;

public record HotPostResponse(
        Long id,
        String title,
        String summary,
        String coverImage,
        List<String> tags,
        UserBrief author,
        long likeCount,
        long commentCount,
        long favoriteCount,
        Instant createdAt
) {}
```

- [ ] **Step 3: Create HotPostListResponse**

`yixiang_be/src/main/java/com/tongji/hot/api/dto/HotPostListResponse.java`:

```java
package com.tongji.hot.api.dto;

import java.util.List;

public record HotPostListResponse(
        List<HotPostResponse> items,
        String nextCursor
) {}
```

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/hot/api/dto/
git commit -m "feat(hot): HotPostResponse + HotPostListResponse DTOs"
```

---

### Task 10: HotService interface + period enum

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/hot/service/HotPeriod.java`
- Create: `yixiang_be/src/main/java/com/tongji/hot/service/HotService.java`

- [ ] **Step 1: Create HotPeriod enum**

```java
package com.tongji.hot.service;

import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;

import java.time.Duration;

public enum HotPeriod {
    H24(Duration.ofHours(24), "24h"),
    D7(Duration.ofDays(7), "7d"),
    D30(Duration.ofDays(30), "30d");

    private final Duration window;
    private final String code;

    HotPeriod(Duration window, String code) {
        this.window = window;
        this.code = code;
    }

    public Duration window() { return window; }
    public String code() { return code; }

    public static HotPeriod parse(String s) {
        if (s == null || s.isBlank()) return H24;
        for (HotPeriod p : values()) {
            if (p.code.equals(s)) return p;
        }
        throw new BusinessException(ErrorCode.HOT_PERIOD_INVALID);
    }
}
```

- [ ] **Step 2: Create HotService interface**

```java
package com.tongji.hot.service;

import com.tongji.hot.api.dto.HotPostListResponse;

public interface HotService {
    HotPostListResponse listHotPosts(HotPeriod period, String cursor, int size);
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/hot/service/
git commit -m "feat(hot): HotService interface + HotPeriod enum"
```

---

### Task 11: HotServiceImpl with Caffeine 60s cache

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/hot/service/impl/HotServiceImpl.java`

- [ ] **Step 1: Create implementation**

```java
package com.tongji.hot.service.impl;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.tongji.counter.service.CounterService;
import com.tongji.hot.api.dto.HotPostListResponse;
import com.tongji.hot.api.dto.HotPostResponse;
import com.tongji.hot.service.HotPeriod;
import com.tongji.hot.service.HotService;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import com.tongji.user.api.dto.UserBrief;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HotServiceImpl implements HotService {

    private static final int MAX_SIZE = 50;
    private static final int CANDIDATE_POOL = 200;  // Query 200 candidates then sort by likes in-memory

    private final KnowPostMapper postMapper;
    private final UserMapper userMapper;
    private final CounterService counterService;
    private final ObjectMapper objectMapper;

    private final Cache<String, HotPostListResponse> cache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(60))
            .maximumSize(300)
            .build();

    public HotServiceImpl(KnowPostMapper postMapper,
                          UserMapper userMapper,
                          CounterService counterService,
                          ObjectMapper objectMapper) {
        this.postMapper = postMapper;
        this.userMapper = userMapper;
        this.counterService = counterService;
        this.objectMapper = objectMapper;
    }

    @Override
    public HotPostListResponse listHotPosts(HotPeriod period, String cursor, int size) {
        int effective = Math.min(Math.max(size, 1), MAX_SIZE);
        String cacheKey = period.code() + "|" + (cursor == null ? "" : cursor) + "|" + effective;
        return cache.get(cacheKey, k -> compute(period, cursor, effective));
    }

    private HotPostListResponse compute(HotPeriod period, String cursor, int size) {
        Instant since = Instant.now().minus(period.window());
        int offset = decodeCursor(cursor);

        List<KnowPost> candidates = postMapper.listPublishedSince(since, CANDIDATE_POOL);
        if (candidates.isEmpty()) {
            return new HotPostListResponse(List.of(), null);
        }

        // Fetch like-count for each candidate; sort desc; paginate.
        List<KnowPost> sorted = candidates.stream()
                .sorted((a, b) -> Long.compare(
                        counterService.getCount("post", String.valueOf(b.getId()), "like"),
                        counterService.getCount("post", String.valueOf(a.getId()), "like")))
                .toList();

        int from = Math.min(offset, sorted.size());
        int to = Math.min(from + size, sorted.size());
        List<KnowPost> page = sorted.subList(from, to);

        Set<Long> authorIds = page.stream().map(KnowPost::getCreatorId).collect(Collectors.toSet());
        Map<Long, UserBrief> authors = userMapper.listSummariesByIds(authorIds).stream()
                .collect(Collectors.toMap(User::getId, UserBrief::from));

        List<HotPostResponse> items = page.stream().map(p -> new HotPostResponse(
                p.getId(),
                p.getTitle(),
                p.getSummary(),
                p.getCoverImage(),
                parseTags(p.getTagsJson()),
                authors.get(p.getCreatorId()),
                counterService.getCount("post", String.valueOf(p.getId()), "like"),
                counterService.getCount("post", String.valueOf(p.getId()), "comment"),
                counterService.getCount("post", String.valueOf(p.getId()), "favorite"),
                p.getCreateTime()
        )).toList();

        String nextCursor = to < sorted.size() ? encodeCursor(to) : null;
        return new HotPostListResponse(items, nextCursor);
    }

    private List<String> parseTags(String tagsJson) {
        if (tagsJson == null || tagsJson.isBlank()) return List.of();
        try {
            return objectMapper.readValue(tagsJson, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private int decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try {
            return Math.max(0, Integer.parseInt(cursor));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private String encodeCursor(int offset) {
        return String.valueOf(offset);
    }
}
```

- [ ] **Step 2: Verify KnowPostMapper has the required method**

```bash
grep -n "listPublishedSince" yixiang_be/src/main/java/com/tongji/knowpost/mapper/KnowPostMapper.java yixiang_be/src/main/resources/mapper/KnowPostMapper.xml
```

If absent (likely), add it.

Open `KnowPostMapper.java` and add:

```java
    List<KnowPost> listPublishedSince(@Param("since") Instant since, @Param("limit") int limit);
```

(Add imports if missing: `java.time.Instant`, `org.apache.ibatis.annotations.Param`, `java.util.List`.)

Open `KnowPostMapper.xml` and append before `</mapper>`:

```xml
    <select id="listPublishedSince" resultMap="KnowPostResultMap">
        SELECT *
        FROM know_posts
        WHERE status = 'PUBLISHED'
          AND create_time &gt;= #{since}
        ORDER BY create_time DESC
        LIMIT #{limit}
    </select>
```

(Verify the resultMap is named `KnowPostResultMap` — adjust if different by reading the file.)

- [ ] **Step 3: Verify CounterService API**

```bash
grep -n "long getCount\|getCount(" yixiang_be/src/main/java/com/tongji/counter/service/CounterService.java
```

Expected signature: `long getCount(String entityType, String entityId, String metric)`. If signature differs, adjust call sites in HotServiceImpl.

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/hot/ yixiang_be/src/main/java/com/tongji/knowpost/ yixiang_be/src/main/resources/mapper/KnowPostMapper.xml
git commit -m "feat(hot): HotServiceImpl with Caffeine 60s cache; KnowPostMapper.listPublishedSince"
```

---

### Task 12: HotController

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/hot/api/HotController.java`

- [ ] **Step 1: Create controller**

```java
package com.tongji.hot.api;

import com.tongji.hot.api.dto.HotPostListResponse;
import com.tongji.hot.service.HotPeriod;
import com.tongji.hot.service.HotService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hot")
public class HotController {

    private final HotService hotService;

    public HotController(HotService hotService) {
        this.hotService = hotService;
    }

    @GetMapping("/posts")
    public HotPostListResponse hotPosts(
            @RequestParam(value = "period", required = false) String period,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return hotService.listHotPosts(HotPeriod.parse(period), cursor, size);
    }
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/hot/api/HotController.java
git commit -m "feat(hot): HotController GET /api/v1/hot/posts"
```

---

### Task 13: Security config — `/api/v1/hot/**` is public

**Files:**
- Modify: existing SecurityConfig

- [ ] **Step 1: Locate SecurityConfig**

```bash
grep -rln "SecurityFilterChain\|oauth2ResourceServer" yixiang_be/src/main/java/com/tongji/auth yixiang_be/src/main/java/com/tongji/config
```

- [ ] **Step 2: Add hot endpoints to permitAll**

In the located file, find the existing public endpoint list (usually a `requestMatchers(...).permitAll()` chain that includes `/actuator/health`, `/api/v1/auth/**`, etc). Append:

```java
.requestMatchers("/api/v1/hot/**").permitAll()
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add -u yixiang_be/src
git commit -m "feat(security): expose /api/v1/hot/** as public"
```

---

### Task 14: Section B smoke test

- [ ] **Step 1: Full build**

```bash
cd yixiang_be && mvn clean package -DskipTests
```

Expected: BUILD SUCCESS.

- [ ] **Step 2: Manual smoke (only if test DB/Redis available)**

```bash
mvn spring-boot:run
# in another terminal:
curl -s "http://localhost:8080/api/v1/hot/posts?period=24h&size=5" | head -100
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8080/api/v1/hot/posts?period=bad"  # → 400
```

Expected: 200 with `items` array (possibly empty if seed data lacks posts in window). Invalid period → 400 with `HOT_PERIOD_INVALID`.

Skip Step 2 if no live infra. The compile + DI wiring is the real verification.

---

## Section C: topic module — `com.tongji.topic`

**Goal:** Implement话题 (topics). New table `topics` (PK=tag string). 3 endpoints:
```
GET  /api/v1/topics/hot                  → top 20 by post_count, public
GET  /api/v1/topics/{tag}/posts          → posts containing this tag, cursor pagination, public
POST /api/v1/topics/{tag}/view           → INCR Redis counter; async flush to DB (auth required)
```

**Hot-key protection:** `view` endpoint does NOT directly `UPDATE topics SET view_count`. Instead `INCR topic:view:{tag}` in Redis, and a scheduled `@Scheduled(fixedDelay=60s)` task flushes deltas to DB.

---

### Task 15: Topic domain class

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/topic/model/Topic.java`

- [ ] **Step 1: Create directories**

```bash
mkdir -p yixiang_be/src/main/java/com/tongji/topic/{model,mapper,service/impl,api/dto,job}
```

- [ ] **Step 2: Create Topic.java**

```java
package com.tongji.topic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Topic {
    private String tag;
    private Integer postCount;
    private Long viewCount;
    private Instant lastUsedAt;
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/topic/model/Topic.java
git commit -m "feat(topic): Topic domain class"
```

---

### Task 16: TopicMapper + XML

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/topic/mapper/TopicMapper.java`
- Create: `yixiang_be/src/main/resources/mapper/TopicMapper.xml`

- [ ] **Step 1: TopicMapper interface**

```java
package com.tongji.topic.mapper;

import com.tongji.topic.model.Topic;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

public interface TopicMapper {
    List<Topic> listHot(@Param("limit") int limit);
    Topic findByTag(@Param("tag") String tag);
    void upsertOnPost(@Param("tag") String tag);
    void incrementViewBatch(@Param("deltas") Map<String, Long> deltas);
}
```

- [ ] **Step 2: TopicMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.topic.mapper.TopicMapper">

    <resultMap id="TopicResultMap" type="com.tongji.topic.model.Topic">
        <id     column="tag"          property="tag"/>
        <result column="post_count"   property="postCount"/>
        <result column="view_count"   property="viewCount"/>
        <result column="last_used_at" property="lastUsedAt"/>
    </resultMap>

    <select id="listHot" resultMap="TopicResultMap">
        SELECT * FROM topics
        ORDER BY post_count DESC, last_used_at DESC
        LIMIT #{limit}
    </select>

    <select id="findByTag" resultMap="TopicResultMap">
        SELECT * FROM topics WHERE tag = #{tag}
    </select>

    <insert id="upsertOnPost">
        INSERT INTO topics (tag, post_count, view_count, last_used_at)
        VALUES (#{tag}, 1, 0, CURRENT_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE
            post_count   = post_count + 1,
            last_used_at = CURRENT_TIMESTAMP(3)
    </insert>

    <update id="incrementViewBatch">
        <foreach collection="deltas" index="tag" item="delta" separator=";">
            UPDATE topics SET view_count = view_count + #{delta} WHERE tag = #{tag}
        </foreach>
    </update>

</mapper>
```

- [ ] **Step 3: Verify MyBatis multi-statement support**

`incrementViewBatch` uses `;` separator. Verify your datasource URL has `allowMultiQueries=true`:

```bash
grep -n "url:\|jdbc.url" yixiang_be/src/main/resources/application.yml yixiang_be/src/main/resources/application.yml.example 2>/dev/null
```

If `allowMultiQueries=true` is absent, update `application.yml.example` to include it on the JDBC URL (note in the commit so the executor remembers to also update `application.yml`):

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/yixiang?serverTimezone=Asia/Shanghai&allowMultiQueries=true
```

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/topic/mapper/ yixiang_be/src/main/resources/mapper/TopicMapper.xml yixiang_be/src/main/resources/application.yml.example
git commit -m "feat(topic): TopicMapper + XML; allowMultiQueries flag"
```

---

### Task 17: TopicService interface + DTOs

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/topic/service/TopicService.java`
- Create: `yixiang_be/src/main/java/com/tongji/topic/api/dto/TopicResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/topic/api/dto/TopicPostListResponse.java`

- [ ] **Step 1: TopicResponse DTO**

```java
package com.tongji.topic.api.dto;

public record TopicResponse(
        String tag,
        int postCount,
        long viewCount
) {}
```

- [ ] **Step 2: TopicPostListResponse DTO**

```java
package com.tongji.topic.api.dto;

import com.tongji.hot.api.dto.HotPostResponse;

import java.util.List;

public record TopicPostListResponse(
        String tag,
        List<HotPostResponse> items,
        String nextCursor
) {}
```

(Reusing `HotPostResponse` since the shape is identical — author + counters + meta.)

- [ ] **Step 3: TopicService interface**

```java
package com.tongji.topic.service;

import com.tongji.topic.api.dto.TopicPostListResponse;
import com.tongji.topic.api.dto.TopicResponse;

import java.util.List;

public interface TopicService {
    List<TopicResponse> listHot(int limit);
    TopicPostListResponse listPostsByTag(String tag, String cursor, int size);
    void recordView(String tag);
    void onPostCreated(java.util.List<String> tags);
}
```

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/topic/api/dto/ yixiang_be/src/main/java/com/tongji/topic/service/TopicService.java
git commit -m "feat(topic): TopicService interface + DTOs"
```

---

### Task 18: TopicServiceImpl

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/topic/service/impl/TopicServiceImpl.java`

- [ ] **Step 1: Implementation**

```java
package com.tongji.topic.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.counter.service.CounterService;
import com.tongji.hot.api.dto.HotPostResponse;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import com.tongji.topic.api.dto.TopicPostListResponse;
import com.tongji.topic.api.dto.TopicResponse;
import com.tongji.topic.mapper.TopicMapper;
import com.tongji.topic.model.Topic;
import com.tongji.topic.service.TopicService;
import com.tongji.user.api.dto.UserBrief;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TopicServiceImpl implements TopicService {

    private static final String VIEW_KEY_PREFIX = "topic:view:";
    private static final Duration VIEW_KEY_TTL = Duration.ofDays(7);
    private static final int MAX_HOT_LIMIT = 50;
    private static final int MAX_POST_SIZE = 50;

    private final TopicMapper topicMapper;
    private final KnowPostMapper postMapper;
    private final UserMapper userMapper;
    private final CounterService counterService;
    private final RedissonClient redisson;
    private final ObjectMapper objectMapper;

    public TopicServiceImpl(TopicMapper topicMapper,
                            KnowPostMapper postMapper,
                            UserMapper userMapper,
                            CounterService counterService,
                            RedissonClient redisson,
                            ObjectMapper objectMapper) {
        this.topicMapper = topicMapper;
        this.postMapper = postMapper;
        this.userMapper = userMapper;
        this.counterService = counterService;
        this.redisson = redisson;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<TopicResponse> listHot(int limit) {
        int n = Math.min(Math.max(limit, 1), MAX_HOT_LIMIT);
        return topicMapper.listHot(n).stream()
                .map(t -> new TopicResponse(t.getTag(), t.getPostCount(), t.getViewCount()))
                .toList();
    }

    @Override
    public TopicPostListResponse listPostsByTag(String tag, String cursor, int size) {
        Topic topic = topicMapper.findByTag(tag);
        if (topic == null) throw new BusinessException(ErrorCode.TOPIC_NOT_FOUND);

        int effective = Math.min(Math.max(size, 1), MAX_POST_SIZE);
        int offset = decodeCursor(cursor);

        List<KnowPost> page = postMapper.listByTag(tag, offset, effective + 1);  // fetch +1 to detect next
        boolean hasMore = page.size() > effective;
        if (hasMore) page = page.subList(0, effective);

        Set<Long> authorIds = page.stream().map(KnowPost::getCreatorId).collect(Collectors.toSet());
        Map<Long, UserBrief> authors = authorIds.isEmpty() ? Map.of() :
                userMapper.listSummariesByIds(authorIds).stream()
                        .collect(Collectors.toMap(User::getId, UserBrief::from));

        List<HotPostResponse> items = page.stream().map(p -> new HotPostResponse(
                p.getId(), p.getTitle(), p.getSummary(), p.getCoverImage(),
                parseTags(p.getTagsJson()),
                authors.get(p.getCreatorId()),
                counterService.getCount("post", String.valueOf(p.getId()), "like"),
                counterService.getCount("post", String.valueOf(p.getId()), "comment"),
                counterService.getCount("post", String.valueOf(p.getId()), "favorite"),
                p.getCreateTime()
        )).toList();

        String nextCursor = hasMore ? String.valueOf(offset + effective) : null;
        return new TopicPostListResponse(tag, items, nextCursor);
    }

    @Override
    public void recordView(String tag) {
        RAtomicLong c = redisson.getAtomicLong(VIEW_KEY_PREFIX + tag);
        long v = c.incrementAndGet();
        if (v == 1L) {
            c.expire(VIEW_KEY_TTL);
        }
    }

    @Override
    public void onPostCreated(List<String> tags) {
        if (tags == null) return;
        for (String tag : tags) {
            if (tag != null && !tag.isBlank()) {
                topicMapper.upsertOnPost(tag);
            }
        }
    }

    private List<String> parseTags(String tagsJson) {
        if (tagsJson == null || tagsJson.isBlank()) return List.of();
        try {
            return objectMapper.readValue(tagsJson, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private int decodeCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) return 0;
        try { return Math.max(0, Integer.parseInt(cursor)); }
        catch (NumberFormatException e) { return 0; }
    }
}
```

- [ ] **Step 2: Add `listByTag` to KnowPostMapper**

Open `yixiang_be/src/main/java/com/tongji/knowpost/mapper/KnowPostMapper.java`:

```java
    List<KnowPost> listByTag(@Param("tag") String tag, @Param("offset") int offset, @Param("limit") int limit);
```

Open `yixiang_be/src/main/resources/mapper/KnowPostMapper.xml` and append before `</mapper>`:

```xml
    <select id="listByTag" resultMap="KnowPostResultMap">
        SELECT *
        FROM know_posts
        WHERE status = 'PUBLISHED'
          AND JSON_CONTAINS(tags_json, JSON_QUOTE(#{tag}))
        ORDER BY create_time DESC
        LIMIT #{limit} OFFSET #{offset}
    </select>
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/topic/ yixiang_be/src/main/java/com/tongji/knowpost/ yixiang_be/src/main/resources/mapper/KnowPostMapper.xml
git commit -m "feat(topic): TopicServiceImpl with Redis view INCR; KnowPostMapper.listByTag"
```

---

### Task 19: TopicViewFlushJob (60s scheduled)

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/topic/job/TopicViewFlushJob.java`

- [ ] **Step 1: Implementation**

```java
package com.tongji.topic.job;

import com.tongji.topic.mapper.TopicMapper;
import org.redisson.api.RKeys;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class TopicViewFlushJob {

    private static final Logger log = LoggerFactory.getLogger(TopicViewFlushJob.class);
    private static final String PREFIX = "topic:view:";
    private static final String FLUSHING_PREFIX = "topic:view:flushing:";

    private final RedissonClient redisson;
    private final TopicMapper topicMapper;

    public TopicViewFlushJob(RedissonClient redisson, TopicMapper topicMapper) {
        this.redisson = redisson;
        this.topicMapper = topicMapper;
    }

    /** Drains topic:view:{tag} counters every 60s into DB. */
    @Scheduled(fixedDelay = 60_000L)
    public void flush() {
        RKeys keys = redisson.getKeys();
        Map<String, Long> deltas = new HashMap<>();
        // Iterable<String> — Redisson scans with COUNT under the hood; safe for many keys.
        for (String key : keys.getKeysByPattern(PREFIX + "*")) {
            if (key.startsWith(FLUSHING_PREFIX)) continue;
            RAtomicLong c = redisson.getAtomicLong(key);
            long v = c.getAndSet(0);
            if (v > 0) {
                String tag = key.substring(PREFIX.length());
                deltas.put(tag, v);
            }
        }
        if (!deltas.isEmpty()) {
            try {
                topicMapper.incrementViewBatch(deltas);
                log.info("topic view flush: {} tags", deltas.size());
            } catch (Exception e) {
                log.error("topic view flush failed; deltas dropped", e);
                // Acceptable: view_count is best-effort, not source of truth.
            }
        }
    }
}
```

- [ ] **Step 2: Enable scheduling**

Check `ZhiGuangApplication.java`:

```bash
grep -n "EnableScheduling" yixiang_be/src/main/java/com/tongji/ZhiGuangApplication.java
```

If absent, add `@EnableScheduling`:

```java
@SpringBootApplication
@EnableScheduling   // add this line
public class ZhiGuangApplication { ... }
```

Add the import if missing:

```java
import org.springframework.scheduling.annotation.EnableScheduling;
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/topic/job/ yixiang_be/src/main/java/com/tongji/ZhiGuangApplication.java
git commit -m "feat(topic): TopicViewFlushJob — 60s drain Redis counters to DB; enable scheduling"
```

---

### Task 20: TopicController

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/topic/api/TopicController.java`

- [ ] **Step 1: Controller**

```java
package com.tongji.topic.api;

import com.tongji.topic.api.dto.TopicPostListResponse;
import com.tongji.topic.api.dto.TopicResponse;
import com.tongji.topic.service.TopicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/topics")
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping("/hot")
    public List<TopicResponse> hot(@RequestParam(value = "limit", defaultValue = "20") int limit) {
        return topicService.listHot(limit);
    }

    @GetMapping("/{tag}/posts")
    public TopicPostListResponse posts(@PathVariable String tag,
                                       @RequestParam(value = "cursor", required = false) String cursor,
                                       @RequestParam(value = "size", defaultValue = "20") int size) {
        return topicService.listPostsByTag(tag, cursor, size);
    }

    @PostMapping("/{tag}/view")
    public ResponseEntity<Void> view(@PathVariable String tag) {
        topicService.recordView(tag);
        return ResponseEntity.accepted().build();
    }
}
```

- [ ] **Step 2: Open `/api/v1/topics/hot` and `/api/v1/topics/{tag}/posts` to public; `/view` requires auth**

In SecurityConfig, add:

```java
.requestMatchers(HttpMethod.GET, "/api/v1/topics/**").permitAll()
```

(Leave POST under default authenticated rule.)

- [ ] **Step 3: Hook up TopicService.onPostCreated to KnowPost publish flow**

Locate where new posts are persisted:

```bash
grep -rln "knowPostMapper.insert\|@Transactional.*public.*publish" yixiang_be/src/main/java/com/tongji/knowpost
```

In the service method that finalizes publish, inject `TopicService` and after `knowPostMapper.insert(post)` call:

```java
topicService.onPostCreated(post.getTagsList());   // or parseTags(post.getTagsJson()) if no list getter
```

If `getTagsList()` is absent, decode `getTagsJson()` with ObjectMapper inline (same pattern as HotServiceImpl#parseTags).

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add -u yixiang_be/src
git add yixiang_be/src/main/java/com/tongji/topic/api/
git commit -m "feat(topic): TopicController + security + hook publish flow"
```

---

### Task 21: Section C smoke test

- [ ] **Step 1: Full build**

```bash
cd yixiang_be && mvn clean package -DskipTests
```

Expected: BUILD SUCCESS.

- [ ] **Step 2: Optional live smoke (skip if no DB+Redis)**

```bash
mvn spring-boot:run &
APP_PID=$!
sleep 25
curl -s "http://localhost:8080/api/v1/topics/hot?limit=5"
curl -s -X POST "http://localhost:8080/api/v1/topics/Java/view" -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}\n"   # 202
sleep 65   # wait flush job
mysql ... -e "SELECT * FROM topics WHERE tag='Java';"   # view_count should be ≥1
kill $APP_PID
```

---

## Section D: recommend module — `com.tongji.recommend`

**Goal:** Right-rail 推荐关注 + 推荐圈子. No new tables (rank by follower_count / member_count). Caffeine 60s cache because recency is unimportant. 2 endpoints:
```
GET /api/v1/recommend/users?limit=5     → public, exclude viewer & already-followed
GET /api/v1/recommend/circles?limit=5   → public, exclude viewer-joined
```

---

### Task 22: Recommend DTOs

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/recommend/api/dto/RecommendUserResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/recommend/api/dto/RecommendCircleResponse.java`

- [ ] **Step 1: Create directories**

```bash
mkdir -p yixiang_be/src/main/java/com/tongji/recommend/{api/dto,service/impl}
```

- [ ] **Step 2: RecommendUserResponse**

```java
package com.tongji.recommend.api.dto;

public record RecommendUserResponse(
        Long id,
        String nickname,
        String avatar,
        String bio,
        String roleTitle,
        Boolean verified,
        long followerCount,
        boolean followed
) {}
```

- [ ] **Step 3: RecommendCircleResponse**

```java
package com.tongji.recommend.api.dto;

public record RecommendCircleResponse(
        Long id,
        String name,
        String avatarUrl,
        String description,
        String category,
        int memberCount,
        boolean joined
) {}
```

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/recommend/api/dto/
git commit -m "feat(recommend): DTOs"
```

---

### Task 23: Mapper helper queries

**Files:**
- Modify: `yixiang_be/src/main/resources/mapper/UserMapper.xml` + `UserMapper.java`
- Modify: `yixiang_be/src/main/resources/mapper/CircleMapper.xml` + `CircleMapper.java`

- [ ] **Step 1: UserMapper — listTopByFollowerCount**

We rank by relation's follower table. Strategy: GROUP BY followed_id ORDER BY COUNT(*) DESC LIMIT N+excluded.size(). The relation module's `follower` table tracks who follows whom (`follower(user_id, followed_id)` — verify field names first):

```bash
grep -A 10 "CREATE TABLE.*follower\|CREATE TABLE.*following" yixiang_be/db/schema.sql
```

(Adapt the next SQL to the actual column names you find. If your schema uses `followed_id` instead of e.g. `target_user_id`, adjust.)

Add to `UserMapper.java`:

```java
    List<Long> findTopFollowedUserIds(@Param("limit") int limit, @Param("excludeIds") Collection<Long> excludeIds);
```

Add to `UserMapper.xml` before `</mapper>`:

```xml
    <select id="findTopFollowedUserIds" resultType="long">
        SELECT followed_id
        FROM follower
        <where>
            <if test="excludeIds != null and !excludeIds.isEmpty()">
                followed_id NOT IN
                <foreach collection="excludeIds" item="id" open="(" separator="," close=")">
                    #{id}
                </foreach>
            </if>
        </where>
        GROUP BY followed_id
        ORDER BY COUNT(*) DESC
        LIMIT #{limit}
    </select>
```

(If your relation table is named `following` with columns `(follower_id, followed_id)`, change `follower` → `following` consistently.)

- [ ] **Step 2: CircleMapper — listByMemberCountDesc**

Add to `CircleMapper.java`:

```java
    List<Circle> listByMemberCountDesc(@Param("limit") int limit, @Param("excludeIds") Collection<Long> excludeIds);
```

Add to `CircleMapper.xml`:

```xml
    <select id="listByMemberCountDesc" resultMap="CircleResultMap">
        SELECT * FROM circles
        WHERE status = 'ACTIVE' AND visibility = 'PUBLIC'
        <if test="excludeIds != null and !excludeIds.isEmpty()">
            AND id NOT IN
            <foreach collection="excludeIds" item="id" open="(" separator="," close=")">
                #{id}
            </foreach>
        </if>
        ORDER BY member_count DESC
        LIMIT #{limit}
    </select>
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/user/mapper/UserMapper.java yixiang_be/src/main/java/com/tongji/circle/mapper/CircleMapper.java yixiang_be/src/main/resources/mapper/UserMapper.xml yixiang_be/src/main/resources/mapper/CircleMapper.xml
git commit -m "feat(recommend): mapper helpers for top-followed users / top-member circles"
```

---

### Task 24: RecommendService interface

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/recommend/service/RecommendService.java`

- [ ] **Step 1: Interface**

```java
package com.tongji.recommend.service;

import com.tongji.recommend.api.dto.RecommendCircleResponse;
import com.tongji.recommend.api.dto.RecommendUserResponse;

import java.util.List;

public interface RecommendService {
    List<RecommendUserResponse> recommendUsers(Long viewerId, int limit);
    List<RecommendCircleResponse> recommendCircles(Long viewerId, int limit);
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/recommend/service/RecommendService.java
git commit -m "feat(recommend): RecommendService interface"
```

---

### Task 25: RecommendServiceImpl with Caffeine cache

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/recommend/service/impl/RecommendServiceImpl.java`

- [ ] **Step 1: Implementation**

```java
package com.tongji.recommend.service.impl;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.tongji.circle.mapper.CircleMapper;
import com.tongji.circle.mapper.CircleMemberMapper;
import com.tongji.circle.model.Circle;
import com.tongji.counter.service.CounterService;
import com.tongji.recommend.api.dto.RecommendCircleResponse;
import com.tongji.recommend.api.dto.RecommendUserResponse;
import com.tongji.recommend.service.RecommendService;
import com.tongji.relation.service.RelationService;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Service
public class RecommendServiceImpl implements RecommendService {

    private static final int MAX_LIMIT = 20;

    private final UserMapper userMapper;
    private final CircleMapper circleMapper;
    private final CircleMemberMapper memberMapper;
    private final RelationService relationService;
    private final CounterService counterService;

    private final Cache<String, List<RecommendUserResponse>> userCache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(60))
            .maximumSize(2_000)
            .build();

    private final Cache<String, List<RecommendCircleResponse>> circleCache = Caffeine.newBuilder()
            .expireAfterWrite(Duration.ofSeconds(60))
            .maximumSize(2_000)
            .build();

    public RecommendServiceImpl(UserMapper userMapper,
                                CircleMapper circleMapper,
                                CircleMemberMapper memberMapper,
                                RelationService relationService,
                                CounterService counterService) {
        this.userMapper = userMapper;
        this.circleMapper = circleMapper;
        this.memberMapper = memberMapper;
        this.relationService = relationService;
        this.counterService = counterService;
    }

    @Override
    public List<RecommendUserResponse> recommendUsers(Long viewerId, int limit) {
        int n = clamp(limit);
        String key = "u:" + (viewerId == null ? "anon" : viewerId) + ":" + n;
        return userCache.get(key, k -> computeUsers(viewerId, n));
    }

    @Override
    public List<RecommendCircleResponse> recommendCircles(Long viewerId, int limit) {
        int n = clamp(limit);
        String key = "c:" + (viewerId == null ? "anon" : viewerId) + ":" + n;
        return circleCache.get(key, k -> computeCircles(viewerId, n));
    }

    private List<RecommendUserResponse> computeUsers(Long viewerId, int n) {
        Set<Long> excludeIds = new HashSet<>();
        if (viewerId != null) {
            excludeIds.add(viewerId);
            excludeIds.addAll(relationService.listFollowingIds(viewerId));
        }

        List<Long> topIds = userMapper.findTopFollowedUserIds(n, excludeIds);
        if (topIds.isEmpty()) return List.of();

        Map<Long, User> users = new HashMap<>();
        for (User u : userMapper.listSummariesByIds(topIds)) {
            users.put(u.getId(), u);
        }

        List<RecommendUserResponse> result = new ArrayList<>(topIds.size());
        for (Long uid : topIds) {
            User u = users.get(uid);
            if (u == null) continue;
            long fc = counterService.getCount("user", String.valueOf(uid), "follower");
            result.add(new RecommendUserResponse(
                    u.getId(), u.getNickname(), u.getAvatar(), u.getBio(),
                    u.getRoleTitle(),
                    u.getVerified() != null && u.getVerified(),
                    fc,
                    false  // already excluded if followed; always false here
            ));
        }
        return result;
    }

    private List<RecommendCircleResponse> computeCircles(Long viewerId, int n) {
        Set<Long> excludeIds = new HashSet<>();
        if (viewerId != null) {
            for (Circle c : circleMapper.listJoined(viewerId)) {
                excludeIds.add(c.getId());
            }
        }
        List<Circle> circles = circleMapper.listByMemberCountDesc(n, excludeIds);

        List<RecommendCircleResponse> result = new ArrayList<>(circles.size());
        for (Circle c : circles) {
            result.add(new RecommendCircleResponse(
                    c.getId(), c.getName(), c.getAvatarUrl(), c.getDescription(),
                    c.getCategory(), c.getMemberCount(), false
            ));
        }
        return result;
    }

    private int clamp(int n) {
        return Math.min(Math.max(n, 1), MAX_LIMIT);
    }
}
```

- [ ] **Step 2: Verify RelationService.listFollowingIds exists**

```bash
grep -n "listFollowingIds\|getFollowingIds" yixiang_be/src/main/java/com/tongji/relation/service/RelationService.java
```

If absent, add to `RelationService.java`:

```java
    List<Long> listFollowingIds(long userId);
```

And implement in `RelationServiceImpl` (find via grep):

```java
    @Override
    public List<Long> listFollowingIds(long userId) {
        return followingMapper.listFollowedIdsByFollower(userId);  // adapt to actual mapper method name
    }
```

If the mapper method also doesn't exist, add it similarly to other listing queries in `FollowingMapper.xml`.

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/recommend/ yixiang_be/src/main/java/com/tongji/relation/
git add yixiang_be/src/main/resources/mapper/
git commit -m "feat(recommend): RecommendServiceImpl with Caffeine 60s cache"
```

---

### Task 26: RecommendController

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/recommend/api/RecommendController.java`

- [ ] **Step 1: Controller**

```java
package com.tongji.recommend.api;

import com.tongji.auth.token.JwtService;
import com.tongji.recommend.api.dto.RecommendCircleResponse;
import com.tongji.recommend.api.dto.RecommendUserResponse;
import com.tongji.recommend.service.RecommendService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommend")
public class RecommendController {

    private final RecommendService recommendService;
    private final JwtService jwtService;

    public RecommendController(RecommendService recommendService, JwtService jwtService) {
        this.recommendService = recommendService;
        this.jwtService = jwtService;
    }

    @GetMapping("/users")
    public List<RecommendUserResponse> recommendUsers(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        Long viewerId = jwt == null ? null : jwtService.extractUserId(jwt);
        return recommendService.recommendUsers(viewerId, limit);
    }

    @GetMapping("/circles")
    public List<RecommendCircleResponse> recommendCircles(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        Long viewerId = jwt == null ? null : jwtService.extractUserId(jwt);
        return recommendService.recommendCircles(viewerId, limit);
    }
}
```

- [ ] **Step 2: SecurityConfig — public**

```java
.requestMatchers("/api/v1/recommend/**").permitAll()
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/recommend/api/RecommendController.java
git add -u yixiang_be/src
git commit -m "feat(recommend): RecommendController + security"
```

---

### Task 27: Section D smoke test

```bash
cd yixiang_be && mvn clean package -DskipTests
```

Expected: BUILD SUCCESS.

Optional live curl:

```bash
curl -s "http://localhost:8080/api/v1/recommend/users?limit=3"
curl -s "http://localhost:8080/api/v1/recommend/circles?limit=3"
```

Expected: 200 with arrays (may be empty if no data). Cache hit on second call within 60s (verify by checking response time / logs).

---

## Section E: draft module — `com.tongji.draft`

**Goal:** 草稿箱 CRUD + publish-to-know-posts. New `drafts` table (created in Section A).

**Endpoints:**
```
GET    /api/v1/drafts                  → list current user's drafts, by updated_at desc
POST   /api/v1/drafts                  → create empty/initial draft
GET    /api/v1/drafts/{id}             → fetch single
PUT    /api/v1/drafts/{id}             → patch
DELETE /api/v1/drafts/{id}             → hard delete
POST   /api/v1/drafts/{id}/publish     → atomic: insert know_post + delete draft (transactional)
```

All endpoints require auth. Ownership enforced — only `user_id == jwt.uid` may access.

---

### Task 28: Draft domain class

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/draft/model/Draft.java`

- [ ] **Step 1: Create directories**

```bash
mkdir -p yixiang_be/src/main/java/com/tongji/draft/{model,mapper,service/impl,api/dto}
```

- [ ] **Step 2: Draft.java**

```java
package com.tongji.draft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Draft {
    private Long id;
    private Long userId;
    private String title;
    private String contentUrl;
    private String tagsJson;
    private Long circleId;
    private String coverImage;
    private Instant updatedAt;
    private Instant createdAt;
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/draft/model/
git commit -m "feat(draft): Draft domain class"
```

---

### Task 29: DraftMapper.java + xml

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/draft/mapper/DraftMapper.java`
- Create: `yixiang_be/src/main/resources/mapper/DraftMapper.xml`

- [ ] **Step 1: Mapper interface**

```java
package com.tongji.draft.mapper;

import com.tongji.draft.model.Draft;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface DraftMapper {
    void insert(Draft draft);
    Draft findById(@Param("id") long id);
    List<Draft> listByUser(@Param("userId") long userId);
    void update(Draft draft);
    int delete(@Param("id") long id, @Param("userId") long userId);
}
```

- [ ] **Step 2: XML**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.draft.mapper.DraftMapper">

    <resultMap id="DraftResultMap" type="com.tongji.draft.model.Draft">
        <id     column="id"           property="id"/>
        <result column="user_id"      property="userId"/>
        <result column="title"        property="title"/>
        <result column="content_url"  property="contentUrl"/>
        <result column="tags"         property="tagsJson"/>
        <result column="circle_id"    property="circleId"/>
        <result column="cover_image"  property="coverImage"/>
        <result column="updated_at"   property="updatedAt"/>
        <result column="created_at"   property="createdAt"/>
    </resultMap>

    <insert id="insert" parameterType="com.tongji.draft.model.Draft">
        INSERT INTO drafts (id, user_id, title, content_url, tags, circle_id, cover_image)
        VALUES (#{id}, #{userId}, #{title}, #{contentUrl}, #{tagsJson}, #{circleId}, #{coverImage})
    </insert>

    <select id="findById" resultMap="DraftResultMap">
        SELECT * FROM drafts WHERE id = #{id}
    </select>

    <select id="listByUser" resultMap="DraftResultMap">
        SELECT * FROM drafts WHERE user_id = #{userId} ORDER BY updated_at DESC
    </select>

    <update id="update" parameterType="com.tongji.draft.model.Draft">
        UPDATE drafts
        <set>
            <if test="title != null">title = #{title},</if>
            <if test="contentUrl != null">content_url = #{contentUrl},</if>
            <if test="tagsJson != null">tags = #{tagsJson},</if>
            <if test="circleId != null">circle_id = #{circleId},</if>
            <if test="coverImage != null">cover_image = #{coverImage},</if>
            updated_at = CURRENT_TIMESTAMP(3)
        </set>
        WHERE id = #{id}
    </update>

    <delete id="delete">
        DELETE FROM drafts WHERE id = #{id} AND user_id = #{userId}
    </delete>

</mapper>
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/draft/mapper/ yixiang_be/src/main/resources/mapper/DraftMapper.xml
git commit -m "feat(draft): DraftMapper + XML"
```

---

### Task 30: Draft DTOs (3 records)

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/draft/api/dto/DraftCreateRequest.java`
- Create: `yixiang_be/src/main/java/com/tongji/draft/api/dto/DraftPatchRequest.java`
- Create: `yixiang_be/src/main/java/com/tongji/draft/api/dto/DraftResponse.java`

- [ ] **Step 1: DraftCreateRequest**

```java
package com.tongji.draft.api.dto;

import java.util.List;

public record DraftCreateRequest(
        String title,
        String contentUrl,
        List<String> tags,
        Long circleId,
        String coverImage
) {}
```

- [ ] **Step 2: DraftPatchRequest**

```java
package com.tongji.draft.api.dto;

import java.util.List;

public record DraftPatchRequest(
        String title,
        String contentUrl,
        List<String> tags,
        Long circleId,
        String coverImage
) {}
```

- [ ] **Step 3: DraftResponse**

```java
package com.tongji.draft.api.dto;

import java.time.Instant;
import java.util.List;

public record DraftResponse(
        Long id,
        String title,
        String contentUrl,
        List<String> tags,
        Long circleId,
        String coverImage,
        Instant updatedAt,
        Instant createdAt
) {}
```

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/draft/api/dto/
git commit -m "feat(draft): DTOs (Create/Patch/Response)"
```

---

### Task 31: DraftService interface

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/draft/service/DraftService.java`

- [ ] **Step 1: Interface**

```java
package com.tongji.draft.service;

import com.tongji.draft.api.dto.DraftCreateRequest;
import com.tongji.draft.api.dto.DraftPatchRequest;
import com.tongji.draft.api.dto.DraftResponse;

import java.util.List;

public interface DraftService {
    DraftResponse create(long userId, DraftCreateRequest req);
    DraftResponse get(long userId, long draftId);
    List<DraftResponse> listMine(long userId);
    DraftResponse update(long userId, long draftId, DraftPatchRequest req);
    void delete(long userId, long draftId);
    long publish(long userId, long draftId);   // returns new know_post id
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/draft/service/DraftService.java
git commit -m "feat(draft): DraftService interface"
```

---

### Task 32: DraftServiceImpl

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/draft/service/impl/DraftServiceImpl.java`

- [ ] **Step 1: Implementation**

```java
package com.tongji.draft.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.draft.api.dto.DraftCreateRequest;
import com.tongji.draft.api.dto.DraftPatchRequest;
import com.tongji.draft.api.dto.DraftResponse;
import com.tongji.draft.mapper.DraftMapper;
import com.tongji.draft.model.Draft;
import com.tongji.draft.service.DraftService;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import com.tongji.topic.service.TopicService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class DraftServiceImpl implements DraftService {

    private final DraftMapper draftMapper;
    private final KnowPostMapper postMapper;
    private final ObjectMapper objectMapper;
    private final TopicService topicService;

    public DraftServiceImpl(DraftMapper draftMapper,
                            KnowPostMapper postMapper,
                            ObjectMapper objectMapper,
                            TopicService topicService) {
        this.draftMapper = draftMapper;
        this.postMapper = postMapper;
        this.objectMapper = objectMapper;
        this.topicService = topicService;
    }

    @Override
    @Transactional
    public DraftResponse create(long userId, DraftCreateRequest req) {
        Draft d = Draft.builder()
                .id(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE))
                .userId(userId)
                .title(req.title())
                .contentUrl(req.contentUrl())
                .tagsJson(serializeTags(req.tags()))
                .circleId(req.circleId())
                .coverImage(req.coverImage())
                .build();
        draftMapper.insert(d);
        return toResponse(draftMapper.findById(d.getId()));
    }

    @Override
    public DraftResponse get(long userId, long draftId) {
        return toResponse(requireOwned(draftId, userId));
    }

    @Override
    public List<DraftResponse> listMine(long userId) {
        return draftMapper.listByUser(userId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public DraftResponse update(long userId, long draftId, DraftPatchRequest req) {
        requireOwned(draftId, userId);
        Draft patch = Draft.builder()
                .id(draftId)
                .title(req.title())
                .contentUrl(req.contentUrl())
                .tagsJson(req.tags() == null ? null : serializeTags(req.tags()))
                .circleId(req.circleId())
                .coverImage(req.coverImage())
                .build();
        draftMapper.update(patch);
        return toResponse(draftMapper.findById(draftId));
    }

    @Override
    @Transactional
    public void delete(long userId, long draftId) {
        int rows = draftMapper.delete(draftId, userId);
        if (rows == 0) throw new BusinessException(ErrorCode.DRAFT_NOT_FOUND);
    }

    @Override
    @Transactional
    public long publish(long userId, long draftId) {
        Draft d = requireOwned(draftId, userId);
        // Publish requires title and content_url at minimum.
        if (d.getTitle() == null || d.getTitle().isBlank()
            || d.getContentUrl() == null || d.getContentUrl().isBlank()) {
            throw new BusinessException(ErrorCode.DRAFT_PUBLISH_INVALID);
        }

        KnowPost post = new KnowPost();
        post.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        post.setCreatorId(userId);
        post.setTitle(d.getTitle());
        post.setContentUrl(d.getContentUrl());
        post.setTagsJson(d.getTagsJson());
        post.setCircleId(d.getCircleId());
        post.setCoverImage(d.getCoverImage());
        post.setStatus("PUBLISHED");
        post.setCreateTime(Instant.now());

        postMapper.insert(post);
        draftMapper.delete(draftId, userId);
        topicService.onPostCreated(parseTags(d.getTagsJson()));
        return post.getId();
    }

    private Draft requireOwned(long draftId, long userId) {
        Draft d = draftMapper.findById(draftId);
        if (d == null) throw new BusinessException(ErrorCode.DRAFT_NOT_FOUND);
        if (d.getUserId() == null || d.getUserId() != userId) {
            throw new BusinessException(ErrorCode.DRAFT_FORBIDDEN);
        }
        return d;
    }

    private DraftResponse toResponse(Draft d) {
        return new DraftResponse(
                d.getId(), d.getTitle(), d.getContentUrl(),
                parseTags(d.getTagsJson()),
                d.getCircleId(), d.getCoverImage(),
                d.getUpdatedAt(), d.getCreatedAt()
        );
    }

    private String serializeTags(List<String> tags) {
        if (tags == null) return null;
        try {
            return objectMapper.writeValueAsString(tags);
        } catch (Exception e) {
            return "[]";
        }
    }

    private List<String> parseTags(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
```

- [ ] **Step 2: Verify KnowPost setters exist for circleId / coverImage / contentUrl / status**

```bash
grep -n "setCircleId\|setCoverImage\|setContentUrl\|setStatus\|setCreateTime" yixiang_be/src/main/java/com/tongji/knowpost/model/KnowPost.java
```

If any setter missing, the field is also likely missing — open the file and add field + setter (Lombok `@Data` auto-generates; if it's `@Data`, the setter exists once the field is added).

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/draft/service/impl/
git commit -m "feat(draft): DraftServiceImpl with publish-to-knowpost"
```

---

### Task 33: DraftController

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/draft/api/DraftController.java`

- [ ] **Step 1: Controller**

```java
package com.tongji.draft.api;

import com.tongji.auth.token.JwtService;
import com.tongji.draft.api.dto.DraftCreateRequest;
import com.tongji.draft.api.dto.DraftPatchRequest;
import com.tongji.draft.api.dto.DraftResponse;
import com.tongji.draft.service.DraftService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/drafts")
public class DraftController {

    private final DraftService draftService;
    private final JwtService jwtService;

    public DraftController(DraftService draftService, JwtService jwtService) {
        this.draftService = draftService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public List<DraftResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return draftService.listMine(jwtService.extractUserId(jwt));
    }

    @PostMapping
    public DraftResponse create(@RequestBody DraftCreateRequest req, @AuthenticationPrincipal Jwt jwt) {
        return draftService.create(jwtService.extractUserId(jwt), req);
    }

    @GetMapping("/{id}")
    public DraftResponse get(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        return draftService.get(jwtService.extractUserId(jwt), id);
    }

    @PutMapping("/{id}")
    public DraftResponse update(@PathVariable long id,
                                @RequestBody DraftPatchRequest req,
                                @AuthenticationPrincipal Jwt jwt) {
        return draftService.update(jwtService.extractUserId(jwt), id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        draftService.delete(jwtService.extractUserId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public Map<String, Long> publish(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        long postId = draftService.publish(jwtService.extractUserId(jwt), id);
        return Map.of("postId", postId);
    }
}
```

- [ ] **Step 2: Security — leave default (authenticated)**

No SecurityConfig change needed. Default rule "everything not in permitAll requires auth" covers `/api/v1/drafts/**`.

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/draft/api/
git commit -m "feat(draft): DraftController (CRUD + publish)"
```

---

### Task 34: Section E smoke test

```bash
cd yixiang_be && mvn clean package -DskipTests
```

Expected: BUILD SUCCESS.

Optional live test (with $TOKEN as a valid JWT):

```bash
# create
curl -s -X POST "http://localhost:8080/api/v1/drafts" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"hello","contentUrl":"https://oss/x.md","tags":["Java"]}'
# list
curl -s "http://localhost:8080/api/v1/drafts" -H "Authorization: Bearer $TOKEN"
# publish (replace $DID)
curl -s -X POST "http://localhost:8080/api/v1/drafts/$DID/publish" -H "Authorization: Bearer $TOKEN"
# get after publish → 404 DRAFT_NOT_FOUND (because publish deleted it)
curl -s "http://localhost:8080/api/v1/drafts/$DID" -H "Authorization: Bearer $TOKEN"
```

---

## Section F: settings module — `com.tongji.settings`

**Goal:** 用户偏好设置. New `user_settings` table (created in Section A). 2 endpoints:
```
GET   /api/v1/settings    → return current user's settings, returns defaults if no row exists yet
PATCH /api/v1/settings    → partial update, upsert
```

Both require auth.

---

### Task 35: UserSettings domain

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/settings/model/UserSettings.java`

- [ ] **Step 1: Create directories**

```bash
mkdir -p yixiang_be/src/main/java/com/tongji/settings/{model,mapper,service/impl,api/dto}
```

- [ ] **Step 2: UserSettings.java**

```java
package com.tongji.settings.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {
    private Long userId;
    private String notificationPrefJson;
    private String privacyJson;
    private String theme;
    private String language;
    private Instant updatedAt;
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/settings/model/
git commit -m "feat(settings): UserSettings domain"
```

---

### Task 36: UserSettingsMapper + xml

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/settings/mapper/UserSettingsMapper.java`
- Create: `yixiang_be/src/main/resources/mapper/UserSettingsMapper.xml`

- [ ] **Step 1: Mapper interface**

```java
package com.tongji.settings.mapper;

import com.tongji.settings.model.UserSettings;
import org.apache.ibatis.annotations.Param;

public interface UserSettingsMapper {
    UserSettings findByUserId(@Param("userId") long userId);
    void upsert(UserSettings settings);
}
```

- [ ] **Step 2: XML**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.settings.mapper.UserSettingsMapper">

    <resultMap id="UserSettingsResultMap" type="com.tongji.settings.model.UserSettings">
        <id     column="user_id"           property="userId"/>
        <result column="notification_pref" property="notificationPrefJson"/>
        <result column="privacy"           property="privacyJson"/>
        <result column="theme"             property="theme"/>
        <result column="language"          property="language"/>
        <result column="updated_at"        property="updatedAt"/>
    </resultMap>

    <select id="findByUserId" resultMap="UserSettingsResultMap">
        SELECT * FROM user_settings WHERE user_id = #{userId}
    </select>

    <insert id="upsert" parameterType="com.tongji.settings.model.UserSettings">
        INSERT INTO user_settings (user_id, notification_pref, privacy, theme, language)
        VALUES (#{userId}, #{notificationPrefJson}, #{privacyJson}, #{theme}, #{language})
        ON DUPLICATE KEY UPDATE
            notification_pref = COALESCE(VALUES(notification_pref), notification_pref),
            privacy           = COALESCE(VALUES(privacy), privacy),
            theme             = COALESCE(VALUES(theme), theme),
            language          = COALESCE(VALUES(language), language),
            updated_at        = CURRENT_TIMESTAMP(3)
    </insert>

</mapper>
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/settings/mapper/ yixiang_be/src/main/resources/mapper/UserSettingsMapper.xml
git commit -m "feat(settings): UserSettingsMapper + XML (upsert with COALESCE)"
```

---

### Task 37: Settings DTOs

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/settings/api/dto/SettingsResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/settings/api/dto/SettingsPatchRequest.java`

- [ ] **Step 1: SettingsResponse**

```java
package com.tongji.settings.api.dto;

import java.util.Map;

public record SettingsResponse(
        Map<String, Object> notificationPref,
        Map<String, Object> privacy,
        String theme,
        String language
) {}
```

- [ ] **Step 2: SettingsPatchRequest**

```java
package com.tongji.settings.api.dto;

import java.util.Map;

public record SettingsPatchRequest(
        Map<String, Object> notificationPref,
        Map<String, Object> privacy,
        String theme,
        String language
) {}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/settings/api/dto/
git commit -m "feat(settings): DTOs"
```

---

### Task 38: SettingsService interface + Impl

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/settings/service/SettingsService.java`
- Create: `yixiang_be/src/main/java/com/tongji/settings/service/impl/SettingsServiceImpl.java`

- [ ] **Step 1: SettingsService interface**

```java
package com.tongji.settings.service;

import com.tongji.settings.api.dto.SettingsPatchRequest;
import com.tongji.settings.api.dto.SettingsResponse;

public interface SettingsService {
    SettingsResponse get(long userId);
    SettingsResponse patch(long userId, SettingsPatchRequest req);
}
```

- [ ] **Step 2: Default constants**

Create `yixiang_be/src/main/java/com/tongji/settings/service/SettingsDefaults.java`:

```java
package com.tongji.settings.service;

import java.util.Map;

public final class SettingsDefaults {
    public static final Map<String, Object> NOTIFICATION_PREF = Map.of(
            "like",    true,
            "comment", true,
            "follow",  true,
            "system",  true
    );
    public static final Map<String, Object> PRIVACY = Map.of(
            "hideFollowing",  false,
            "hideCollections", false
    );
    public static final String THEME = "light";
    public static final String LANGUAGE = "zh-CN";

    private SettingsDefaults() {}
}
```

- [ ] **Step 3: SettingsServiceImpl**

```java
package com.tongji.settings.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.settings.api.dto.SettingsPatchRequest;
import com.tongji.settings.api.dto.SettingsResponse;
import com.tongji.settings.mapper.UserSettingsMapper;
import com.tongji.settings.model.UserSettings;
import com.tongji.settings.service.SettingsDefaults;
import com.tongji.settings.service.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class SettingsServiceImpl implements SettingsService {

    private final UserSettingsMapper mapper;
    private final ObjectMapper objectMapper;

    public SettingsServiceImpl(UserSettingsMapper mapper, ObjectMapper objectMapper) {
        this.mapper = mapper;
        this.objectMapper = objectMapper;
    }

    @Override
    public SettingsResponse get(long userId) {
        UserSettings s = mapper.findByUserId(userId);
        if (s == null) {
            return new SettingsResponse(
                    SettingsDefaults.NOTIFICATION_PREF,
                    SettingsDefaults.PRIVACY,
                    SettingsDefaults.THEME,
                    SettingsDefaults.LANGUAGE
            );
        }
        return toResponse(s);
    }

    @Override
    @Transactional
    public SettingsResponse patch(long userId, SettingsPatchRequest req) {
        UserSettings patch = UserSettings.builder()
                .userId(userId)
                .notificationPrefJson(serialize(req.notificationPref()))
                .privacyJson(serialize(req.privacy()))
                .theme(req.theme())
                .language(req.language())
                .build();
        try {
            mapper.upsert(patch);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.SETTINGS_INVALID_PAYLOAD);
        }
        return get(userId);
    }

    private SettingsResponse toResponse(UserSettings s) {
        return new SettingsResponse(
                deserialize(s.getNotificationPrefJson(), SettingsDefaults.NOTIFICATION_PREF),
                deserialize(s.getPrivacyJson(), SettingsDefaults.PRIVACY),
                s.getTheme() != null ? s.getTheme() : SettingsDefaults.THEME,
                s.getLanguage() != null ? s.getLanguage() : SettingsDefaults.LANGUAGE
        );
    }

    private String serialize(Map<String, Object> map) {
        if (map == null) return null;
        try { return objectMapper.writeValueAsString(map); }
        catch (Exception e) { throw new BusinessException(ErrorCode.SETTINGS_INVALID_PAYLOAD); }
    }

    private Map<String, Object> deserialize(String json, Map<String, Object> fallback) {
        if (json == null || json.isBlank()) return fallback;
        try { return objectMapper.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return fallback; }
    }
}
```

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/settings/service/
git commit -m "feat(settings): SettingsService + Defaults + Impl"
```

---

### Task 39: SettingsController

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/settings/api/SettingsController.java`

- [ ] **Step 1: Controller**

```java
package com.tongji.settings.api;

import com.tongji.auth.token.JwtService;
import com.tongji.settings.api.dto.SettingsPatchRequest;
import com.tongji.settings.api.dto.SettingsResponse;
import com.tongji.settings.service.SettingsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsService settingsService;
    private final JwtService jwtService;

    public SettingsController(SettingsService settingsService, JwtService jwtService) {
        this.settingsService = settingsService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public SettingsResponse get(@AuthenticationPrincipal Jwt jwt) {
        return settingsService.get(jwtService.extractUserId(jwt));
    }

    @PatchMapping
    public SettingsResponse patch(@AuthenticationPrincipal Jwt jwt, @RequestBody SettingsPatchRequest req) {
        return settingsService.patch(jwtService.extractUserId(jwt), req);
    }
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/settings/api/
git commit -m "feat(settings): SettingsController (GET + PATCH)"
```

---

### Task 40: Section F smoke test

```bash
cd yixiang_be && mvn clean package -DskipTests
```

Optional live test:

```bash
# get defaults (no row yet)
curl -s "http://localhost:8080/api/v1/settings" -H "Authorization: Bearer $TOKEN"
# patch
curl -s -X PATCH "http://localhost:8080/api/v1/settings" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"theme":"dark","privacy":{"hideCollections":true}}'
# get again — should reflect patch + keep defaults for other keys
curl -s "http://localhost:8080/api/v1/settings" -H "Authorization: Bearer $TOKEN"
```

---

## Section G: activity module — `com.tongji.activity`

**Goal:** Following timeline. New `activities` table (Section A). One read endpoint + two Kafka consumers that aggregate events from `counter-events` and `OutboxTopics.CANAL_OUTBOX` into `activities` rows.

**Endpoint:**
```
GET /api/v1/activities/following?cursor=&size=20
→ activities created by users I follow, newest first, cursor pagination by id
auth required
```

**Producers (consumers that write to activities):**
1. `CounterActivityConsumer` — reads `counter-events`. When metric=like or favorite and delta=+1 → INSERT activity (type=LIKE/FAVORITE).
2. `RelationActivityConsumer` — reads `OutboxTopics.CANAL_OUTBOX`. When type=FOLLOW → INSERT activity (type=FOLLOW).
3. Inline (sync in service) — when `KnowPost` is published or `CircleMember.join` completes successfully → INSERT activity (type=POST / JOIN_CIRCLE).

---

### Task 41: Activity domain

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/activity/model/Activity.java`

- [ ] **Step 1: Create directories**

```bash
mkdir -p yixiang_be/src/main/java/com/tongji/activity/{model,mapper,service/impl,consumer,api/dto}
```

- [ ] **Step 2: Activity.java**

```java
package com.tongji.activity.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Activity {
    private Long id;
    private Long userId;
    private String type;          // POST / LIKE / FAVORITE / FOLLOW / JOIN_CIRCLE
    private String targetType;    // POST / USER / CIRCLE
    private Long targetId;
    private String payloadJson;
    private Instant createdAt;
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/activity/model/
git commit -m "feat(activity): Activity domain"
```

---

### Task 42: ActivityMapper + xml

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/activity/mapper/ActivityMapper.java`
- Create: `yixiang_be/src/main/resources/mapper/ActivityMapper.xml`

- [ ] **Step 1: Mapper interface**

```java
package com.tongji.activity.mapper;

import com.tongji.activity.model.Activity;
import org.apache.ibatis.annotations.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface ActivityMapper {
    void insert(Activity activity);
    List<Activity> listByUsers(@Param("userIds") Collection<Long> userIds,
                               @Param("cursorId") Long cursorId,
                               @Param("limit") int limit);
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}
```

- [ ] **Step 2: XML**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.activity.mapper.ActivityMapper">

    <resultMap id="ActivityResultMap" type="com.tongji.activity.model.Activity">
        <id     column="id"          property="id"/>
        <result column="user_id"     property="userId"/>
        <result column="type"        property="type"/>
        <result column="target_type" property="targetType"/>
        <result column="target_id"   property="targetId"/>
        <result column="payload"     property="payloadJson"/>
        <result column="created_at"  property="createdAt"/>
    </resultMap>

    <insert id="insert" parameterType="com.tongji.activity.model.Activity">
        INSERT INTO activities (id, user_id, type, target_type, target_id, payload)
        VALUES (#{id}, #{userId}, #{type}, #{targetType}, #{targetId}, #{payloadJson})
    </insert>

    <select id="listByUsers" resultMap="ActivityResultMap">
        SELECT * FROM activities
        WHERE user_id IN
        <foreach collection="userIds" item="uid" open="(" separator="," close=")">
            #{uid}
        </foreach>
        <if test="cursorId != null">
            AND id &lt; #{cursorId}
        </if>
        ORDER BY id DESC
        LIMIT #{limit}
    </select>

    <delete id="deleteOlderThan">
        DELETE FROM activities WHERE created_at &lt; #{cutoff}
    </delete>

</mapper>
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/activity/mapper/ yixiang_be/src/main/resources/mapper/ActivityMapper.xml
git commit -m "feat(activity): ActivityMapper + XML"
```

---

### Task 43: Activity DTOs

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/activity/api/dto/ActivityResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/activity/api/dto/ActivityListResponse.java`

- [ ] **Step 1: ActivityResponse**

```java
package com.tongji.activity.api.dto;

import com.tongji.user.api.dto.UserBrief;

import java.time.Instant;
import java.util.Map;

public record ActivityResponse(
        Long id,
        UserBrief actor,
        String type,
        String targetType,
        Long targetId,
        Map<String, Object> payload,
        Instant createdAt
) {}
```

- [ ] **Step 2: ActivityListResponse**

```java
package com.tongji.activity.api.dto;

import java.util.List;

public record ActivityListResponse(
        List<ActivityResponse> items,
        String nextCursor
) {}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/activity/api/dto/
git commit -m "feat(activity): ActivityResponse + ActivityListResponse DTOs"
```

---

### Task 44: ActivityService interface + impl

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/activity/service/ActivityService.java`
- Create: `yixiang_be/src/main/java/com/tongji/activity/service/impl/ActivityServiceImpl.java`

- [ ] **Step 1: Interface**

```java
package com.tongji.activity.service;

import com.tongji.activity.api.dto.ActivityListResponse;
import com.tongji.activity.model.Activity;

public interface ActivityService {
    void record(Activity activity);   // shared write path for all producers
    ActivityListResponse listFollowing(long viewerId, Long cursor, int size);
}
```

- [ ] **Step 2: Implementation**

```java
package com.tongji.activity.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.activity.api.dto.ActivityListResponse;
import com.tongji.activity.api.dto.ActivityResponse;
import com.tongji.activity.mapper.ActivityMapper;
import com.tongji.activity.model.Activity;
import com.tongji.activity.service.ActivityService;
import com.tongji.relation.service.RelationService;
import com.tongji.user.api.dto.UserBrief;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class ActivityServiceImpl implements ActivityService {

    private static final Logger log = LoggerFactory.getLogger(ActivityServiceImpl.class);
    private static final int MAX_SIZE = 50;

    private final ActivityMapper activityMapper;
    private final UserMapper userMapper;
    private final RelationService relationService;
    private final ObjectMapper objectMapper;

    public ActivityServiceImpl(ActivityMapper activityMapper,
                               UserMapper userMapper,
                               RelationService relationService,
                               ObjectMapper objectMapper) {
        this.activityMapper = activityMapper;
        this.userMapper = userMapper;
        this.relationService = relationService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void record(Activity a) {
        if (a.getId() == null) {
            a.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        }
        if (a.getCreatedAt() == null) {
            a.setCreatedAt(Instant.now());
        }
        try {
            activityMapper.insert(a);
        } catch (Exception e) {
            // Activities are best-effort — log & drop. The source-of-truth events live in their domain tables.
            log.warn("activity insert failed: type={} target={} user={}", a.getType(), a.getTargetId(), a.getUserId(), e);
        }
    }

    @Override
    public ActivityListResponse listFollowing(long viewerId, Long cursor, int size) {
        int effective = Math.min(Math.max(size, 1), MAX_SIZE);
        List<Long> followingIds = relationService.listFollowingIds(viewerId);
        if (followingIds.isEmpty()) {
            return new ActivityListResponse(List.of(), null);
        }

        List<Activity> rows = activityMapper.listByUsers(followingIds, cursor, effective + 1);
        boolean hasMore = rows.size() > effective;
        if (hasMore) rows = rows.subList(0, effective);

        Set<Long> actorIds = rows.stream().map(Activity::getUserId).collect(Collectors.toSet());
        Map<Long, UserBrief> actors = actorIds.isEmpty() ? Map.of() :
                userMapper.listSummariesByIds(actorIds).stream()
                        .collect(Collectors.toMap(User::getId, UserBrief::from));

        List<ActivityResponse> items = rows.stream().map(a -> new ActivityResponse(
                a.getId(),
                actors.get(a.getUserId()),
                a.getType(),
                a.getTargetType(),
                a.getTargetId(),
                parsePayload(a.getPayloadJson()),
                a.getCreatedAt()
        )).toList();

        String nextCursor = hasMore ? String.valueOf(rows.get(rows.size() - 1).getId()) : null;
        return new ActivityListResponse(items, nextCursor);
    }

    private Map<String, Object> parsePayload(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return Map.of(); }
    }
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/activity/service/
git commit -m "feat(activity): ActivityService + Impl (best-effort writes)"
```

---

### Task 45: CounterActivityConsumer

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/activity/consumer/CounterActivityConsumer.java`

- [ ] **Step 1: Locate CounterEvent**

Already in `com.tongji.counter.event.CounterEvent` (used by `LikeNotificationConsumer`).
Fields: `metric`, `delta`, `entityId`, `userId`.

- [ ] **Step 2: Consumer**

```java
package com.tongji.activity.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.activity.model.Activity;
import com.tongji.activity.service.ActivityService;
import com.tongji.counter.event.CounterEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class CounterActivityConsumer {

    private static final Logger log = LoggerFactory.getLogger(CounterActivityConsumer.class);

    private final ObjectMapper objectMapper;
    private final ActivityService activityService;

    public CounterActivityConsumer(ObjectMapper objectMapper, ActivityService activityService) {
        this.objectMapper = objectMapper;
        this.activityService = activityService;
    }

    @KafkaListener(topics = "counter-events", groupId = "activity-counter")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            CounterEvent evt = objectMapper.readValue(message, CounterEvent.class);
            // Only "+1" events of LIKE / FAVORITE produce an activity. Unlikes / unfavorites do not.
            if (evt.getDelta() != 1) {
                ack.acknowledge();
                return;
            }
            String type;
            if ("like".equals(evt.getMetric())) type = "LIKE";
            else if ("favorite".equals(evt.getMetric())) type = "FAVORITE";
            else { ack.acknowledge(); return; }

            Activity a = Activity.builder()
                    .userId(evt.getUserId())
                    .type(type)
                    .targetType("POST")
                    .targetId(Long.parseLong(evt.getEntityId()))
                    .build();
            activityService.record(a);
            ack.acknowledge();
        } catch (Exception e) {
            log.warn("CounterActivityConsumer failed; ack to avoid poison pill", e);
            ack.acknowledge();
        }
    }
}
```

(Note: ack on exception — activities are best-effort and infinite Kafka retry on bad messages would block the consumer group. The `LikeNotificationConsumer` pattern of "don't ack to retry" is appropriate when the side effect is critical; activities are not.)

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/activity/consumer/CounterActivityConsumer.java
git commit -m "feat(activity): CounterActivityConsumer for LIKE/FAVORITE"
```

---

### Task 46: RelationActivityConsumer (outbox FOLLOW)

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/activity/consumer/RelationActivityConsumer.java`

- [ ] **Step 1: Consumer (model after FollowNotificationConsumer)**

```java
package com.tongji.activity.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.activity.model.Activity;
import com.tongji.activity.service.ActivityService;
import com.tongji.common.util.OutboxMessageUtil;
import com.tongji.relation.event.RelationEvent;
import com.tongji.relation.outbox.OutboxTopics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RelationActivityConsumer {

    private static final Logger log = LoggerFactory.getLogger(RelationActivityConsumer.class);

    private final ObjectMapper objectMapper;
    private final ActivityService activityService;

    public RelationActivityConsumer(ObjectMapper objectMapper, ActivityService activityService) {
        this.objectMapper = objectMapper;
        this.activityService = activityService;
    }

    @KafkaListener(topics = OutboxTopics.CANAL_OUTBOX, groupId = "activity-relation")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            List<JsonNode> rows = OutboxMessageUtil.extractRows(objectMapper, message);
            for (JsonNode row : rows) {
                JsonNode payloadNode = row.get("payload");
                if (payloadNode == null) continue;
                RelationEvent evt = objectMapper.readValue(payloadNode.asText(), RelationEvent.class);
                if (!"FOLLOW".equals(evt.type())) continue;

                Activity a = Activity.builder()
                        .userId(evt.fromUserId())
                        .type("FOLLOW")
                        .targetType("USER")
                        .targetId(evt.toUserId())
                        .build();
                activityService.record(a);
            }
            ack.acknowledge();
        } catch (Exception e) {
            log.warn("RelationActivityConsumer failed; ack", e);
            ack.acknowledge();
        }
    }
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/activity/consumer/RelationActivityConsumer.java
git commit -m "feat(activity): RelationActivityConsumer from outbox FOLLOW events"
```

---

### Task 47: Inline producers — POST publish + JOIN_CIRCLE

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/draft/service/impl/DraftServiceImpl.java`
- Modify: `yixiang_be/src/main/java/com/tongji/circle/service/impl/CircleServiceImpl.java`
- Modify: the existing knowpost publish service (find via grep)

- [ ] **Step 1: Add activity write in DraftServiceImpl.publish**

Open `DraftServiceImpl.java`. Inject `ActivityService`:

```java
private final ActivityService activityService;

public DraftServiceImpl(/* ...existing... */, ActivityService activityService) {
    // ...existing...
    this.activityService = activityService;
}
```

In the `publish` method, after `postMapper.insert(post)` and before `draftMapper.delete(...)`, add:

```java
activityService.record(Activity.builder()
        .userId(userId)
        .type("POST")
        .targetType("POST")
        .targetId(post.getId())
        .payloadJson("{\"title\":" + objectMapper.writeValueAsString(post.getTitle()) +
                     ",\"cover\":" + objectMapper.writeValueAsString(post.getCoverImage()) + "}")
        .build());
```

Add imports:
```java
import com.tongji.activity.model.Activity;
import com.tongji.activity.service.ActivityService;
```

(Wrap the payloadJson construction in try/catch or precompute via Map for cleanliness — the executor may refactor as preferred. Compile-correctness is required, style is not.)

- [ ] **Step 2: Locate existing post-publish path (if posts can be published directly, not only via draft)**

```bash
grep -rln "status.*PUBLISHED\|setStatus.*PUBLISHED" yixiang_be/src/main/java/com/tongji/knowpost
```

If a non-draft publish path exists (e.g. `KnowPostServiceImpl.publish`), inject `ActivityService` and add a similar `activityService.record(...)` call there too. If the only publish path is via DraftServiceImpl, no further changes needed.

- [ ] **Step 3: Add activity write in CircleServiceImpl.join (PUBLIC branch only)**

Open `CircleServiceImpl.java`. Inject `ActivityService` (same pattern as Step 1). In the `join` method, in the `if ("PUBLIC".equals(circle.getVisibility()))` branch, after `circleMapper.incrementMemberCount(circleId, 1)`, add:

```java
activityService.record(Activity.builder()
        .userId(userId)
        .type("JOIN_CIRCLE")
        .targetType("CIRCLE")
        .targetId(circleId)
        .build());
```

(PENDING-then-approved circles also get JOIN_CIRCLE activity when approved — add the same call in `approveMember` after `circleMapper.incrementMemberCount(circleId, 1)`, with `userId = targetUserId`.)

- [ ] **Step 4: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/draft/service/impl/DraftServiceImpl.java yixiang_be/src/main/java/com/tongji/circle/service/impl/CircleServiceImpl.java
git commit -m "feat(activity): inline producers for POST publish + JOIN_CIRCLE"
```

---

### Task 48: ActivityController

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/activity/api/ActivityController.java`

- [ ] **Step 1: Controller**

```java
package com.tongji.activity.api;

import com.tongji.activity.api.dto.ActivityListResponse;
import com.tongji.activity.service.ActivityService;
import com.tongji.auth.token.JwtService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/activities")
public class ActivityController {

    private final ActivityService activityService;
    private final JwtService jwtService;

    public ActivityController(ActivityService activityService, JwtService jwtService) {
        this.activityService = activityService;
        this.jwtService = jwtService;
    }

    @GetMapping("/following")
    public ActivityListResponse following(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "cursor", required = false) Long cursor,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        long uid = jwtService.extractUserId(jwt);
        return activityService.listFollowing(uid, cursor, size);
    }
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/activity/api/
git commit -m "feat(activity): ActivityController GET /api/v1/activities/following"
```

---

### Task 49: Activity 90-day archive job

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/activity/job/ActivityArchiveJob.java`

- [ ] **Step 1: Job**

```java
package com.tongji.activity.job;

import com.tongji.activity.mapper.ActivityMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
public class ActivityArchiveJob {

    private static final Logger log = LoggerFactory.getLogger(ActivityArchiveJob.class);
    private static final Duration TTL = Duration.ofDays(90);

    private final ActivityMapper activityMapper;

    public ActivityArchiveJob(ActivityMapper activityMapper) {
        this.activityMapper = activityMapper;
    }

    /** Daily at 03:00 — drop activity rows older than 90 days. Physical delete (not archive table) for simplicity. */
    @Scheduled(cron = "0 0 3 * * *")
    public void purge() {
        Instant cutoff = Instant.now().minus(TTL);
        try {
            int deleted = activityMapper.deleteOlderThan(cutoff);
            log.info("activity archive: deleted {} rows older than {}", deleted, cutoff);
        } catch (Exception e) {
            log.error("activity archive failed", e);
        }
    }
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/activity/job/
git commit -m "feat(activity): 90-day archive job (daily 03:00)"
```

---

### Task 50: Section G smoke test

```bash
cd yixiang_be && mvn clean package -DskipTests
```

Optional live test (requires running Kafka + DB + a follow + a like):

```bash
# follow user 2 (as user 1)
curl -X POST "http://localhost:8080/api/v1/relations/follow/2" -H "Authorization: Bearer $TOKEN_1"
# user 2 likes some post 100
curl -X POST "http://localhost:8080/api/v1/actions/like" -H "Authorization: Bearer $TOKEN_2" \
  -d '{"entityType":"post","entityId":"100"}' -H "Content-Type: application/json"
# wait Kafka consumer ~3s
sleep 3
# user 1 sees user 2's like in following timeline
curl -s "http://localhost:8080/api/v1/activities/following?size=5" -H "Authorization: Bearer $TOKEN_1"
```

Expected: items contains the LIKE activity by user 2 on post 100.

---

## Section H: recentLikers enhancement — `com.tongji.counter.recent`

**Goal:** When user 视 a feed item, show top 5 recent likers and a summary string like "张三、李四 等 12 人觉得很赞". Implementation per spec 4.2 — keep counter mainline untouched, add a side-channel Redis ZSET maintained by a new Kafka consumer.

**Storage:** Redis ZSET `recent:likers:{postId}` — member = userId (string), score = timestamp millis. Maintained at top 5 via `ZREMRANGEBYRANK key 0 -6`. TTL 7 days.

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/counter/recent/RecentLikersService.java`
- Create: `yixiang_be/src/main/java/com/tongji/counter/recent/RecentLikersConsumer.java`
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/api/dto/FeedItemResponse.java` (add 2 fields)
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImpl.java` (populate in enrich)
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/listener/FeedCacheInvalidationListener.java` (preserve fields on rebuild)

---

### Task 51: RecentLikersService

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/counter/recent/RecentLikersService.java`

- [ ] **Step 1: Create directory**

```bash
mkdir -p yixiang_be/src/main/java/com/tongji/counter/recent
```

- [ ] **Step 2: Service**

```java
package com.tongji.counter.recent;

import com.tongji.user.api.dto.UserBrief;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.redisson.api.RScoredSortedSet;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 最近点赞人 ZSET. 由 RecentLikersConsumer 写入,FeedItemResponse 读取.
 * Key: recent:likers:{postId}
 * Member: userId (Long)
 * Score: ZADD 时的时间戳 (millis)
 * 容量: top 5 (ZREMRANGEBYRANK 0 -6)
 * TTL: 7 days
 */
@Service
public class RecentLikersService {

    private static final String KEY_PREFIX = "recent:likers:";
    private static final int CAPACITY = 5;
    private static final Duration TTL = Duration.ofDays(7);

    private final RedissonClient redisson;
    private final UserMapper userMapper;

    public RecentLikersService(RedissonClient redisson, UserMapper userMapper) {
        this.redisson = redisson;
        this.userMapper = userMapper;
    }

    /** Adds (or refreshes) a liker; trims to top 5; refreshes TTL. */
    public void addLiker(long postId, long userId) {
        RScoredSortedSet<Long> zset = redisson.getScoredSortedSet(KEY_PREFIX + postId);
        zset.add((double) System.currentTimeMillis(), userId);
        if (zset.size() > CAPACITY) {
            // Drop oldest (lowest score) beyond top 5. ZREMRANGEBYRANK 0 -6 in raw Redis;
            // Redisson API: removeRangeByRank(0, size-CAPACITY-1) — but simpler: pollFirst until size<=CAPACITY.
            int over = zset.size() - CAPACITY;
            for (int i = 0; i < over; i++) {
                zset.pollFirst();
            }
        }
        zset.expire(TTL);
    }

    /** Removes a liker (on unlike). */
    public void removeLiker(long postId, long userId) {
        RScoredSortedSet<Long> zset = redisson.getScoredSortedSet(KEY_PREFIX + postId);
        zset.remove(userId);
    }

    /** Returns top 5 (newest first) UserBriefs for the given post. */
    public List<UserBrief> top5(long postId) {
        RScoredSortedSet<Long> zset = redisson.getScoredSortedSet(KEY_PREFIX + postId);
        if (zset.isEmpty()) return List.of();
        // valueRangeReversed: highest score first (newest first)
        Collection<Long> ids = zset.valueRangeReversed(0, CAPACITY - 1);
        if (ids.isEmpty()) return List.of();

        Map<Long, UserBrief> byId = userMapper.listSummariesByIds(ids).stream()
                .collect(Collectors.toMap(User::getId, UserBrief::from));
        // Preserve recency order
        List<UserBrief> out = new ArrayList<>(ids.size());
        for (Long id : ids) {
            UserBrief b = byId.get(id);
            if (b != null) out.add(b);
        }
        return out;
    }

    /** Returns top 5 keyed by postId, in one batch (still N round-trips to Redis but parallelizable later). */
    public Map<Long, List<UserBrief>> top5Batch(Collection<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) return Map.of();
        Map<Long, List<UserBrief>> out = new HashMap<>(postIds.size());
        // Collect all user IDs across posts first to make one userMapper call
        Map<Long, Collection<Long>> idsPerPost = new HashMap<>();
        Set<Long> allUserIds = new HashSet<>();
        for (Long pid : postIds) {
            RScoredSortedSet<Long> zset = redisson.getScoredSortedSet(KEY_PREFIX + pid);
            Collection<Long> ids = zset.isEmpty() ? List.of() : zset.valueRangeReversed(0, CAPACITY - 1);
            idsPerPost.put(pid, ids);
            allUserIds.addAll(ids);
        }
        Map<Long, UserBrief> byId = allUserIds.isEmpty() ? Map.of() :
                userMapper.listSummariesByIds(allUserIds).stream()
                        .collect(Collectors.toMap(User::getId, UserBrief::from));
        for (Map.Entry<Long, Collection<Long>> e : idsPerPost.entrySet()) {
            List<UserBrief> briefs = new ArrayList<>(e.getValue().size());
            for (Long uid : e.getValue()) {
                UserBrief b = byId.get(uid);
                if (b != null) briefs.add(b);
            }
            out.put(e.getKey(), briefs);
        }
        return out;
    }

    /** Build display string: "张三、李四 等 N 人觉得很赞". */
    public String summary(List<UserBrief> briefs, long likeCount) {
        if (likeCount <= 0 || briefs == null || briefs.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        int show = Math.min(2, briefs.size());
        for (int i = 0; i < show; i++) {
            if (i > 0) sb.append("、");
            sb.append(briefs.get(i).nickname());
        }
        if (likeCount > show) {
            sb.append(" 等 ").append(likeCount).append(" 人觉得很赞");
        } else {
            sb.append(" 觉得很赞");
        }
        return sb.toString();
    }
}
```

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/counter/recent/RecentLikersService.java
git commit -m "feat(recentLikers): RecentLikersService (ZSET ops + summary builder)"
```

---

### Task 52: RecentLikersConsumer

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/counter/recent/RecentLikersConsumer.java`

- [ ] **Step 1: Consumer**

```java
package com.tongji.counter.recent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.counter.event.CounterEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class RecentLikersConsumer {

    private static final Logger log = LoggerFactory.getLogger(RecentLikersConsumer.class);

    private final ObjectMapper objectMapper;
    private final RecentLikersService recentLikersService;

    public RecentLikersConsumer(ObjectMapper objectMapper, RecentLikersService recentLikersService) {
        this.objectMapper = objectMapper;
        this.recentLikersService = recentLikersService;
    }

    @KafkaListener(topics = "counter-events", groupId = "recent-likers")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            CounterEvent evt = objectMapper.readValue(message, CounterEvent.class);
            if (!"like".equals(evt.getMetric())) {
                ack.acknowledge();
                return;
            }
            long postId = Long.parseLong(evt.getEntityId());
            long userId = evt.getUserId();
            if (evt.getDelta() == 1) {
                recentLikersService.addLiker(postId, userId);
            } else if (evt.getDelta() == -1) {
                recentLikersService.removeLiker(postId, userId);
            }
            ack.acknowledge();
        } catch (Exception e) {
            log.warn("RecentLikersConsumer failed; ack to skip", e);
            ack.acknowledge();
        }
    }
}
```

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/counter/recent/RecentLikersConsumer.java
git commit -m "feat(recentLikers): RecentLikersConsumer subscribes counter-events"
```

---

### Task 53: Extend FeedItemResponse with 2 new fields

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/api/dto/FeedItemResponse.java`

- [ ] **Step 1: Replace entire record with**

```java
package com.tongji.knowpost.api.dto;

import com.tongji.user.api.dto.UserBrief;

import java.util.List;

/**
 * 首页 Feed 单条记录。
 */
public record FeedItemResponse(
        String id,
        String title,
        String description,
        String coverImage,
        List<String> tags,
        String authorAvatar,
        String authorNickname,
        String tagJson,
        Long likeCount,
        Long favoriteCount,
        Long commentCount,
        Boolean liked,
        Boolean faved,
        Boolean isTop,
        List<UserBrief> recentLikers,
        String likerSummary
) {}
```

- [ ] **Step 2: Find ALL constructor call sites**

```bash
grep -rn "new FeedItemResponse(" yixiang_be/src/main/java
```

Expected hits: `KnowPostFeedServiceImpl.java` (enrich + possibly other places), `FeedCacheInvalidationListener.java`, and any cache-assemble path. Each call site needs two trailing arguments. For non-enrich call sites that don't have liker data, pass `List.of()` + `""`:

```java
new FeedItemResponse(
    /* ...existing 14 args... */,
    List.of(),                 // recentLikers
    ""                         // likerSummary
)
```

- [ ] **Step 3: Compile until clean**

```bash
cd yixiang_be && mvn compile
```

Fix every remaining call site reported by the compiler in the same pattern.

- [ ] **Step 4: Commit**

```bash
git add -u yixiang_be/src
git commit -m "feat(feed): add recentLikers + likerSummary to FeedItemResponse"
```

---

### Task 54: Populate recentLikers in KnowPostFeedServiceImpl.enrich

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImpl.java`

- [ ] **Step 1: Inject RecentLikersService**

Find the constructor of `KnowPostFeedServiceImpl`. Add `RecentLikersService` parameter:

```java
private final RecentLikersService recentLikersService;

public KnowPostFeedServiceImpl(/* ...existing... */, RecentLikersService recentLikersService) {
    // ...existing assignments...
    this.recentLikersService = recentLikersService;
}
```

Add import:

```java
import com.tongji.counter.recent.RecentLikersService;
import com.tongji.user.api.dto.UserBrief;
import java.util.Map;
```

- [ ] **Step 2: Rewrite enrich() to use batch fetch + summary**

Replace the existing `enrich(List<FeedItemResponse> base, Long uid)` method with:

```java
    private List<FeedItemResponse> enrich(List<FeedItemResponse> base, Long uid) {
        List<FeedItemResponse> out = new ArrayList<>(base.size());

        Set<Long> postIds = base.stream()
                .map(it -> {
                    try { return Long.parseLong(it.id()); }
                    catch (NumberFormatException e) { return null; }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, List<UserBrief>> likersByPost = recentLikersService.top5Batch(postIds);

        for (FeedItemResponse it : base) {
            boolean liked = uid != null && counterService.isLiked("knowpost", it.id(), uid);
            boolean faved = uid != null && counterService.isFaved("knowpost", it.id(), uid);
            long postId;
            try { postId = Long.parseLong(it.id()); }
            catch (NumberFormatException e) { postId = -1; }
            List<UserBrief> likers = likersByPost.getOrDefault(postId, List.of());
            String summary = recentLikersService.summary(likers, it.likeCount() == null ? 0L : it.likeCount());

            out.add(new FeedItemResponse(
                    it.id(), it.title(), it.description(), it.coverImage(),
                    it.tags(), it.authorAvatar(), it.authorNickname(), it.tagJson(),
                    it.likeCount(), it.favoriteCount(), it.commentCount(),
                    liked, faved, it.isTop(),
                    likers,
                    summary
            ));
        }
        return out;
    }
```

Ensure imports include `java.util.*` (Set, Objects, Map, etc.) and `java.util.stream.Collectors`.

- [ ] **Step 3: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImpl.java
git commit -m "feat(feed): enrich now populates recentLikers + summary"
```

---

### Task 55: Preserve fields in cache invalidation rebuild

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/listener/FeedCacheInvalidationListener.java`

- [ ] **Step 1: Inspect the rebuild path**

```bash
grep -n "new FeedItemResponse" yixiang_be/src/main/java/com/tongji/knowpost/listener/FeedCacheInvalidationListener.java
```

If the listener constructs FeedItemResponse and currently does NOT pass recentLikers, after Task 53 it must now pass two args. The simplest correct fix is to preserve the existing values from the prior `FeedItemResponse`:

In the existing constructor call (around line 156), append:

```java
                            it.recentLikers(),
                            it.likerSummary()
```

(This keeps the cached values stable during partial rebuild. They'll be refreshed on next `enrich` pass.)

- [ ] **Step 2: Compile + commit**

```bash
cd yixiang_be && mvn compile
git add yixiang_be/src/main/java/com/tongji/knowpost/listener/FeedCacheInvalidationListener.java
git commit -m "feat(feed): preserve recentLikers on cache rebuild"
```

---

### Task 56: Section H smoke test + final full build

```bash
cd yixiang_be && mvn clean package -DskipTests
```

Expected: BUILD SUCCESS.

```bash
mvn test
```

Expected: all existing tests still pass (Section H must not break counter / cache / feed regression tests).

Optional live test:

```bash
# user 2 likes post 100
curl -X POST "http://localhost:8080/api/v1/actions/like" -H "Authorization: Bearer $TOKEN_2" \
  -d '{"entityType":"post","entityId":"100"}' -H "Content-Type: application/json"
sleep 3  # wait Kafka consumer
# fetch feed — post 100's FeedItem should now include recentLikers[0] = user 2 and likerSummary
curl -s "http://localhost:8080/api/v1/feed?page=0&size=10" -H "Authorization: Bearer $TOKEN_1" | grep -A2 -B2 "recentLikers"
```

---

<!-- END OF PLAN —— See Self-Review checklist below -->

## Self-Review Checklist (run after all tasks)

### Spec coverage

- [x] Section A — DB migration (`V2__p1_base.sql`): users 3 cols + topics + drafts + user_settings + activities. ✓ spec 4.1, 4.2
- [x] Section B — `com.tongji.hot` module + Caffeine cache. ✓ spec 4.1 #1
- [x] Section C — `com.tongji.topic` module with hot-key protection (Redis INCR + scheduled flush). ✓ spec 4.1 #2, 4.4 #3
- [x] Section D — `com.tongji.recommend` module with Caffeine 60s cache. ✓ spec 4.1 #5, 4.4 #4
- [x] Section E — `com.tongji.draft` module (CRUD + publish). ✓ spec 4.1 #3
- [x] Section F — `com.tongji.settings` module (GET + PATCH). ✓ spec 4.1 #4
- [x] Section G — `com.tongji.activity` module with 2 Kafka consumers + inline producers + 90d archive. ✓ spec 4.1 #6, 4.4 #2
- [x] Section H — recentLikers Redis ZSET + consumer + FeedItem fields. ✓ spec 4.2 #8, 4.4 #5
- [x] All new errors use `BusinessException(ErrorCode.XXX)`. ✓ spec 4.4 #6
- [x] All cross-module integrations (publish flow → topic + activity) hooked.

### Plan quality

- [x] Every Task lists exact file paths.
- [x] Every code step contains complete code (no "similar to above").
- [x] Every command shows expected output (or "BUILD SUCCESS").
- [x] No "TBD" / "implement later" / "add error handling".
- [x] Type names are consistent across tasks (`FeedItemResponse` not `FeedItem`, `Activity` not `ActivityRow`).
- [x] Each Task ends with a commit.

### Constraint check

- [x] counter / relation / search / outbox / canal / kafka mainline NOT modified (only new consumers / new packages added).
- [x] All new modules use existing patterns (`@Service`, `@RestController`, `ThreadLocalRandom` IDs, `BusinessException`, MyBatis XML, Redisson, `@KafkaListener` + manual ack).
- [x] `recentLikers` ZSET capped at 5 with TTL 7d. ✓ spec 4.4 #5
- [x] `recommend` cached 60s. ✓ spec 4.4 #4
- [x] `activity` table archived at 90d. ✓ spec 4.4 #2
- [x] Topic view counts buffered in Redis, not direct DB UPDATE per request. ✓ spec 4.4 #3

### Known gaps left to executor judgment

1. **`allowMultiQueries=true`** flag (Task 16 Step 3): plan updates the `.example` file; executor must also update local `application.yml`.
2. **Mapper field naming** for relation table (Task 23 Step 1): the SQL assumes `followed_id`. If schema uses different names, executor adjusts.
3. **`KnowPostMapper.setX` setters** (Task 32 Step 2): plan assumes Lombok `@Data` exposes setters for `circleId`, `coverImage`, `contentUrl`, `status`. Executor verifies presence and adds fields if absent.
4. **`enrich` Long.parseLong on it.id()** (Task 54 Step 2): assumes feed item id is numeric string. If id format changed elsewhere, executor adapts.
5. **`KnowPost.getCircleId()` / `getCoverImage()` getters**: may not exist before Section E. Executor adds to model class if missing.

### Total Tasks

**56 tasks** across **8 sections**:
- Section A (Base): Tasks 1–8 (8 tasks)
- Section B (hot): Tasks 9–14 (6 tasks)
- Section C (topic): Tasks 15–21 (7 tasks)
- Section D (recommend): Tasks 22–27 (6 tasks)
- Section E (draft): Tasks 28–34 (7 tasks)
- Section F (settings): Tasks 35–40 (6 tasks)
- Section G (activity): Tasks 41–50 (10 tasks)
- Section H (recentLikers): Tasks 51–56 (6 tasks)


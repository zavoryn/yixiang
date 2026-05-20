# Phase 1.5: API Gap Patches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 4 backend API gaps that block P2 frontend pages, discovered after P1 review. Each section ships one endpoint or DTO change. After Phase 1.5: every P2 page can fetch its data without hitting a missing endpoint or missing field.

**Context (read first):** P0 (frontend foundation) and P1 (six new backend modules + recentLikers Redis ZSET) are done. P1 review surfaced 6 candidate gaps. Two are deferred to P2 (topics/hot cursor pagination, CommentDTO verified/level). The four blocking gaps are addressed here:

| Section | Endpoint / change | Blocks P2 page |
|---|---|---|
| A | `GET /api/v1/profile/{userId}` | Profile page (viewing other users) |
| B | `GET /api/v1/knowposts/liked` | Profile page "my likes" tab |
| C | `GET /api/v1/circles/{circleId}/members` | Circle detail (members card) |
| D | `KnowPostDetailResponse` adds `recentLikers` + `likerSummary` | Post detail page |

**Architecture:** Each section follows the existing layered pattern `api/` (controller + DTO records) → `service/` (interface + impl) → `mapper/` (MyBatis XML in `src/main/resources/mapper/`). Application-layer Snowflake-style IDs via `ThreadLocalRandom.current().nextLong(Long.MAX_VALUE)` (not needed in this plan, no new tables). All errors thrown as `BusinessException(ErrorCode.XXX)`. Public GETs are added to `SecurityConfig.permitAll`. **No new DB tables** — Section B reuses the existing `activities` table (already records LIKE events via Kafka consumer); Section C reuses the existing `circle_members` table and `listActiveMembers` mapper query.

**Tech Stack:** Java 21, Spring Boot 3.2.4, MyBatis 3.0.3, MySQL 8.0, Redis (Redisson), Lombok. JUnit 5 + Mockito for tests.

---

## File Structure

**Modify (existing files):**

- `com/tongji/auth/config/SecurityConfig.java` — add three `permitAll` matchers (Sections A, B, C)
- `com/tongji/profile/service/ProfileService.java` — add `getProfile(long userId)` method (Section A)
- `com/tongji/profile/service/impl/ProfileServiceImpl.java` — implement (Section A)
- `com/tongji/profile/api/ProfileController.java` — add `GET /{userId}` endpoint (Section A)
- `com/tongji/activity/mapper/ActivityMapper.java` — add `listLikedPostIdsByUser` (Section B)
- `src/main/resources/mapper/ActivityMapper.xml` — add SQL for `listLikedPostIdsByUser` (Section B)
- `com/tongji/knowpost/mapper/KnowPostMapper.java` — add `listFeedByIds` (Section B)
- `src/main/resources/mapper/KnowPostMapper.xml` — add SQL for `listFeedByIds` (Section B)
- `com/tongji/knowpost/service/KnowPostFeedService.java` — add `getLikedFeed` interface method (Section B)
- `com/tongji/knowpost/service/impl/KnowPostFeedServiceImpl.java` — implement (Section B)
- `com/tongji/knowpost/api/KnowPostController.java` — add `GET /liked` endpoint (Section B)
- `com/tongji/circle/service/CircleService.java` — add `listMembers` interface method (Section C)
- `com/tongji/circle/service/impl/CircleServiceImpl.java` — implement (Section C)
- `com/tongji/circle/api/CircleMemberController.java` — add `GET /members` endpoint (Section C)
- `com/tongji/knowpost/api/dto/KnowPostDetailResponse.java` — add two fields (Section D)
- `com/tongji/knowpost/service/KnowPostService.java` — (interface unchanged, impl only)
- `com/tongji/knowpost/service/impl/KnowPostServiceImpl.java` — inject RecentLikersService, populate (Section D)

**Create (new files):**

- `com/tongji/circle/api/dto/CircleMemberListResponse.java` — paged member list (Section C)
- `com/tongji/circle/api/dto/CircleMemberItem.java` — single member card (Section C)
- `yixiang_be/src/test/java/com/tongji/profile/service/impl/ProfileServiceImplTest.java` — Section A tests (if not present)
- `yixiang_be/src/test/java/com/tongji/circle/service/impl/CircleServiceImplListMembersTest.java` — Section C tests
- (Section B test added inside an existing test file if convenient, else a new `KnowPostFeedServiceImplLikedTest.java`)
- (Section D test added inside an existing test file if convenient, else `KnowPostServiceImplDetailRecentLikersTest.java`)

---

## Verification commands

Run from `yixiang_be/` (the project uses system `mvn`, JDK 21):

```bash
mvn compile                          # fastest — compile only
mvn test -Dtest=ClassName            # single test class
mvn test                             # full suite
mvn clean package -DskipTests        # final build artifact
```

If `mvn compile` reports "release version 21 not supported," set `JAVA_HOME` to a JDK 21 install before running.

Migrations are NOT applied by the executor — DBA runs Flyway. This plan introduces no migrations.

---

## Section A: GET /api/v1/profile/{userId} — Public profile lookup

**Goal:** Allow any client (logged-in or anonymous) to fetch a user's public profile by ID. Returns the same `ProfileResponse` shape that PATCH already returns. Throws 404-style `BusinessException(ErrorCode.IDENTIFIER_NOT_FOUND)` if the user does not exist.

**Design decision:** Reuse `ProfileServiceImpl.toResponse(User)` (currently private) by exposing a new public service method `getProfile(long userId)` that wraps `userMapper.findById` + `toResponse`. Do not change `toResponse` visibility — keep it private and have the new public method call it.

**Endpoint contract:**
- **Method:** `GET`
- **Path:** `/api/v1/profile/{userId}`
- **Auth:** Anonymous allowed (added to SecurityConfig permitAll). The frontend may pass JWT or not.
- **200 body:** `ProfileResponse` JSON (existing record, no field changes)
- **400 body:** `{ code, message }` from `GlobalExceptionHandler` when user not found

---

### Task A.1: Add `getProfile(long userId)` to ProfileService interface

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/profile/service/ProfileService.java`

- [ ] **Step 1: Add the interface method**

Open `ProfileService.java`. Below the existing `getById` declaration, add a new method declaration:

```java
ProfileResponse getProfile(long userId);
```

The full file should now read (only the new line is added — do not touch `getById`, `updateProfile`, `updateAvatar`):

```java
package com.tongji.profile.service;

import com.tongji.profile.api.dto.ProfilePatchRequest;
import com.tongji.profile.api.dto.ProfileResponse;
import com.tongji.user.domain.User;

import java.util.Optional;

/**
 * 个人资料业务接口。
 */
public interface ProfileService {

    Optional<User> getById(long userId);

    ProfileResponse getProfile(long userId);

    ProfileResponse updateProfile(long userId, ProfilePatchRequest req);

    ProfileResponse updateAvatar(long userId, String avatarUrl);
}
```

**Verify:** `mvn compile` must report a missing implementation in `ProfileServiceImpl` (expected — Task A.2 fixes it). If it reports a syntax error in `ProfileService.java`, re-check braces.

---

### Task A.2: Implement `getProfile` in ProfileServiceImpl

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/profile/service/impl/ProfileServiceImpl.java`

- [ ] **Step 1: Implement the method**

Insert this method into `ProfileServiceImpl`, placed immediately after the existing `getById` method (lines 43–47 in the current file). Add `@Override` and `@Transactional(readOnly = true)` matching the existing style.

```java
    /**
     * 根据用户 ID 返回个人资料快照。
     *
     * <p>区别于 {@link #getById(long)}：直接返回对外 DTO，并在用户不存在时抛出业务异常。</p>
     *
     * @param userId 目标用户 ID（可以是任意人，非仅当前登录用户）
     * @return 对应 {@link ProfileResponse}
     */
    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.IDENTIFIER_NOT_FOUND, "用户不存在");
        }
        return toResponse(user);
    }
```

**Verify:** `mvn compile` must succeed. If `toResponse` is not visible from the new method's call site, confirm both live in the same class (`ProfileServiceImpl`) — no visibility change is required.

---

### Task A.3: Add `GET /{userId}` to ProfileController

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/profile/api/ProfileController.java`

- [ ] **Step 1: Add the GET endpoint**

Insert the new handler immediately after the class field declarations (before the `@PatchMapping` handler at line 47). Use `@PathVariable("userId")` and call the new service method.

```java
    /**
     * 查看任意用户的公开个人资料。
     *
     * <p>不要求登录；不存在的用户返回业务异常。</p>
     *
     * @param userId 目标用户 ID
     * @return {@link ProfileResponse}
     */
    @org.springframework.web.bind.annotation.GetMapping("/{userId}")
    public ProfileResponse getById(@org.springframework.web.bind.annotation.PathVariable("userId") long userId) {
        return profileService.getProfile(userId);
    }
```

(The fully-qualified annotation references are intentional — keeps the diff small without touching the import block. If the executor prefers to add `import org.springframework.web.bind.annotation.GetMapping; import org.springframework.web.bind.annotation.PathVariable;` at the top, that is equivalent and acceptable.)

**Verify:** `mvn compile` must succeed.

---

### Task A.4: Open the new path to anonymous access

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java`

- [ ] **Step 1: Add a permitAll matcher**

In the `authorizeHttpRequests` block, add a new matcher line that opens `GET /api/v1/profile/*` (single path segment after `/profile/`). Place it next to the existing public-content matchers (after the `/api/v1/topics/**` line and before `/api/v1/recommend/**` is fine).

Add this line:

```java
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/profile/*").permitAll()
```

Resulting fragment for context:

```java
                        // 话题（GET 公开，POST view 需认证）
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/topics/**").permitAll()
                        // 个人主页（公开浏览）
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/profile/*").permitAll()
                        // 推荐（公开，已登录用户排除已关注/已加入）
                        .requestMatchers("/api/v1/recommend/**").permitAll()
```

**Note:** the single `*` matches exactly one path segment, so `/api/v1/profile/123` is matched while `/api/v1/profile` (the PATCH endpoint for self) and `/api/v1/profile/avatar` (POST) remain authenticated — `avatar` is POST not GET, so the `HttpMethod.GET` filter excludes it anyway.

**Verify:** `mvn compile` must succeed. No behavioural change to existing PATCH/POST endpoints.

---

### Task A.5: Unit tests for Section A

**Files:**
- Modify or create: `yixiang_be/src/test/java/com/tongji/profile/service/impl/ProfileServiceImplTest.java`

- [ ] **Step 1: Add two test cases**

If the test file already exists, append the methods below into the test class. If it does not exist, create it with the skeleton shown.

```java
package com.tongji.profile.service.impl;

import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.profile.api.dto.ProfileResponse;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    @Mock UserMapper userMapper;
    @InjectMocks ProfileServiceImpl service;

    @Test
    void getProfile_returnsResponse_whenUserExists() {
        User u = new User();
        u.setId(42L);
        u.setNickname("test-nick");
        u.setAvatar("https://example.com/a.png");
        when(userMapper.findById(42L)).thenReturn(u);

        ProfileResponse resp = service.getProfile(42L);

        assertThat(resp.id()).isEqualTo(42L);
        assertThat(resp.nickname()).isEqualTo("test-nick");
        assertThat(resp.avatar()).isEqualTo("https://example.com/a.png");
    }

    @Test
    void getProfile_throws_whenUserMissing() {
        when(userMapper.findById(99L)).thenReturn(null);

        assertThatThrownBy(() -> service.getProfile(99L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户不存在");
    }
}
```

If `ProfileServiceImplTest` already exists with other tests (e.g. `updateProfile_*` cases), do **not** overwrite — append the two `getProfile_*` methods and add imports that aren't already present.

**Verify:** `mvn test -Dtest=ProfileServiceImplTest` — both new tests pass; any existing tests in the file still pass.

---

### Section A — Commit

After all four tasks pass `mvn test`:

```
git add yixiang_be/src/main/java/com/tongji/profile/ \
        yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java \
        yixiang_be/src/test/java/com/tongji/profile/
git commit -m "feat(be): P1.5 Section A — GET /api/v1/profile/{userId} for public profile lookup"
```

---

## Section B: GET /api/v1/knowposts/liked — User's liked posts feed

**Goal:** Return a paginated list of posts that a given user has liked, ordered by liked-time descending. Frontend uses this for the "我的点赞" tab on the profile page.

**Data source:** The `activities` table already records LIKE events (the P1 `CounterActivityConsumer` writes a row of `type='LIKE', target_type='POST', target_id=postId` for every like). We fetch the list of liked post IDs from `activities`, then materialise full feed items via `KnowPostMapper.listFeedByIds` and reuse `KnowPostFeedServiceImpl.mapRowsToItems` so the returned shape matches `/feed` and `/mine` exactly (including counters, `recentLikers`, `likerSummary`).

**Endpoint contract:**
- **Method:** `GET`
- **Path:** `/api/v1/knowposts/liked`
- **Query params:**
  - `userId` (required, long) — whose likes to list
  - `page` (optional, default 1)
  - `size` (optional, default 20, capped at 50)
- **Auth:** Anonymous allowed (permitAll). The viewer's identity (used for `liked`/`faved` flags in the returned items) comes from the JWT if present.
- **200 body:** `FeedPageResponse` (existing record — reused)

**Edge cases:**
- `userId` invalid (no rows in `users`): return empty page, do not throw (the activities table is authoritative for "what was liked"; the user may have been soft-deleted later).
- Like row exists but the referenced post was deleted: `listFeedByIds` filters by `published`+`visible='public'` (matching `listFeedPublic`), so deleted/private posts are silently dropped.

---

### Task B.1: Add `listLikedPostIdsByUser` to ActivityMapper

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/activity/mapper/ActivityMapper.java`
- Modify: `yixiang_be/src/main/resources/mapper/ActivityMapper.xml`

- [ ] **Step 1: Java interface — add method declaration**

In `ActivityMapper.java`, add this method below the existing `listByUsers`:

```java
    /**
     * 列出指定用户点赞过的帖子 ID（去重 + 按时间倒序 + 分页）。
     *
     * @param userId 用户 ID
     * @param offset 起始偏移（页码-1 * size）
     * @param limit  最多返回多少条（size+1 调用方判断 hasMore 用）
     */
    List<Long> listLikedPostIdsByUser(@Param("userId") long userId,
                                      @Param("offset") int offset,
                                      @Param("limit") int limit);
```

The full file becomes:

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

    List<Long> listLikedPostIdsByUser(@Param("userId") long userId,
                                      @Param("offset") int offset,
                                      @Param("limit") int limit);
}
```

- [ ] **Step 2: XML — add SELECT**

In `ActivityMapper.xml`, append this `<select>` inside the existing `<mapper namespace="com.tongji.activity.mapper.ActivityMapper">` element (before `</mapper>`).

```xml
    <select id="listLikedPostIdsByUser" resultType="long">
        SELECT target_id
        FROM activities
        WHERE user_id = #{userId}
          AND type = 'LIKE'
          AND target_type = 'POST'
        ORDER BY id DESC
        LIMIT #{limit} OFFSET #{offset}
    </select>
```

**Note on duplicates:** If a user likes → unlikes → likes the same post, multiple activity rows can exist for that post. We accept this as a known minor anomaly (rare in practice). A more sophisticated query using `GROUP BY target_id` is possible but harder to paginate efficiently; the dedup-on-read approach in Task B.4 handles it.

**Verify:** `mvn compile` must succeed.

---

### Task B.2: Add `listFeedByIds` to KnowPostMapper

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/mapper/KnowPostMapper.java`
- Modify: `yixiang_be/src/main/resources/mapper/KnowPostMapper.xml`

- [ ] **Step 1: Java interface — add method**

In `KnowPostMapper.java`, add below `listMyPublishedIds`:

```java
    // 批量按 ID 列出 Feed 行（仅 published + public 可见），未传 ID 集合时返回空。
    List<KnowPostFeedRow> listFeedByIds(@Param("ids") Collection<Long> ids);
```

Add the import if missing:

```java
import java.util.Collection;
```

- [ ] **Step 2: XML — add SELECT**

Find the existing `listFeedPublic` or `listMyPublished` `<select>` element in `KnowPostMapper.xml` and copy its `resultMap` reference and column set. Append the new `<select>` (place it near the other Feed selects). The exact result mapping must match `KnowPostFeedRow` — the simplest approach is to copy the SELECT column list from `listFeedPublic` verbatim, replacing the WHERE clause and removing the ORDER BY / LIMIT clauses.

Schematic shape (executor: open `KnowPostMapper.xml` and copy the column list and `resultMap` of `listFeedPublic`, then substitute the body):

```xml
    <select id="listFeedByIds" resultMap="FEED_ROW_MAP_NAME_HERE">
        <!--
          Copy SELECT column list from listFeedPublic above (the same alias/columns).
          The joins on users / counter aggregations etc. must match listFeedPublic.
        -->
        SELECT
            <!-- ... same column list as listFeedPublic ... -->
        FROM know_posts kp
        <!-- ... same joins as listFeedPublic ... -->
        WHERE kp.status = 'published'
          AND kp.visible = 'public'
          AND kp.id IN
        <foreach collection="ids" item="id" open="(" separator="," close=")">#{id}</foreach>
        <!-- preserve caller's order: caller sorts the ids list themselves -->
    </select>
```

**Executor instructions for Step 2:**
1. Open `KnowPostMapper.xml`.
2. Locate `<select id="listFeedPublic" ...>` — that block defines exactly the column shape `KnowPostFeedRow` expects, including any `<resultMap>` alias used.
3. Write `listFeedByIds` to project the **same** columns and joins. The only differences:
   - WHERE clause uses `kp.id IN (...)` instead of `kp.status='published' AND kp.visible='public'`. Keep `status='published' AND visible='public'` AND add `id IN (...)`.
   - Remove ORDER BY and LIMIT/OFFSET (the caller handles ordering by re-sorting the returned list to match the input `ids` order).
4. If `listFeedPublic` uses a named `<resultMap>`, reuse it. If it inlines the column-to-property mapping, inline the same mapping into `listFeedByIds`.

**Verify:** `mvn compile` must succeed. If MyBatis warns at startup about the new SQL, validate column types match the existing query's resultMap.

---

### Task B.3: Add `getLikedFeed` to KnowPostFeedService interface

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/service/KnowPostFeedService.java`

- [ ] **Step 1: Add method declaration**

Add this method to the interface (after `getMyPublished`):

```java
    /**
     * 用户点赞过的帖子分页列表。
     *
     * @param ownerUserId 被查看主页的用户（被点赞列表的归属人）
     * @param viewerUserId 当前登录用户（可空），用于 liked/faved 维度
     * @param page 页码（≥1）
     * @param size 每页数量（1~50）
     */
    FeedPageResponse getLikedFeed(long ownerUserId, Long viewerUserId, int page, int size);
```

**Verify:** `mvn compile` will fail until B.4 implements it — expected.

---

### Task B.4: Implement `getLikedFeed` in KnowPostFeedServiceImpl

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImpl.java`

- [ ] **Step 1: Inject ActivityMapper**

`KnowPostFeedServiceImpl` currently has its constructor list `mapper, redis, objectMapper, counterService, recentLikersService, feedPublicCache, feedMineCache, hotKey`. Add `ActivityMapper activityMapper` as a new constructor param and field. Follow the existing pattern exactly — no `@Autowired` on field, only on the constructor.

```java
    private final ActivityMapper activityMapper;
```

In the `@Autowired` constructor signature, add a new parameter and assignment. The constructor head and body become:

```java
    @Autowired
    public KnowPostFeedServiceImpl(
            KnowPostMapper mapper,
            StringRedisTemplate redis,
            ObjectMapper objectMapper,
            CounterService counterService,
            RecentLikersService recentLikersService,
            ActivityMapper activityMapper,
            @Qualifier("feedPublicCache") Cache<String, FeedPageResponse> feedPublicCache,
            @Qualifier("feedMineCache") Cache<String, FeedPageResponse> feedMineCache,
            HotKeyDetector hotKey
    ) {
        this.mapper = mapper;
        this.redis = redis;
        this.objectMapper = objectMapper;
        this.counterService = counterService;
        this.recentLikersService = recentLikersService;
        this.activityMapper = activityMapper;
        this.feedPublicCache = feedPublicCache;
        this.feedMineCache = feedMineCache;
        this.hotKey = hotKey;
    }
```

Add the import:

```java
import com.tongji.activity.mapper.ActivityMapper;
```

- [ ] **Step 2: Implement `getLikedFeed`**

Add this method to the same class (placement: after `getMyPublished`, before `parseStringArray`). No caching for this endpoint — keep it simple. The viewer's `liked`/`faved` flags are computed inside `mapRowsToItems`.

```java
    /**
     * 用户点赞过的帖子分页列表。
     *
     * <p>实现思路：</p>
     * <ol>
     *   <li>从 activities 表取该用户的 LIKE 行为 (target_type=POST) 的 post id 列表 (size+1 判 hasMore)</li>
     *   <li>去重，保留首次出现顺序（一个帖被点赞-取消-点赞会产生重复行）</li>
     *   <li>批量 listFeedByIds 取行（已过滤 published+public）</li>
     *   <li>按 id 出现顺序回填，mapRowsToItems 转换</li>
     * </ol>
     */
    @Override
    public FeedPageResponse getLikedFeed(long ownerUserId, Long viewerUserId, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        int safePage = Math.max(page, 1);
        int offset = (safePage - 1) * safeSize;

        List<Long> rawIds = activityMapper.listLikedPostIdsByUser(ownerUserId, offset, safeSize + 1);

        // 去重并保留首次顺序
        java.util.LinkedHashSet<Long> uniqueIds = new java.util.LinkedHashSet<>(rawIds);
        List<Long> orderedIds = new ArrayList<>(uniqueIds);

        boolean hasMore = orderedIds.size() > safeSize;
        if (hasMore) {
            orderedIds = orderedIds.subList(0, safeSize);
        }

        if (orderedIds.isEmpty()) {
            return new FeedPageResponse(List.of(), safePage, safeSize, false);
        }

        // 批量取行；DB 返回顺序不可控，按 orderedIds 重排
        List<KnowPostFeedRow> rows = mapper.listFeedByIds(orderedIds);
        Map<Long, KnowPostFeedRow> byId = new java.util.HashMap<>(rows.size());
        for (KnowPostFeedRow r : rows) {
            byId.put(r.getId(), r);
        }
        List<KnowPostFeedRow> ordered = new ArrayList<>(orderedIds.size());
        for (Long id : orderedIds) {
            KnowPostFeedRow row = byId.get(id);
            if (row != null) ordered.add(row);
        }

        List<FeedItemResponse> items = mapRowsToItems(ordered, viewerUserId, false);
        return new FeedPageResponse(items, safePage, safeSize, hasMore);
    }
```

**Verify:** `mvn compile` must succeed.

---

### Task B.5: Add `GET /liked` endpoint to KnowPostController

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/api/KnowPostController.java`

- [ ] **Step 1: Add endpoint**

Place this handler after `mine` and before `detail` (around line 132):

```java
    /**
     * 用户点赞过的帖子列表（公开浏览，匿名也可访问）。
     *
     * @param userId 被查看的用户 ID（非当前登录用户）
     * @param page   页码（默认 1）
     * @param size   每页数量（默认 20，最大 50）
     * @param jwt    可选 JWT，决定返回项的 liked/faved 字段
     */
    @GetMapping("/liked")
    public FeedPageResponse liked(@RequestParam("userId") long userId,
                                  @RequestParam(value = "page", defaultValue = "1") int page,
                                  @RequestParam(value = "size", defaultValue = "20") int size,
                                  @AuthenticationPrincipal Jwt jwt) {
        Long viewerId = (jwt == null) ? null : jwtService.extractUserId(jwt);
        return feedService.getLikedFeed(userId, viewerId, page, size);
    }
```

The existing imports in this controller already cover `@GetMapping`, `@RequestParam`, `@AuthenticationPrincipal`, `Jwt`. No new imports needed.

**Verify:** `mvn compile` must succeed.

---

### Task B.6: Open the new path to anonymous access

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java`

- [ ] **Step 1: Add permitAll for GET /api/v1/knowposts/liked**

In `authorizeHttpRequests`, near the existing `/api/v1/knowposts/feed` matcher (line 55), add:

```java
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/knowposts/liked").permitAll()
```

Resulting fragment:

```java
                        // 公开内容：首页 Feed 不需要登录
                        .requestMatchers("/api/v1/knowposts/feed").permitAll()
                        // 用户点赞列表（公开）
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/knowposts/liked").permitAll()
                        // 知文详情（公开已发布内容，非公开由服务层校验）
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/knowposts/detail/*").permitAll()
```

**Verify:** `mvn compile` must succeed.

---

### Task B.7: Test for Section B

**Files:**
- Create or modify: `yixiang_be/src/test/java/com/tongji/knowpost/service/impl/KnowPostFeedServiceImplLikedTest.java`

- [ ] **Step 1: Write test**

Create the test file (or append to an existing `KnowPostFeedServiceImplTest` if present in the codebase — executor should check first via `find yixiang_be/src/test -name "KnowPostFeedServiceImpl*"`).

```java
package com.tongji.knowpost.service.impl;

import com.tongji.activity.mapper.ActivityMapper;
import com.tongji.cache.hotkey.HotKeyDetector;
import com.tongji.counter.recent.RecentLikersService;
import com.tongji.counter.service.CounterService;
import com.tongji.knowpost.api.dto.FeedPageResponse;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPostFeedRow;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class KnowPostFeedServiceImplLikedTest {

    @Mock KnowPostMapper mapper;
    @Mock StringRedisTemplate redis;
    @Mock CounterService counterService;
    @Mock RecentLikersService recentLikersService;
    @Mock ActivityMapper activityMapper;
    @Mock Cache<String, FeedPageResponse> feedPublicCache;
    @Mock Cache<String, FeedPageResponse> feedMineCache;
    @Mock HotKeyDetector hotKey;

    @Test
    void getLikedFeed_empty_whenNoActivity() {
        when(activityMapper.listLikedPostIdsByUser(eq(1L), eq(0), eq(21)))
                .thenReturn(List.of());

        KnowPostFeedServiceImpl service = new KnowPostFeedServiceImpl(
                mapper, redis, new ObjectMapper(), counterService, recentLikersService,
                activityMapper, feedPublicCache, feedMineCache, hotKey);

        FeedPageResponse resp = service.getLikedFeed(1L, null, 1, 20);
        assertThat(resp.items()).isEmpty();
        assertThat(resp.hasMore()).isFalse();
    }

    @Test
    void getLikedFeed_ordersByActivityOrder_andDedups() {
        // user 1 liked post 100, then 200, then 100 again, then 300
        when(activityMapper.listLikedPostIdsByUser(eq(1L), eq(0), eq(21)))
                .thenReturn(List.of(300L, 100L, 200L, 100L));

        KnowPostFeedRow r100 = row(100L, "post 100");
        KnowPostFeedRow r200 = row(200L, "post 200");
        KnowPostFeedRow r300 = row(300L, "post 300");
        when(mapper.listFeedByIds(any())).thenReturn(List.of(r200, r100, r300));

        lenient().when(counterService.getCounts(anyString(), anyString(), any()))
                .thenReturn(Map.of("like", 0L, "fav", 0L, "comment", 0L));
        when(recentLikersService.top5Batch(any())).thenReturn(Map.of());
        when(recentLikersService.summary(any(), anyLong())).thenReturn("");

        KnowPostFeedServiceImpl service = new KnowPostFeedServiceImpl(
                mapper, redis, new ObjectMapper(), counterService, recentLikersService,
                activityMapper, feedPublicCache, feedMineCache, hotKey);

        FeedPageResponse resp = service.getLikedFeed(1L, null, 1, 20);

        // Activity order is 300, 100, 200 (dedup of trailing 100), and rows fill in that order
        assertThat(resp.items()).extracting("id").containsExactly("300", "100", "200");
    }

    private static KnowPostFeedRow row(long id, String title) {
        KnowPostFeedRow r = new KnowPostFeedRow();
        r.setId(id);
        r.setTitle(title);
        r.setTags("[]");
        r.setImgUrls("[]");
        return r;
    }
}
```

**Note:** the test assumes `KnowPostFeedRow` exposes setters. If it is a Lombok `@Data` POJO, this works. If not, the executor adjusts the `row(...)` helper.

**Verify:** `mvn test -Dtest=KnowPostFeedServiceImplLikedTest` — both tests pass.

---

### Section B — Commit

After all six tasks pass `mvn test`:

```
git add yixiang_be/src/main/java/com/tongji/activity/mapper/ActivityMapper.java \
        yixiang_be/src/main/resources/mapper/ActivityMapper.xml \
        yixiang_be/src/main/java/com/tongji/knowpost/mapper/KnowPostMapper.java \
        yixiang_be/src/main/resources/mapper/KnowPostMapper.xml \
        yixiang_be/src/main/java/com/tongji/knowpost/service/ \
        yixiang_be/src/main/java/com/tongji/knowpost/api/KnowPostController.java \
        yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java \
        yixiang_be/src/test/java/com/tongji/knowpost/
git commit -m "feat(be): P1.5 Section B — GET /api/v1/knowposts/liked from activities table"
```

---

## Section C: GET /api/v1/circles/{circleId}/members — Circle members list

**Goal:** Paginated list of active circle members for the circle detail page. `CircleMemberMapper.listActiveMembers` already exists and orders OWNER → ADMIN → joined_at ASC. We only need to (a) define the response DTOs, (b) add a service method that joins with user info, (c) expose it via the controller, (d) permitAll.

**Endpoint contract:**
- **Method:** `GET`
- **Path:** `/api/v1/circles/{circleId}/members`
- **Query params:** `page` (default 1), `size` (default 20, capped at 100)
- **Auth:** Anonymous allowed
- **200 body:** `CircleMemberListResponse { items: [CircleMemberItem], total, page, size, hasMore }`

---

### Task C.1: Create `CircleMemberItem` DTO

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CircleMemberItem.java`

- [ ] **Step 1: Write the file**

```java
package com.tongji.circle.api.dto;

import java.time.Instant;

/**
 * 圈子成员卡片（用于圈子详情成员列表）。
 */
public record CircleMemberItem(
        Long userId,
        String nickname,
        String avatar,
        String role,        // OWNER / ADMIN / MEMBER
        Boolean verified,
        Instant joinedAt
) {}
```

**Verify:** `mvn compile` must succeed.

---

### Task C.2: Create `CircleMemberListResponse` DTO

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CircleMemberListResponse.java`

- [ ] **Step 1: Write the file**

```java
package com.tongji.circle.api.dto;

import java.util.List;

/**
 * 圈子成员分页响应。
 */
public record CircleMemberListResponse(
        List<CircleMemberItem> items,
        long total,
        int page,
        int size,
        boolean hasMore
) {}
```

**Verify:** `mvn compile` must succeed.

---

### Task C.3: Add `listMembers` to CircleService interface

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/circle/service/CircleService.java`

- [ ] **Step 1: Add method**

Add to the interface:

```java
    com.tongji.circle.api.dto.CircleMemberListResponse listMembers(long circleId, int page, int size);
```

(Fully-qualified type used to avoid touching the import block; executor may add `import com.tongji.circle.api.dto.CircleMemberListResponse;` instead, equivalent.)

The interface should now have 11 methods. Compile will fail until C.4 implements it.

**Verify:** `mvn compile` will fail — expected.

---

### Task C.4: Implement `listMembers` in CircleServiceImpl

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/circle/service/impl/CircleServiceImpl.java`

- [ ] **Step 1: Implement**

Append this method to `CircleServiceImpl` (place it near other read methods like `detail` or `joined`):

```java
    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.tongji.circle.api.dto.CircleMemberListResponse listMembers(long circleId, int page, int size) {
        // Verify circle exists (throws NOT_FOUND or business exception otherwise)
        requireCircle(circleId);

        int safeSize = Math.min(Math.max(size, 1), 100);
        int safePage = Math.max(page, 1);
        int offset = (safePage - 1) * safeSize;

        // Fetch one extra to compute hasMore without an extra COUNT round-trip on every page
        List<com.tongji.circle.model.CircleMember> members =
                memberMapper.listActiveMembers(circleId, safeSize + 1, offset);
        boolean hasMore = members.size() > safeSize;
        if (hasMore) {
            members = members.subList(0, safeSize);
        }

        // Pull total only for page 1 (UI shows total in a header); cheap query, member count cap is low
        long total = (safePage == 1) ? memberMapper.countActive(circleId) : -1L;

        if (members.isEmpty()) {
            return new com.tongji.circle.api.dto.CircleMemberListResponse(
                    java.util.List.of(), total, safePage, safeSize, hasMore);
        }

        // Batch-load user info
        java.util.List<Long> userIds = new java.util.ArrayList<>(members.size());
        for (com.tongji.circle.model.CircleMember m : members) userIds.add(m.getUserId());
        java.util.Map<Long, com.tongji.user.domain.User> userMap =
                userService.listSummariesByIds(userIds).stream()
                        .collect(java.util.stream.Collectors.toMap(
                                com.tongji.user.domain.User::getId, u -> u));

        java.util.List<com.tongji.circle.api.dto.CircleMemberItem> items =
                new java.util.ArrayList<>(members.size());
        for (com.tongji.circle.model.CircleMember m : members) {
            com.tongji.user.domain.User u = userMap.get(m.getUserId());
            if (u == null) continue; // member row references a deleted user; skip
            items.add(new com.tongji.circle.api.dto.CircleMemberItem(
                    u.getId(),
                    u.getNickname(),
                    u.getAvatar(),
                    m.getRole(),
                    Boolean.TRUE.equals(u.getVerified()),
                    m.getJoinedAt()
            ));
        }

        return new com.tongji.circle.api.dto.CircleMemberListResponse(
                items, total, safePage, safeSize, hasMore);
    }
```

**Notes for the executor:**
- `requireCircle(circleId)` is a private helper already defined in `CircleServiceImpl` (see the existing `detail` method).
- The call to `userService.listSummariesByIds(userIds)` assumes `UserService` exposes a method matching `UserMapper.listSummariesByIds` (which `RecentLikersService` uses). If `UserService` does not yet expose this, either:
  - (a) inject `UserMapper` directly into `CircleServiceImpl` and call `userMapper.listSummariesByIds(userIds)`, OR
  - (b) add the method to `UserService` + `UserServiceImpl` as a one-line passthrough.
  - Pick (a) for the minimum diff. Add a private field `private final com.tongji.user.mapper.UserMapper userMapper;` and inject it via the constructor.

If using approach (a), modify the constructor to accept `UserMapper userMapper` and store the field. The constructor currently has 5 params (`circleMapper, memberMapper, userService, knowPostMapper, activityService`); add `userMapper` as the 6th, assign it. Update all callers via field replacement; no other call sites need to change because Spring autowires by type.

After modifying the constructor, replace `userService.listSummariesByIds(userIds)` in the new method with `userMapper.listSummariesByIds(userIds)`.

**Verify:** `mvn compile` must succeed. If `UserMapper.listSummariesByIds` accepts `Collection<Long>` not `List<Long>`, the call still works (List ⊂ Collection).

---

### Task C.5: Add `GET /members` to CircleMemberController

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/circle/api/CircleMemberController.java`

- [ ] **Step 1: Add endpoint**

Append this handler to `CircleMemberController` (place after the existing `@GetMapping("/posts")`):

```java
    @GetMapping("/members")
    public com.tongji.circle.api.dto.CircleMemberListResponse listMembers(
            @PathVariable long circleId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return circleService.listMembers(circleId, page, size);
    }
```

Imports `@GetMapping`, `@PathVariable`, `@RequestParam` are already present via the wildcard import `org.springframework.web.bind.annotation.*`.

**Verify:** `mvn compile` must succeed.

---

### Task C.6: Open the new path to anonymous access

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java`

- [ ] **Step 1: Add permitAll matcher**

The existing matcher `requestMatchers(HttpMethod.GET, "/api/v1/circles", "/api/v1/circles/*").permitAll()` does **not** match `/api/v1/circles/{id}/members` because the single `*` only matches one path segment. Add a separate matcher:

```java
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/circles/*/members").permitAll()
```

Place it next to the existing circles matcher:

```java
                        // 圈子广场（公开圈子可浏览，私密圈详情由服务层校验）
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/circles", "/api/v1/circles/*").permitAll()
                        // 圈子成员列表（公开）
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/v1/circles/*/members").permitAll()
```

**Verify:** `mvn compile` must succeed.

---

### Task C.7: Test for Section C

**Files:**
- Create: `yixiang_be/src/test/java/com/tongji/circle/service/impl/CircleServiceImplListMembersTest.java`

- [ ] **Step 1: Write test**

```java
package com.tongji.circle.service.impl;

import com.tongji.activity.service.ActivityService;
import com.tongji.circle.api.dto.CircleMemberListResponse;
import com.tongji.circle.mapper.CircleMapper;
import com.tongji.circle.mapper.CircleMemberMapper;
import com.tongji.circle.model.Circle;
import com.tongji.circle.model.CircleMember;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import com.tongji.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CircleServiceImplListMembersTest {

    @Mock CircleMapper circleMapper;
    @Mock CircleMemberMapper memberMapper;
    @Mock UserService userService;
    @Mock KnowPostMapper knowPostMapper;
    @Mock ActivityService activityService;
    @Mock UserMapper userMapper; // injected if executor took approach (a)

    @Test
    void listMembers_returnsItemsInRoleOrder_withHasMore() {
        Circle c = new Circle();
        c.setId(1L);
        c.setStatus("ACTIVE");
        when(circleMapper.findById(1L)).thenReturn(c);

        CircleMember owner = member(10L, 1L, "OWNER");
        CircleMember m1 = member(20L, 1L, "MEMBER");
        // listActiveMembers returns size+1 = 3 to flag hasMore=true for size=2
        CircleMember m2 = member(30L, 1L, "MEMBER");
        when(memberMapper.listActiveMembers(eq1L(1L), eqInt(3), eqInt(0)))
                .thenReturn(List.of(owner, m1, m2));
        when(memberMapper.countActive(1L)).thenReturn(3);

        when(userMapper.listSummariesByIds(any()))
                .thenReturn(List.of(user(10L, "alice"), user(20L, "bob"), user(30L, "carol")));

        CircleServiceImpl service = new CircleServiceImpl(
                circleMapper, memberMapper, userService, knowPostMapper, activityService, userMapper);

        CircleMemberListResponse resp = service.listMembers(1L, 1, 2);

        assertThat(resp.items()).hasSize(2);
        assertThat(resp.items().get(0).userId()).isEqualTo(10L); // owner first
        assertThat(resp.hasMore()).isTrue();
        assertThat(resp.total()).isEqualTo(3);
    }

    private static CircleMember member(long uid, long cid, String role) {
        CircleMember m = new CircleMember();
        m.setUserId(uid);
        m.setCircleId(cid);
        m.setRole(role);
        m.setStatus("ACTIVE");
        m.setJoinedAt(Instant.now());
        return m;
    }

    private static User user(long id, String nick) {
        User u = new User();
        u.setId(id);
        u.setNickname(nick);
        u.setAvatar("https://example.com/" + nick + ".png");
        return u;
    }

    // Mockito helper overloads — avoid generic-method-call-target inference issues
    private static long eq1L(long v) { return org.mockito.ArgumentMatchers.eq(v); }
    private static int eqInt(int v) { return org.mockito.ArgumentMatchers.eq(v); }
}
```

**Note on the test constructor:** If the executor chose approach (b) in C.4 (extending `UserService`), the constructor params order in this test must match the impl's constructor. Adjust accordingly.

**Verify:** `mvn test -Dtest=CircleServiceImplListMembersTest`.

If `CircleServiceImplTest` (an existing test class from P1, see commit `a1580c3 fix(be): update CircleServiceImplTest for new ActivityService constructor param`) also references the constructor, **executor must add the new param there too** to keep that suite green. Run `mvn test -Dtest=CircleServiceImplTest` after C.4 to verify.

---

### Section C — Commit

```
git add yixiang_be/src/main/java/com/tongji/circle/ \
        yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java \
        yixiang_be/src/test/java/com/tongji/circle/
git commit -m "feat(be): P1.5 Section C — GET /api/v1/circles/{circleId}/members"
```

---

## Section D: KnowPostDetailResponse — recentLikers + likerSummary

**Goal:** Populate `recentLikers` (top-5 latest likers) and `likerSummary` ("张三、李四 等 12 人觉得很赞") on the post detail endpoint. Mirrors what `FeedItemResponse` already carries on the feed list.

**Design:** Reuse `RecentLikersService.top5(postId)` + `summary(briefs, likeCount)`. Inject `RecentLikersService` into `KnowPostServiceImpl` (or whichever service builds the detail response) and fill the fields. Add the two fields to the DTO record.

---

### Task D.1: Extend KnowPostDetailResponse with new fields

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/api/dto/KnowPostDetailResponse.java`

- [ ] **Step 1: Add fields**

Replace the record declaration so that two new fields appear after `isTop`:

```java
package com.tongji.knowpost.api.dto;

import com.tongji.user.api.dto.UserBrief;

import java.time.Instant;
import java.util.List;

/**
 * 知文详情响应。
 */
public record KnowPostDetailResponse(
        String id,
        String title,
        String description,
        String contentUrl,
        List<String> images,
        List<String> tags,
        String authorId,
        String authorAvatar,
        String authorNickname,
        String authorTagJson,
        Long likeCount,
        Long favoriteCount,
        Long commentCount,
        Boolean liked,
        Boolean faved,
        Boolean isTop,
        String visible,
        String type,
        Instant publishTime,
        List<UserBrief> recentLikers,
        String likerSummary
) {}
```

**Verify:** `mvn compile` will fail until callers update — expected.

---

### Task D.2: Locate the service method that constructs KnowPostDetailResponse

- [ ] **Step 1:** Run `grep -nR "new KnowPostDetailResponse(" yixiang_be/src/main/java` to find the construction site. Expected: exactly one site, in `KnowPostServiceImpl.getDetail(...)` (or a private helper called from it).

If multiple sites exist, fix each.

---

### Task D.3: Inject RecentLikersService into the constructing service and populate

**Files:**
- Modify: whatever class was found in D.2 (likely `com/tongji/knowpost/service/impl/KnowPostServiceImpl.java`)

- [ ] **Step 1: Inject RecentLikersService**

Add a `private final RecentLikersService recentLikersService;` field. Add the param to the constructor and assignment, following the existing constructor-injection pattern. Add import:

```java
import com.tongji.counter.recent.RecentLikersService;
```

- [ ] **Step 2: Populate the two new fields**

At the construction site found in D.2, before instantiating `KnowPostDetailResponse`, compute:

```java
java.util.List<com.tongji.user.api.dto.UserBrief> recentLikers =
        recentLikersService.top5(postId);    // postId variable already in scope
String likerSummary = recentLikersService.summary(recentLikers, likeCount);  // likeCount already in scope
```

Then pass `recentLikers, likerSummary` as the last two arguments to the `new KnowPostDetailResponse(...)` call.

If `likeCount` is computed later in the same method than where `RecentLikersService` would be called, reorder so `likeCount` is available when `summary` is called.

**Verify:** `mvn compile` must succeed.

---

### Task D.4: Test for Section D

**Files:**
- Create or modify: `yixiang_be/src/test/java/com/tongji/knowpost/service/impl/KnowPostServiceImplDetailRecentLikersTest.java`

- [ ] **Step 1: Write a focused test**

Mock `RecentLikersService.top5(...)` and `summary(...)` and verify the returned `KnowPostDetailResponse` carries those values. Use the existing `KnowPostServiceImpl` test as the structural template if one already exists.

If no `KnowPostServiceImpl` test exists in the repo, create a new minimal test that mocks every collaborator. Executor should `find yixiang_be/src/test -name "KnowPostServiceImpl*"` first to decide.

Skeleton:

```java
package com.tongji.knowpost.service.impl;

import com.tongji.counter.recent.RecentLikersService;
import com.tongji.counter.service.CounterService;
import com.tongji.knowpost.api.dto.KnowPostDetailResponse;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.user.api.dto.UserBrief;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KnowPostServiceImplDetailRecentLikersTest {

    @Mock KnowPostMapper mapper;
    @Mock CounterService counterService;
    @Mock RecentLikersService recentLikersService;
    // ... mock all other collaborators that KnowPostServiceImpl needs

    @Test
    void getDetail_populates_recentLikers_and_summary() {
        // Arrange: stub mapper.findDetailById, counterService.getCounts/isLiked/isFaved
        // such that getDetail produces a valid response.

        UserBrief brief = new UserBrief(7L, "tester", "https://a/x.png", false);
        when(recentLikersService.top5(anyLong())).thenReturn(List.of(brief));
        when(recentLikersService.summary(any(), anyLong())).thenReturn("tester 等 5 人觉得很赞");

        // KnowPostServiceImpl service = new KnowPostServiceImpl(... full constructor ...);
        // KnowPostDetailResponse resp = service.getDetail(123L, null);

        // assertThat(resp.recentLikers()).hasSize(1);
        // assertThat(resp.likerSummary()).isEqualTo("tester 等 5 人觉得很赞");
    }
}
```

**Note:** the test is left as a skeleton because `KnowPostServiceImpl`'s constructor and method shape is unknown to this plan author. Executor fleshes out the mocks based on the actual class signature found in D.2. The goal of the test is to prove the two fields end up on the response — nothing more.

**Verify:** `mvn test -Dtest=KnowPostServiceImplDetailRecentLikersTest`.

---

### Section D — Commit

```
git add yixiang_be/src/main/java/com/tongji/knowpost/api/dto/KnowPostDetailResponse.java \
        yixiang_be/src/main/java/com/tongji/knowpost/service/impl/KnowPostServiceImpl.java \
        yixiang_be/src/test/java/com/tongji/knowpost/
git commit -m "feat(be): P1.5 Section D — KnowPostDetailResponse carries recentLikers + likerSummary"
```

---

## Final verification

After all four sections commit:

- [ ] `mvn clean test` — full suite green (expect 0 failures)
- [ ] `mvn clean package -DskipTests` — clean build artifact, no errors
- [ ] Manual sanity (optional, if a running local stack is available):
  - `curl http://localhost:8080/api/v1/profile/<known-user-id>` returns the profile JSON without `Authorization` header
  - `curl 'http://localhost:8080/api/v1/knowposts/liked?userId=<known-user-id>&page=1&size=5'` returns a page (empty list is OK if user has no likes)
  - `curl http://localhost:8080/api/v1/circles/<known-circle-id>/members` returns members
  - `curl http://localhost:8080/api/v1/knowposts/detail/<known-post-id>` returns JSON with `recentLikers` and `likerSummary` fields present (lists may be empty / summary may be `""` for unlikered posts — still must appear in JSON)

---

## Commit policy

- One commit per section. Four commits total.
- Use the exact commit message format above (matches the project's existing `feat(be): SectionX — ...` style).
- Do NOT amend prior commits or rebase. If a test breaks after committing a section, fix-forward with an additional commit.
- Do NOT touch any files outside the list in "File Structure". In particular, leave the `yixiang_fe/` directory and any modified files in the worktree untouched (those are leftover P0/P1-era files irrelevant to P1.5).

---

## What this plan deliberately does NOT do

- Does not add cursor-based pagination to `/api/v1/topics/hot` (deferred — current `limit=20` is sufficient for P2).
- Does not add `verified` / `level` to `CommentDTO` (deferred — frontend will fall back gracefully if absent).
- Does not introduce caching for `/knowposts/liked` (the underlying `activities` query is indexed and cheap; revisit if profiling shows hot user-profile traffic).
- Does not add per-page `recentLikers` to `KnowPostFeedServiceImpl.assembleFromCache` for Section D — that path already populates the field (fix shipped in commit `2baba52`). Section D only addresses the detail endpoint.
- Does not modify migrations — no schema change.

---

## Plan-author notes for the reviewer

- Section A is the smallest (4 tasks, ~30 LOC). Start here.
- Section B is the largest (7 tasks). The trickiest part is **Task B.2** — the executor must transcribe `listFeedPublic`'s SELECT shape into `listFeedByIds` without subtly changing column aliases. If the executor is unsure, they should run `mvn test -Dtest=KnowPostFeedServiceImplLikedTest` (Task B.7); a mismatch will surface as a `KnowPostFeedRow` field being null in test output.
- Section C is medium (7 tasks). The interesting decision is whether to add `listSummariesByIds` to `UserService` or to inject `UserMapper` directly into `CircleServiceImpl`. Plan recommends the latter (smaller diff, follows the pattern `RecentLikersService` already uses). Whichever path the executor picks, the existing `CircleServiceImplTest` (from commit `a1580c3`) must be updated if the constructor changes.
- Section D depends on knowing the exact shape of `KnowPostServiceImpl.getDetail`. The plan deliberately stops short of writing the exact line edit because the construction site is not yet known to the plan author. Executor performs Task D.2 first, then D.3 based on what is found.

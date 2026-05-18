# Phase 3: Circle System (圈子)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the circle (community) system end-to-end: backend `circle` module with CRUD, membership, visibility control, featured-post marking; two frontend pages (CircleSquarePage, CircleDetailPage); and updates to CreatePage so posts can be assigned to a circle.

**Architecture:** New `com.tongji.circle` module following existing layered conventions (api → service → mapper → model). Circles are stored in `circles` + `circle_members` tables. Posts belong to circles via `know_posts.circle_id`. Visibility rules enforced in the service layer. Counter increments (member_count, post_count) use direct SQL atomic updates (no Kafka — low-frequency operations).

**Tech Stack:** Java 21, Spring Boot 3, MyBatis XML, React 18, TypeScript

**Prerequisite:** Phase 0 must be complete (`circles`, `circle_members` tables, `know_posts.circle_id` column exist).

---

## File Structure

**Backend — new module:**
```
circle/
  api/
    CircleController.java
    CircleMemberController.java
    dto/
      CircleCreateRequest.java
      CirclePatchRequest.java
      CircleResponse.java
      CircleDetailResponse.java
      CircleSummaryResponse.java
  mapper/
    CircleMapper.java
    CircleMemberMapper.java
  model/
    Circle.java
    CircleMember.java
  service/
    CircleService.java
    impl/CircleServiceImpl.java
src/main/resources/mapper/CircleMapper.xml
src/main/resources/mapper/CircleMemberMapper.xml
```

**Backend — modified files:**
```
knowpost/api/KnowPostController.java        (accept circleId in patch)
knowpost/api/dto/KnowPostPatchRequest.java  (add circleId field)
knowpost/service/impl/KnowPostServiceImpl.java  (validate circle membership, set circle_id)
knowpost/mapper/KnowPostMapper.java         (add listByCircle query)
src/main/resources/mapper/KnowPostMapper.xml    (add listByCircle SQL)
auth/config/SecurityConfig.java             (whitelist GET circle endpoints)
```

**Frontend — new files:**
```
src/pages/CircleSquarePage.tsx
src/pages/CircleDetailPage.tsx
src/services/circleService.ts
src/types/circle.ts
```

**Frontend — modified files:**
```
src/App.tsx             (add /circles and /circles/:id routes)
src/pages/CreatePage.tsx  (add circle selector)
```

---

### Task 1: Circle Model, Mapper, and XML

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/circle/model/Circle.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/model/CircleMember.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/mapper/CircleMapper.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/mapper/CircleMemberMapper.java`
- Create: `yixiang_be/src/main/resources/mapper/CircleMapper.xml`
- Create: `yixiang_be/src/main/resources/mapper/CircleMemberMapper.xml`

- [ ] **Step 1: Create Circle model**

```java
// com/tongji/circle/model/Circle.java
package com.tongji.circle.model;

import lombok.Data;
import java.time.Instant;

@Data
public class Circle {
    private Long id;
    private String name;
    private String description;
    private String avatarUrl;
    private Long ownerId;
    private String visibility;  // PUBLIC | PRIVATE
    private String status;      // ACTIVE | DISBANDED
    private String category;
    private int memberCount;
    private int postCount;
    private Instant createdAt;
}
```

- [ ] **Step 2: Create CircleMember model**

```java
// com/tongji/circle/model/CircleMember.java
package com.tongji.circle.model;

import lombok.Data;
import java.time.Instant;

@Data
public class CircleMember {
    private Long id;
    private Long circleId;
    private Long userId;
    private String role;    // OWNER | ADMIN | MEMBER
    private String status;  // ACTIVE | PENDING
    private Instant joinedAt;
}
```

- [ ] **Step 3: Create CircleMapper**

```java
// com/tongji/circle/mapper/CircleMapper.java
package com.tongji.circle.mapper;

import com.tongji.circle.model.Circle;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CircleMapper {
    void insert(Circle circle);
    Circle findById(@Param("id") long id);
    int update(Circle circle);
    List<Circle> list(@Param("category") String category,
                      @Param("keyword") String keyword,
                      @Param("offset") int offset,
                      @Param("size") int size);
    int count(@Param("category") String category, @Param("keyword") String keyword);
    List<Circle> listJoined(@Param("userId") long userId);
    int incrementMemberCount(@Param("id") long id, @Param("delta") int delta);
    int incrementPostCount(@Param("id") long id, @Param("delta") int delta);
}
```

- [ ] **Step 4: Create CircleMemberMapper**

```java
// com/tongji/circle/mapper/CircleMemberMapper.java
package com.tongji.circle.mapper;

import com.tongji.circle.model.CircleMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CircleMemberMapper {
    void insert(CircleMember member);
    CircleMember findByCircleAndUser(@Param("circleId") long circleId, @Param("userId") long userId);
    List<CircleMember> listActiveMembers(@Param("circleId") long circleId,
                                         @Param("offset") int offset,
                                         @Param("size") int size);
    int updateStatus(@Param("circleId") long circleId,
                     @Param("userId") long userId,
                     @Param("status") String status);
    int delete(@Param("circleId") long circleId, @Param("userId") long userId);
    int countActive(@Param("circleId") long circleId);
}
```

- [ ] **Step 5: Create CircleMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.circle.mapper.CircleMapper">

    <insert id="insert">
        INSERT INTO circles (id, name, description, avatar_url, owner_id, visibility, status, category, member_count, post_count, created_at)
        VALUES (#{id}, #{name}, #{description}, #{avatarUrl}, #{ownerId}, #{visibility}, #{status}, #{category}, #{memberCount}, #{postCount}, NOW(3))
    </insert>

    <select id="findById" resultType="com.tongji.circle.model.Circle">
        SELECT id, name, description, avatar_url AS avatarUrl, owner_id AS ownerId,
               visibility, status, category, member_count AS memberCount,
               post_count AS postCount, created_at AS createdAt
        FROM circles WHERE id = #{id} AND status = 'ACTIVE'
    </select>

    <update id="update">
        UPDATE circles
        <set>
            <if test="name != null">name = #{name},</if>
            <if test="description != null">description = #{description},</if>
            <if test="avatarUrl != null">avatar_url = #{avatarUrl},</if>
            <if test="category != null">category = #{category},</if>
            <if test="visibility != null">visibility = #{visibility},</if>
        </set>
        WHERE id = #{id}
    </update>

    <select id="list" resultType="com.tongji.circle.model.Circle">
        SELECT id, name, description, avatar_url AS avatarUrl, owner_id AS ownerId,
               visibility, status, category, member_count AS memberCount,
               post_count AS postCount, created_at AS createdAt
        FROM circles
        WHERE status = 'ACTIVE'
        <if test="category != null and category != ''">AND category = #{category}</if>
        <if test="keyword != null and keyword != ''">AND name LIKE CONCAT('%', #{keyword}, '%')</if>
        ORDER BY member_count DESC
        LIMIT #{size} OFFSET #{offset}
    </select>

    <select id="count" resultType="int">
        SELECT COUNT(1) FROM circles
        WHERE status = 'ACTIVE'
        <if test="category != null and category != ''">AND category = #{category}</if>
        <if test="keyword != null and keyword != ''">AND name LIKE CONCAT('%', #{keyword}, '%')</if>
    </select>

    <select id="listJoined" resultType="com.tongji.circle.model.Circle">
        SELECT c.id, c.name, c.description, c.avatar_url AS avatarUrl, c.owner_id AS ownerId,
               c.visibility, c.status, c.category, c.member_count AS memberCount,
               c.post_count AS postCount, c.created_at AS createdAt
        FROM circles c
        JOIN circle_members cm ON cm.circle_id = c.id AND cm.user_id = #{userId} AND cm.status = 'ACTIVE'
        WHERE c.status = 'ACTIVE'
        ORDER BY cm.joined_at DESC
    </select>

    <update id="incrementMemberCount">
        UPDATE circles SET member_count = member_count + #{delta} WHERE id = #{id}
    </update>

    <update id="incrementPostCount">
        UPDATE circles SET post_count = post_count + #{delta} WHERE id = #{id}
    </update>

</mapper>
```

- [ ] **Step 6: Create CircleMemberMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.circle.mapper.CircleMemberMapper">

    <insert id="insert">
        INSERT INTO circle_members (id, circle_id, user_id, role, status, joined_at)
        VALUES (#{id}, #{circleId}, #{userId}, #{role}, #{status}, NOW(3))
        ON DUPLICATE KEY UPDATE status = VALUES(status), joined_at = NOW(3)
    </insert>

    <select id="findByCircleAndUser" resultType="com.tongji.circle.model.CircleMember">
        SELECT id, circle_id AS circleId, user_id AS userId, role, status, joined_at AS joinedAt
        FROM circle_members WHERE circle_id = #{circleId} AND user_id = #{userId}
    </select>

    <select id="listActiveMembers" resultType="com.tongji.circle.model.CircleMember">
        SELECT id, circle_id AS circleId, user_id AS userId, role, status, joined_at AS joinedAt
        FROM circle_members
        WHERE circle_id = #{circleId} AND status = 'ACTIVE'
        ORDER BY role = 'OWNER' DESC, role = 'ADMIN' DESC, joined_at ASC
        LIMIT #{size} OFFSET #{offset}
    </select>

    <update id="updateStatus">
        UPDATE circle_members SET status = #{status}
        WHERE circle_id = #{circleId} AND user_id = #{userId}
    </update>

    <delete id="delete">
        DELETE FROM circle_members WHERE circle_id = #{circleId} AND user_id = #{userId}
    </delete>

    <select id="countActive" resultType="int">
        SELECT COUNT(1) FROM circle_members WHERE circle_id = #{circleId} AND status = 'ACTIVE'
    </select>

</mapper>
```

- [ ] **Step 7: Compile check**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 8: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/circle/
git add yixiang_be/src/main/resources/mapper/CircleMapper.xml
git add yixiang_be/src/main/resources/mapper/CircleMemberMapper.xml
git commit -m "feat: circle model, mapper, and XML"
```

---

### Task 2: CircleService

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/circle/service/CircleService.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/service/impl/CircleServiceImpl.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CircleResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CircleDetailResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CircleSummaryResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CircleCreateRequest.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/dto/CirclePatchRequest.java`

- [ ] **Step 1: Create DTOs**

```java
// com/tongji/circle/api/dto/CircleCreateRequest.java
package com.tongji.circle.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CircleCreateRequest(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 500) String description,
        String avatarUrl,
        String category,
        String visibility  // PUBLIC | PRIVATE, defaults to PUBLIC if null
) {}
```

```java
// com/tongji/circle/api/dto/CirclePatchRequest.java
package com.tongji.circle.api.dto;

import jakarta.validation.constraints.Size;

public record CirclePatchRequest(
        @Size(max = 50) String name,
        @Size(max = 500) String description,
        String avatarUrl,
        String category,
        String visibility
) {}
```

```java
// com/tongji/circle/api/dto/CircleSummaryResponse.java
package com.tongji.circle.api.dto;

public record CircleSummaryResponse(
        long id,
        String name,
        String description,
        String avatarUrl,
        String category,
        String visibility,
        int memberCount,
        int postCount,
        boolean joined   // whether the requesting user has joined
) {}
```

```java
// com/tongji/circle/api/dto/CircleDetailResponse.java
package com.tongji.circle.api.dto;

import java.time.Instant;
import java.util.List;

public record CircleDetailResponse(
        long id,
        String name,
        String description,
        String avatarUrl,
        String category,
        String visibility,
        int memberCount,
        int postCount,
        Instant createdAt,
        boolean joined,
        String myRole,   // OWNER | ADMIN | MEMBER | null
        List<MemberSummary> topMembers
) {
    public record MemberSummary(long userId, String nickname, String avatar, String role) {}
}
```

```java
// com/tongji/circle/api/dto/CircleResponse.java
package com.tongji.circle.api.dto;

import java.util.List;

public record CircleResponse(
        List<CircleSummaryResponse> items,
        int total,
        int page,
        int size
) {}
```

- [ ] **Step 2: Write failing tests**

```java
// src/test/java/com/tongji/circle/service/impl/CircleServiceImplTest.java
package com.tongji.circle.service.impl;

import com.tongji.circle.api.dto.CircleCreateRequest;
import com.tongji.circle.mapper.CircleMapper;
import com.tongji.circle.mapper.CircleMemberMapper;
import com.tongji.circle.model.Circle;
import com.tongji.circle.model.CircleMember;
import com.tongji.common.exception.BusinessException;
import com.tongji.user.service.UserService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CircleServiceImplTest {

    private final CircleMapper circleMapper = mock(CircleMapper.class);
    private final CircleMemberMapper memberMapper = mock(CircleMemberMapper.class);
    private final UserService userService = mock(UserService.class);
    private final CircleServiceImpl service =
            new CircleServiceImpl(circleMapper, memberMapper, userService);

    @Test
    void createCircleInsertsCircleAndOwnerMember() {
        CircleCreateRequest req = new CircleCreateRequest("测试圈子", "简介", null, "投资", null);
        service.create(1L, req);

        verify(circleMapper).insert(argThat(c ->
                "测试圈子".equals(c.getName()) && c.getOwnerId() == 1L && "PUBLIC".equals(c.getVisibility())));
        verify(memberMapper).insert(argThat(m ->
                m.getUserId() == 1L && "OWNER".equals(m.getRole()) && "ACTIVE".equals(m.getStatus())));
    }

    @Test
    void joinPublicCircleAutoApproves() {
        Circle circle = new Circle();
        circle.setId(10L);
        circle.setVisibility("PUBLIC");
        when(circleMapper.findById(10L)).thenReturn(circle);
        when(memberMapper.findByCircleAndUser(10L, 2L)).thenReturn(null);

        service.join(2L, 10L, null);

        verify(memberMapper).insert(argThat(m -> "ACTIVE".equals(m.getStatus())));
        verify(circleMapper).incrementMemberCount(10L, 1);
    }

    @Test
    void joinPrivateCircleCreatesPendingMember() {
        Circle circle = new Circle();
        circle.setId(10L);
        circle.setVisibility("PRIVATE");
        when(circleMapper.findById(10L)).thenReturn(circle);
        when(memberMapper.findByCircleAndUser(10L, 2L)).thenReturn(null);

        service.join(2L, 10L, "申请加入");

        verify(memberMapper).insert(argThat(m -> "PENDING".equals(m.getStatus())));
        verify(circleMapper, never()).incrementMemberCount(anyLong(), anyInt());
    }

    @Test
    void joinThrowsIfAlreadyActiveMember() {
        Circle circle = new Circle();
        circle.setId(10L);
        circle.setVisibility("PUBLIC");
        when(circleMapper.findById(10L)).thenReturn(circle);
        CircleMember existing = new CircleMember();
        existing.setStatus("ACTIVE");
        when(memberMapper.findByCircleAndUser(10L, 2L)).thenReturn(existing);

        assertThatThrownBy(() -> service.join(2L, 10L, null))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void approveChangesPendingToActive() {
        Circle circle = new Circle();
        circle.setId(10L);
        circle.setOwnerId(1L);
        when(circleMapper.findById(10L)).thenReturn(circle);
        CircleMember pending = new CircleMember();
        pending.setStatus("PENDING");
        when(memberMapper.findByCircleAndUser(10L, 3L)).thenReturn(pending);

        service.approveMember(1L, 10L, 3L);

        verify(memberMapper).updateStatus(10L, 3L, "ACTIVE");
        verify(circleMapper).incrementMemberCount(10L, 1);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd yixiang_be && mvn test -Dtest=CircleServiceImplTest -q 2>&1 | tail -5
```

Expected: FAIL — `CircleServiceImpl` doesn't exist.

- [ ] **Step 4: Create CircleService interface**

```java
// com/tongji/circle/service/CircleService.java
package com.tongji.circle.service;

import com.tongji.circle.api.dto.*;
import com.tongji.circle.model.Circle;

import java.util.List;

public interface CircleService {
    long create(long userId, CircleCreateRequest request);
    CircleDetailResponse detail(long circleId, Long viewerId);
    CircleResponse list(String category, String keyword, int page, int size, Long viewerId);
    void update(long userId, long circleId, CirclePatchRequest request);
    void join(long userId, long circleId, String applyReason);
    void leave(long userId, long circleId);
    void approveMember(long operatorId, long circleId, long targetUserId);
    void featurePost(long operatorId, long circleId, long postId, boolean featured);
    List<CircleSummaryResponse> joined(long userId);
    boolean isMember(long userId, long circleId);
}
```

- [ ] **Step 5: Implement CircleServiceImpl**

```java
// com/tongji/circle/service/impl/CircleServiceImpl.java
package com.tongji.circle.service.impl;

import com.tongji.circle.api.dto.*;
import com.tongji.circle.mapper.CircleMapper;
import com.tongji.circle.mapper.CircleMemberMapper;
import com.tongji.circle.model.Circle;
import com.tongji.circle.model.CircleMember;
import com.tongji.circle.service.CircleService;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.user.domain.User;
import com.tongji.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class CircleServiceImpl implements CircleService {

    private final CircleMapper circleMapper;
    private final CircleMemberMapper memberMapper;
    private final UserService userService;

    public CircleServiceImpl(CircleMapper circleMapper,
                             CircleMemberMapper memberMapper,
                             UserService userService) {
        this.circleMapper = circleMapper;
        this.memberMapper = memberMapper;
        this.userService = userService;
    }

    @Override
    @Transactional
    public long create(long userId, CircleCreateRequest req) {
        Circle circle = new Circle();
        circle.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        circle.setName(req.name());
        circle.setDescription(req.description());
        circle.setAvatarUrl(req.avatarUrl());
        circle.setCategory(req.category());
        circle.setVisibility(req.visibility() != null ? req.visibility().toUpperCase() : "PUBLIC");
        circle.setStatus("ACTIVE");
        circle.setOwnerId(userId);
        circle.setMemberCount(1);
        circle.setPostCount(0);
        circleMapper.insert(circle);

        CircleMember owner = new CircleMember();
        owner.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        owner.setCircleId(circle.getId());
        owner.setUserId(userId);
        owner.setRole("OWNER");
        owner.setStatus("ACTIVE");
        memberMapper.insert(owner);

        return circle.getId();
    }

    @Override
    public CircleDetailResponse detail(long circleId, Long viewerId) {
        Circle circle = requireCircle(circleId);
        boolean joined = viewerId != null && isMember(viewerId, circleId);

        if ("PRIVATE".equals(circle.getVisibility()) && !joined) {
            throw new BusinessException(ErrorCode.NOT_CIRCLE_MEMBER);
        }

        String myRole = null;
        if (viewerId != null) {
            CircleMember m = memberMapper.findByCircleAndUser(circleId, viewerId);
            if (m != null && "ACTIVE".equals(m.getStatus())) myRole = m.getRole();
        }

        List<CircleMember> topMembersRaw = memberMapper.listActiveMembers(circleId, 0, 6);
        List<CircleDetailResponse.MemberSummary> topMembers = topMembersRaw.stream().map(m -> {
            User u = userService.findById(m.getUserId()).orElse(null);
            return new CircleDetailResponse.MemberSummary(
                    m.getUserId(),
                    u != null ? u.getNickname() : "用户" + m.getUserId(),
                    u != null ? u.getAvatar() : null,
                    m.getRole()
            );
        }).toList();

        return new CircleDetailResponse(
                circle.getId(), circle.getName(), circle.getDescription(),
                circle.getAvatarUrl(), circle.getCategory(), circle.getVisibility(),
                circle.getMemberCount(), circle.getPostCount(), circle.getCreatedAt(),
                joined, myRole, topMembers
        );
    }

    @Override
    public CircleResponse list(String category, String keyword, int page, int size, Long viewerId) {
        int offset = page * size;
        List<Circle> circles = circleMapper.list(
                (category != null && !category.isBlank()) ? category : null,
                (keyword != null && !keyword.isBlank()) ? keyword : null,
                offset, size);
        int total = circleMapper.count(
                (category != null && !category.isBlank()) ? category : null,
                (keyword != null && !keyword.isBlank()) ? keyword : null);

        List<CircleSummaryResponse> items = circles.stream().map(c -> {
            boolean joined = viewerId != null && isMember(viewerId, c.getId());
            return toSummary(c, joined);
        }).toList();

        return new CircleResponse(items, total, page, size);
    }

    @Override
    @Transactional
    public void update(long userId, long circleId, CirclePatchRequest req) {
        Circle circle = requireCircle(circleId);
        requireOwnerOrAdmin(userId, circleId);
        if (req.name() != null) circle.setName(req.name());
        if (req.description() != null) circle.setDescription(req.description());
        if (req.avatarUrl() != null) circle.setAvatarUrl(req.avatarUrl());
        if (req.category() != null) circle.setCategory(req.category());
        if (req.visibility() != null) circle.setVisibility(req.visibility().toUpperCase());
        circleMapper.update(circle);
    }

    @Override
    @Transactional
    public void join(long userId, long circleId, String applyReason) {
        Circle circle = requireCircle(circleId);
        CircleMember existing = memberMapper.findByCircleAndUser(circleId, userId);
        if (existing != null && "ACTIVE".equals(existing.getStatus())) {
            throw new BusinessException(ErrorCode.ALREADY_CIRCLE_MEMBER);
        }

        CircleMember member = new CircleMember();
        member.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        member.setCircleId(circleId);
        member.setUserId(userId);
        member.setRole("MEMBER");

        if ("PUBLIC".equals(circle.getVisibility())) {
            member.setStatus("ACTIVE");
            memberMapper.insert(member);
            circleMapper.incrementMemberCount(circleId, 1);
        } else {
            member.setStatus("PENDING");
            memberMapper.insert(member);
        }
    }

    @Override
    @Transactional
    public void leave(long userId, long circleId) {
        Circle circle = requireCircle(circleId);
        if (circle.getOwnerId() != null && circle.getOwnerId() == userId) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        CircleMember member = memberMapper.findByCircleAndUser(circleId, userId);
        if (member == null || !"ACTIVE".equals(member.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_CIRCLE_MEMBER);
        }
        memberMapper.delete(circleId, userId);
        circleMapper.incrementMemberCount(circleId, -1);
    }

    @Override
    @Transactional
    public void approveMember(long operatorId, long circleId, long targetUserId) {
        requireOwnerOrAdmin(operatorId, circleId);
        CircleMember member = memberMapper.findByCircleAndUser(circleId, targetUserId);
        if (member == null || !"PENDING".equals(member.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        memberMapper.updateStatus(circleId, targetUserId, "ACTIVE");
        circleMapper.incrementMemberCount(circleId, 1);
    }

    @Override
    public void featurePost(long operatorId, long circleId, long postId, boolean featured) {
        requireOwnerOrAdmin(operatorId, circleId);
        // Delegate to KnowPostMapper — see Task 4
        // knowPostMapper.setFeatured(postId, circleId, featured ? 1 : 0);
        throw new UnsupportedOperationException("Implemented in Task 4");
    }

    @Override
    public List<CircleSummaryResponse> joined(long userId) {
        return circleMapper.listJoined(userId).stream()
                .map(c -> toSummary(c, true))
                .toList();
    }

    @Override
    public boolean isMember(long userId, long circleId) {
        CircleMember m = memberMapper.findByCircleAndUser(circleId, userId);
        return m != null && "ACTIVE".equals(m.getStatus());
    }

    // -- helpers --

    private Circle requireCircle(long circleId) {
        Circle circle = circleMapper.findById(circleId);
        if (circle == null) throw new BusinessException(ErrorCode.CIRCLE_NOT_FOUND);
        return circle;
    }

    private void requireOwnerOrAdmin(long userId, long circleId) {
        CircleMember m = memberMapper.findByCircleAndUser(circleId, userId);
        if (m == null || !"ACTIVE".equals(m.getStatus()) ||
                (!"OWNER".equals(m.getRole()) && !"ADMIN".equals(m.getRole()))) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private CircleSummaryResponse toSummary(Circle c, boolean joined) {
        return new CircleSummaryResponse(c.getId(), c.getName(), c.getDescription(),
                c.getAvatarUrl(), c.getCategory(), c.getVisibility(),
                c.getMemberCount(), c.getPostCount(), joined);
    }
}
```

- [ ] **Step 6: Run tests**

```bash
cd yixiang_be && mvn test -Dtest=CircleServiceImplTest
```

Expected: BUILD SUCCESS, 5 tests passed.

- [ ] **Step 7: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/circle/service/
git add yixiang_be/src/main/java/com/tongji/circle/api/dto/
git add yixiang_be/src/test/java/com/tongji/circle/
git commit -m "feat: circle service with create/join/leave/approve logic"
```

---

### Task 3: Circle REST Controllers

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/CircleController.java`
- Create: `yixiang_be/src/main/java/com/tongji/circle/api/CircleMemberController.java`
- Modify: `yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java`

- [ ] **Step 1: Create CircleController**

```java
// com/tongji/circle/api/CircleController.java
package com.tongji.circle.api;

import com.tongji.auth.token.JwtService;
import com.tongji.circle.api.dto.*;
import com.tongji.circle.service.CircleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/circles")
public class CircleController {

    private final CircleService circleService;
    private final JwtService jwtService;

    public CircleController(CircleService circleService, JwtService jwtService) {
        this.circleService = circleService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public CircleResponse list(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        Long uid = jwt != null ? jwtService.extractUserId(jwt) : null;
        return circleService.list(category, keyword, page, Math.min(size, 50), uid);
    }

    @PostMapping
    public Map<String, Long> create(@Valid @RequestBody CircleCreateRequest request,
                                    @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        long id = circleService.create(uid, request);
        return Map.of("id", id);
    }

    @GetMapping("/{id}")
    public CircleDetailResponse detail(@PathVariable long id,
                                       @AuthenticationPrincipal Jwt jwt) {
        Long uid = jwt != null ? jwtService.extractUserId(jwt) : null;
        return circleService.detail(id, uid);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable long id,
                                       @Valid @RequestBody CirclePatchRequest request,
                                       @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.update(uid, id, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/joined")
    public List<CircleSummaryResponse> joined(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return circleService.joined(uid);
    }
}
```

- [ ] **Step 2: Create CircleMemberController**

```java
// com/tongji/circle/api/CircleMemberController.java
package com.tongji.circle.api;

import com.tongji.auth.token.JwtService;
import com.tongji.circle.service.CircleService;
import com.tongji.knowpost.mapper.KnowPostMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/circles/{circleId}")
public class CircleMemberController {

    private final CircleService circleService;
    private final JwtService jwtService;
    private final KnowPostMapper knowPostMapper;

    public CircleMemberController(CircleService circleService,
                                  JwtService jwtService,
                                  KnowPostMapper knowPostMapper) {
        this.circleService = circleService;
        this.jwtService = jwtService;
        this.knowPostMapper = knowPostMapper;
    }

    @PostMapping("/join")
    public ResponseEntity<Void> join(@PathVariable long circleId,
                                     @RequestParam(value = "reason", required = false) String reason,
                                     @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.join(uid, circleId, reason);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/members/me")
    public ResponseEntity<Void> leave(@PathVariable long circleId,
                                      @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.leave(uid, circleId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/members/{userId}/approve")
    public ResponseEntity<Void> approve(@PathVariable long circleId,
                                        @PathVariable long userId,
                                        @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.approveMember(uid, circleId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/posts/{postId}/feature")
    public ResponseEntity<Void> feature(@PathVariable long circleId,
                                        @PathVariable long postId,
                                        @RequestParam(value = "featured", defaultValue = "true") boolean featured,
                                        @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.featurePost(uid, circleId, postId, featured);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/posts")
    public Object posts(@PathVariable long circleId,
                        @RequestParam(value = "featured", defaultValue = "false") boolean featured,
                        @RequestParam(value = "cursor", required = false) String cursor,
                        @RequestParam(value = "size", defaultValue = "20") int size,
                        @AuthenticationPrincipal Jwt jwt) {
        Long uid = jwt != null ? jwtService.extractUserId(jwt) : null;
        // Visibility enforced inside service — private circles reject non-members
        if (!circleService.isMember(uid != null ? uid : -1L, circleId)) {
            var circle = circleService.detail(circleId, uid); // throws if private + not member
        }
        return knowPostMapper.listByCircle(circleId, featured ? 1 : null, cursor, Math.min(size, 50));
    }
}
```

- [ ] **Step 3: Whitelist GET circle endpoints in SecurityConfig**

In `SecurityConfig.java` in the `requestMatchers` public endpoint section, add:

```java
.requestMatchers(HttpMethod.GET, "/api/v1/circles", "/api/v1/circles/*").permitAll()
```

All other circle endpoints (POST, PUT, DELETE, /join, /members) remain authenticated by default.

- [ ] **Step 4: Compile check**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 5: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/circle/api/
git add yixiang_be/src/main/java/com/tongji/auth/config/SecurityConfig.java
git commit -m "feat: circle REST controllers and security whitelist"
```

---

### Task 4: Integrate Circles with KnowPost

Circles are only useful when posts can belong to them. This task wires `circle_id` and `is_featured` into the knowpost layer.

**Files:**
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/mapper/KnowPostMapper.java`
- Modify: `yixiang_be/src/main/resources/mapper/KnowPostMapper.xml`
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/model/KnowPost.java`
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/api/dto/KnowPostPatchRequest.java`
- Modify: `yixiang_be/src/main/java/com/tongji/knowpost/service/impl/KnowPostServiceImpl.java`
- Modify: `yixiang_be/src/main/java/com/tongji/circle/service/impl/CircleServiceImpl.java` (complete featurePost)
- Modify: `yixiang_be/src/main/java/com/tongji/circle/api/CircleMemberController.java` (inject CircleService for posts)

- [ ] **Step 1: Add fields to KnowPost model**

In `KnowPost.java`, add two fields after `creatorId`:

```java
private Long circleId;
private Boolean isFeatured;
```

- [ ] **Step 2: Add circleId to KnowPostPatchRequest**

In `KnowPostPatchRequest.java`, add:

```java
Long circleId()
```

to the record components. (If it's a record, add `Long circleId` to the record declaration; if it's a class, add field + getter.)

- [ ] **Step 3: Add mapper methods**

In `KnowPostMapper.java`, add:

```java
List<Map<String, Object>> listByCircle(@Param("circleId") long circleId,
                                        @Param("isFeatured") Integer isFeatured,
                                        @Param("cursor") String cursor,
                                        @Param("size") int size);

int setFeatured(@Param("postId") long postId,
                @Param("circleId") long circleId,
                @Param("isFeatured") int isFeatured);

KnowPost findById(@Param("id") long id);
```

`findById` may already exist — check first; only add if missing.

- [ ] **Step 4: Add XML for listByCircle and setFeatured**

In `KnowPostMapper.xml`, add:

```xml
<select id="listByCircle" resultType="map">
    SELECT id, title, description, img_urls AS imgUrls, creator_id AS creatorId,
           create_time AS createTime, tags, is_featured AS isFeatured, circle_id AS circleId
    FROM know_posts
    WHERE circle_id = #{circleId} AND status = 'published'
    <if test="isFeatured != null">AND is_featured = #{isFeatured}</if>
    <if test="cursor != null">AND id &lt; #{cursor}</if>
    ORDER BY create_time DESC, id DESC
    LIMIT #{size}
</select>

<update id="setFeatured">
    UPDATE know_posts SET is_featured = #{isFeatured}
    WHERE id = #{postId} AND circle_id = #{circleId}
</update>
```

- [ ] **Step 5: Complete featurePost in CircleServiceImpl**

Replace the `throw new UnsupportedOperationException(...)` in `featurePost()` with:

```java
@Override
public void featurePost(long operatorId, long circleId, long postId, boolean featured) {
    requireOwnerOrAdmin(operatorId, circleId);
    knowPostMapper.setFeatured(postId, circleId, featured ? 1 : 0);
}
```

Add `KnowPostMapper knowPostMapper` field and constructor parameter to `CircleServiceImpl`.

- [ ] **Step 6: Wire circleId in KnowPostServiceImpl.updateMetadata()**

In `KnowPostServiceImpl`, when `updateMetadata()` is called with a non-null `circleId`, validate the user is an active member before setting it:

After extracting `circleId` from the request, add:

```java
if (circleId != null) {
    CircleMember membership = circleMemberMapper.findByCircleAndUser(circleId, userId);
    if (membership == null || !"ACTIVE".equals(membership.getStatus())) {
        throw new BusinessException(ErrorCode.NOT_CIRCLE_MEMBER);
    }
}
```

Inject `CircleMemberMapper circleMemberMapper` into `KnowPostServiceImpl` constructor. Also update the mapper call to include `circle_id` in the UPDATE SQL.

- [ ] **Step 7: Compile check**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 8: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/knowpost/
git add yixiang_be/src/main/java/com/tongji/circle/
git add yixiang_be/src/main/resources/mapper/KnowPostMapper.xml
git commit -m "feat: wire circle_id and is_featured into knowpost layer"
```

---

### Task 5: Frontend — Types and Service

**Files:**
- Create: `yixiang_fe/src/types/circle.ts`
- Create: `yixiang_fe/src/services/circleService.ts`

- [ ] **Step 1: Create types**

```typescript
// src/types/circle.ts
export interface CircleSummary {
  id: number;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  category: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  postCount: number;
  joined: boolean;
}

export interface MemberSummary {
  userId: number;
  nickname: string;
  avatar: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface CircleDetail extends CircleSummary {
  createdAt: string;
  myRole: 'OWNER' | 'ADMIN' | 'MEMBER' | null;
  topMembers: MemberSummary[];
}

export interface CircleListResponse {
  items: CircleSummary[];
  total: number;
  page: number;
  size: number;
}
```

- [ ] **Step 2: Create service**

```typescript
// src/services/circleService.ts
import { apiFetch } from './apiClient';
import type { CircleDetail, CircleListResponse, CircleSummary } from '@/types/circle';

const BASE = '/api/v1/circles';

export const circleService = {
  list: (params: { category?: string; keyword?: string; page?: number; size?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.page != null) q.set('page', String(params.page));
    if (params.size) q.set('size', String(params.size));
    return apiFetch<CircleListResponse>(`${BASE}?${q.toString()}`);
  },

  detail: (id: number) => apiFetch<CircleDetail>(`${BASE}/${id}`),

  create: (body: { name: string; description?: string; avatarUrl?: string; category?: string; visibility?: string }) =>
    apiFetch<{ id: number }>(`${BASE}`, { method: 'POST', body }),

  join: (id: number, reason?: string) => {
    const q = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return apiFetch<void>(`${BASE}/${id}/join${q}`, { method: 'POST' });
  },

  leave: (id: number) => apiFetch<void>(`${BASE}/${id}/members/me`, { method: 'DELETE' }),

  joined: () => apiFetch<CircleSummary[]>(`${BASE}/joined`),

  posts: (id: number, featured = false, cursor?: string, size = 20) => {
    const q = new URLSearchParams({ featured: String(featured), size: String(size) });
    if (cursor) q.set('cursor', cursor);
    return apiFetch<any[]>(`${BASE}/${id}/posts?${q.toString()}`);
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add yixiang_fe/src/types/circle.ts yixiang_fe/src/services/circleService.ts
git commit -m "feat: circle types and service"
```

---

### Task 6: Frontend — CircleSquarePage

**Files:**
- Create: `yixiang_fe/src/pages/CircleSquarePage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/CircleSquarePage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { circleService } from '@/services/circleService';
import type { CircleSummary } from '@/types/circle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CATEGORIES = ['全部', '投资', '科技', '价值', '宏观', '行业'];

export default function CircleSquarePage() {
  const { tokens } = useAuth();
  const [category, setCategory] = useState('');
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    circleService.list({ category: category || undefined, size: 30 })
      .then(res => setCircles(res.items))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (!tokens) return;
    circleService.joined().then(list => setJoinedIds(new Set(list.map(c => c.id))));
  }, [tokens]);

  const handleJoin = async (id: number) => {
    if (!tokens) { toast.error('请先登录'); return; }
    try {
      await circleService.join(id);
      setJoinedIds(prev => new Set([...prev, id]));
      setCircles(prev => prev.map(c => c.id === id ? { ...c, memberCount: c.memberCount + 1, joined: true } : c));
      toast.success('加入成功');
    } catch {
      toast.error('加入失败，请重试');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold mb-4">圈子广场</h1>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat === '全部' ? '' : cat)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              (cat === '全部' ? '' : cat) === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Circle cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {circles.map(circle => (
          <div key={circle.id} className="border rounded-xl p-4 flex gap-3">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={circle.avatarUrl ?? undefined} />
              <AvatarFallback>{circle.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link to={`/circles/${circle.id}`} className="font-medium hover:underline truncate">
                  {circle.name}
                </Link>
                {circle.visibility === 'PRIVATE' && <Badge variant="outline" className="text-xs">私密</Badge>}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{circle.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{circle.memberCount} 成员</span>
                {joinedIds.has(circle.id) ? (
                  <Button variant="outline" size="sm" disabled>已加入</Button>
                ) : (
                  <Button size="sm" onClick={() => handleJoin(circle.id)}>加入</Button>
                )}
              </div>
            </div>
          </div>
        ))}
        {circles.length === 0 && !loading && (
          <p className="col-span-2 text-center text-muted-foreground py-12">暂无圈子</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add yixiang_fe/src/pages/CircleSquarePage.tsx
git commit -m "feat: circle square page with category filter and join"
```

---

### Task 7: Frontend — CircleDetailPage

**Files:**
- Create: `yixiang_fe/src/pages/CircleDetailPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/CircleDetailPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { circleService } from '@/services/circleService';
import type { CircleDetail } from '@/types/circle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import PostCard from '@/components/post/PostCard';
import { toast } from 'sonner';

export default function CircleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const circleId = Number(id);
  const { tokens } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<CircleDetail | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      circleService.detail(circleId),
      circleService.posts(circleId, false),
      circleService.posts(circleId, true),
    ])
      .then(([d, p, fp]) => {
        setDetail(d);
        setPosts(p);
        setFeaturedPosts(fp);
      })
      .catch(() => navigate('/circles'))
      .finally(() => setLoading(false));
  }, [circleId]);

  const handleJoin = async () => {
    if (!tokens) { toast.error('请先登录'); return; }
    if (!detail) return;
    if (detail.visibility === 'PRIVATE') {
      const reason = window.prompt('请输入申请理由（可选）') ?? undefined;
      await circleService.join(circleId, reason);
      toast.success('申请已提交，等待圈主审核');
    } else {
      await circleService.join(circleId);
      setDetail(d => d ? { ...d, joined: true, memberCount: d.memberCount + 1 } : d);
      toast.success('加入成功');
    }
  };

  if (loading || !detail) {
    return <div className="flex justify-center py-20 text-muted-foreground">加载中…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex gap-4 mb-6">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={detail.avatarUrl ?? undefined} />
          <AvatarFallback>{detail.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{detail.name}</h1>
            {detail.visibility === 'PRIVATE' && <Badge variant="outline">私密圈</Badge>}
            {detail.category && <Badge variant="secondary">{detail.category}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{detail.description}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{detail.memberCount} 成员</span>
            <span>{detail.postCount} 帖子</span>
          </div>
        </div>
        <div className="shrink-0">
          {detail.joined ? (
            <Button variant="outline" disabled>已加入</Button>
          ) : (
            <Button onClick={handleJoin}>加入圈子</Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="posts">帖子</TabsTrigger>
          <TabsTrigger value="featured">精华</TabsTrigger>
          <TabsTrigger value="members">成员</TabsTrigger>
          <TabsTrigger value="about">关于</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <div className="space-y-3">
            {posts.map((p: any) => <PostCard key={p.id} post={p} />)}
            {posts.length === 0 && <p className="text-center text-muted-foreground py-8">暂无帖子</p>}
          </div>
        </TabsContent>

        <TabsContent value="featured">
          <div className="space-y-3">
            {featuredPosts.map((p: any) => <PostCard key={p.id} post={p} />)}
            {featuredPosts.length === 0 && <p className="text-center text-muted-foreground py-8">暂无精华帖子</p>}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {detail.topMembers.map(m => (
              <div key={m.userId} className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={m.avatar ?? undefined} />
                  <AvatarFallback>{m.nickname[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{m.nickname}</p>
                  {m.role !== 'MEMBER' && (
                    <Badge variant="outline" className="text-xs">{m.role === 'OWNER' ? '圈主' : '管理员'}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="about">
          <div className="space-y-3 text-sm">
            <div><span className="text-muted-foreground">简介：</span>{detail.description || '暂无简介'}</div>
            <div><span className="text-muted-foreground">类别：</span>{detail.category || '未分类'}</div>
            <div><span className="text-muted-foreground">创建时间：</span>{new Date(detail.createdAt).toLocaleDateString('zh-CN')}</div>
            <div><span className="text-muted-foreground">隐私：</span>{detail.visibility === 'PUBLIC' ? '公开圈子' : '私密圈子'}</div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add yixiang_fe/src/pages/CircleDetailPage.tsx
git commit -m "feat: circle detail page with posts/featured/members/about tabs"
```

---

### Task 8: Routes, CreatePage Update, and Final Wiring

**Files:**
- Modify: `yixiang_fe/src/App.tsx`
- Modify: `yixiang_fe/src/pages/CreatePage.tsx`

- [ ] **Step 1: Add routes in App.tsx**

```tsx
import CircleSquarePage from "@/pages/CircleSquarePage";
import CircleDetailPage from "@/pages/CircleDetailPage";
// Inside <Route element={<Layout />}>:
<Route path="circles" element={<CircleSquarePage />} />
<Route path="circles/:id" element={<CircleDetailPage />} />
```

- [ ] **Step 2: Add circle selector to CreatePage**

In `CreatePage.tsx`, after the existing form fields (title, content, tags), add a section for selecting a circle. This requires loading the user's joined circles:

```tsx
// At the top of CreatePage component, add:
const { tokens } = useAuth();
const [joinedCircles, setJoinedCircles] = useState<CircleSummary[]>([]);
const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);

useEffect(() => {
  if (tokens) {
    circleService.joined().then(setJoinedCircles).catch(() => {});
  }
}, [tokens]);
```

Add in the form JSX, below the tags input:

```tsx
{joinedCircles.length > 0 && (
  <div>
    <label className="text-sm font-medium">发布到圈子（可选）</label>
    <select
      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      value={selectedCircleId ?? ''}
      onChange={e => setSelectedCircleId(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">公开发布</option>
      {joinedCircles.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  </div>
)}
```

When submitting the patch request, include `circleId: selectedCircleId` in the patch body sent to `PATCH /api/v1/knowposts/{id}`.

- [ ] **Step 3: Type check**

```bash
cd yixiang_fe && npm run lint
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add yixiang_fe/src/App.tsx yixiang_fe/src/pages/CreatePage.tsx
git commit -m "feat: add circle routes and circle selector in create page"
```

---

### Task 9: Full Backend Compile and Test Run

- [ ] **Step 1: Run all tests**

```bash
cd yixiang_be && mvn test
```

Expected: All tests pass (including the new `CircleServiceImplTest`, `FavoriteServiceImplTest`, `NotificationServiceImplTest`, `CommentEventProducerTest`). Fix any failures before proceeding.

- [ ] **Step 2: Build the full jar**

```bash
cd yixiang_be && mvn clean package -DskipTests -q
```

Expected: BUILD SUCCESS, jar produced in `target/`.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete circle system backend and frontend"
```

# Phase 2: Collections Page (我的收藏)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist user favorites to a `user_favorites` table so they can be listed by page, and build a `CollectionsPage` frontend showing the user's favorited posts.

**Architecture:** The `ActionController` already handles fav/unfav via `CounterService`. We add a `FavoriteService` that is called from `ActionController` to write/delete rows in `user_favorites`. A new GET endpoint returns paginated favorited posts using the existing `FeedItemResponse` DTO. The frontend page reuses `PostCard`.

**Tech Stack:** Java 21, Spring Boot 3, MyBatis XML, React 18, TypeScript

**Prerequisite:** Phase 0 must be complete (`user_favorites` table exists).

---

## File Structure

**Backend — new files:**
```
counter/
  favorite/
    FavoriteService.java
    impl/FavoriteServiceImpl.java
    FavoriteMapper.java
    FavoriteController.java
src/main/resources/mapper/FavoriteMapper.xml
```

**Backend — modified files:**
```
counter/api/ActionController.java   (call FavoriteService on fav/unfav)
```

**Frontend — new files:**
```
src/pages/CollectionsPage.tsx
src/services/favoriteService.ts
```

**Frontend — modified files:**
```
src/App.tsx   (add /collections route)
```

---

### Task 1: FavoriteMapper and XML

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/counter/favorite/FavoriteMapper.java`
- Create: `yixiang_be/src/main/resources/mapper/FavoriteMapper.xml`

- [ ] **Step 1: Create FavoriteMapper**

```java
// com/tongji/counter/favorite/FavoriteMapper.java
package com.tongji.counter.favorite;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FavoriteMapper {
    void insert(@Param("id") long id,
                @Param("userId") long userId,
                @Param("postId") long postId);

    void delete(@Param("userId") long userId,
                @Param("postId") long postId);

    List<Long> listPostIds(@Param("userId") long userId,
                           @Param("lastId") Long lastId,
                           @Param("size") int size);
}
```

- [ ] **Step 2: Create FavoriteMapper.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.tongji.counter.favorite.FavoriteMapper">

    <insert id="insert">
        INSERT IGNORE INTO user_favorites (id, user_id, post_id, created_at)
        VALUES (#{id}, #{userId}, #{postId}, NOW(3))
    </insert>

    <delete id="delete">
        DELETE FROM user_favorites WHERE user_id = #{userId} AND post_id = #{postId}
    </delete>

    <select id="listPostIds" resultType="long">
        SELECT post_id FROM user_favorites
        WHERE user_id = #{userId}
        <if test="lastId != null">AND id &lt; #{lastId}</if>
        ORDER BY id DESC
        LIMIT #{size}
    </select>

</mapper>
```

- [ ] **Step 3: Compile check**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/counter/favorite/FavoriteMapper.java
git add yixiang_be/src/main/resources/mapper/FavoriteMapper.xml
git commit -m "feat: add FavoriteMapper for user_favorites table"
```

---

### Task 2: FavoriteService

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/counter/favorite/FavoritesResponse.java`
- Create: `yixiang_be/src/main/java/com/tongji/counter/favorite/FavoriteService.java`
- Create: `yixiang_be/src/main/java/com/tongji/counter/favorite/impl/FavoriteServiceImpl.java`

- [ ] **Step 1: Create FavoritesResponse DTO**

`FeedPageResponse` uses `(items, page, size, hasMore)` which doesn't suit cursor-based favorites. Use a dedicated response:

```java
// com/tongji/counter/favorite/FavoritesResponse.java
package com.tongji.counter.favorite;

import com.tongji.knowpost.api.dto.FeedItemResponse;
import java.util.List;

public record FavoritesResponse(
        List<FeedItemResponse> items,
        Long nextCursor,
        boolean hasMore
) {}
```

- [ ] **Step 2: Write failing test**

```java
// src/test/java/com/tongji/counter/favorite/impl/FavoriteServiceImplTest.java
package com.tongji.counter.favorite.impl;

import com.tongji.counter.favorite.FavoriteMapper;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FavoriteServiceImplTest {

    private final FavoriteMapper mapper = mock(FavoriteMapper.class);
    private final KnowPostMapper knowPostMapper = mock(KnowPostMapper.class);
    private final FavoriteServiceImpl service = new FavoriteServiceImpl(mapper, knowPostMapper);

    @Test
    void addInsertsRow() {
        service.add(1L, 100L);
        verify(mapper).insert(anyLong(), eq(1L), eq(100L));
    }

    @Test
    void removeDeletesRow() {
        service.remove(1L, 100L);
        verify(mapper).delete(1L, 100L);
    }

    @Test
    void listReturnsEmptyWhenNoFavorites() {
        when(mapper.listPostIds(anyLong(), any(), anyInt())).thenReturn(List.of());
        var result = service.list(1L, null, 20);
        assertThat(result.items()).isEmpty();
        assertThat(result.hasMore()).isFalse();
        assertThat(result.nextCursor()).isNull();
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd yixiang_be && mvn test -Dtest=FavoriteServiceImplTest -q 2>&1 | tail -5
```

Expected: FAIL — `FavoriteServiceImpl` doesn't exist yet.

- [ ] **Step 4: Create FavoriteService interface**

```java
// com/tongji/counter/favorite/FavoriteService.java
package com.tongji.counter.favorite;

public interface FavoriteService {
    void add(long userId, long postId);
    void remove(long userId, long postId);
    FavoritesResponse list(long userId, Long cursor, int size);
}
```

- [ ] **Step 5: Implement FavoriteServiceImpl**

Fetches post IDs from `user_favorites`, loads each post via `KnowPostMapper.findById`, maps to `FeedItemResponse`. This avoids touching the complex feed service cache layer.

```java
// com/tongji/counter/favorite/impl/FavoriteServiceImpl.java
package com.tongji.counter.favorite.impl;

import com.tongji.counter.favorite.FavoriteMapper;
import com.tongji.counter.favorite.FavoriteService;
import com.tongji.counter.favorite.FavoritesResponse;
import com.tongji.knowpost.api.dto.FeedItemResponse;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteMapper mapper;
    private final KnowPostMapper knowPostMapper;

    public FavoriteServiceImpl(FavoriteMapper mapper, KnowPostMapper knowPostMapper) {
        this.mapper = mapper;
        this.knowPostMapper = knowPostMapper;
    }

    @Override
    public void add(long userId, long postId) {
        mapper.insert(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE), userId, postId);
    }

    @Override
    public void remove(long userId, long postId) {
        mapper.delete(userId, postId);
    }

    @Override
    public FavoritesResponse list(long userId, Long cursor, int size) {
        int querySize = size + 1;
        List<Long> ids = mapper.listPostIds(userId, cursor, querySize);
        boolean hasMore = ids.size() > size;
        if (hasMore) ids = ids.subList(0, size);

        List<FeedItemResponse> items = new ArrayList<>();
        for (Long id : ids) {
            KnowPost post = knowPostMapper.findById(id);
            if (post == null) continue;
            // Build a minimal FeedItemResponse from KnowPost fields
            items.add(new FeedItemResponse(
                    String.valueOf(post.getId()),
                    post.getTitle(),
                    post.getDescription(),
                    null,   // coverImage — computed elsewhere
                    null,   // tags list — skip for collections view
                    null,   // authorAvatar
                    null,   // authorNickname
                    post.getTags(),
                    null, null, null, null, null,
                    post.getIsTop()
            ));
        }

        Long nextCursor = hasMore && !ids.isEmpty() ? ids.get(ids.size() - 1) : null;
        return new FavoritesResponse(items, nextCursor, hasMore);
    }
}
```

**Note:** The `FeedItemResponse` record has 13 fields. If author info or like counts are needed in the collections view, inject `UserService` and `CounterService` to enrich the response. For MVP this minimal mapping is sufficient.

- [ ] **Step 6: Run tests**

```bash
cd yixiang_be && mvn test -Dtest=FavoriteServiceImplTest
```

Expected: BUILD SUCCESS, 3 tests passed.

- [ ] **Step 7: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/counter/favorite/
git add yixiang_be/src/test/java/com/tongji/counter/favorite/
git commit -m "feat: FavoriteService add/remove/list with FeedPageResponse"
```

---

### Task 3: FavoriteController and ActionController wiring

**Files:**
- Create: `yixiang_be/src/main/java/com/tongji/counter/favorite/FavoriteController.java`
- Modify: `yixiang_be/src/main/java/com/tongji/counter/api/ActionController.java`

- [ ] **Step 1: Create FavoriteController**

```java
// com/tongji/counter/favorite/FavoriteController.java
package com.tongji.counter.favorite;

import com.tongji.auth.token.JwtService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final JwtService jwtService;

    public FavoriteController(FavoriteService favoriteService, JwtService jwtService) {
        this.favoriteService = favoriteService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public FavoritesResponse list(
            @RequestParam(value = "cursor", required = false) Long cursor,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return favoriteService.list(uid, cursor, Math.min(size, 50));
    }
}
```

- [ ] **Step 2: Wire FavoriteService into ActionController**

`ActionController` already handles fav/unfav. Inject `FavoriteService` and call it:

```java
// Add constructor parameter:
private final FavoriteService favoriteService;

public ActionController(CounterService counterService,
                        JwtService jwtService,
                        FavoriteService favoriteService) {
    this.counterService = counterService;
    this.jwtService = jwtService;
    this.favoriteService = favoriteService;
}
```

In `fav()` method, after `counterService.fav(...)`:
```java
if (changed) {
    favoriteService.add(uid, Long.parseLong(req.getEntityId()));
}
```

In `unfav()` method, after `counterService.unfav(...)`:
```java
if (changed) {
    favoriteService.remove(uid, Long.parseLong(req.getEntityId()));
}
```

- [ ] **Step 3: Compile check**

```bash
cd yixiang_be && mvn compile -q
```

Expected: BUILD SUCCESS

- [ ] **Step 4: Commit**

```bash
git add yixiang_be/src/main/java/com/tongji/counter/favorite/
git add yixiang_be/src/main/java/com/tongji/counter/api/ActionController.java
git commit -m "feat: FavoriteController GET /favorites, wire fav/unfav to persist records"
```

---

### Task 4: Frontend CollectionsPage

**Files:**
- Create: `yixiang_fe/src/services/favoriteService.ts`
- Create: `yixiang_fe/src/pages/CollectionsPage.tsx`
- Modify: `yixiang_fe/src/App.tsx`

- [ ] **Step 1: Create favoriteService**

```typescript
// src/services/favoriteService.ts
import { apiFetch } from './apiClient';
import type { FeedItem } from '@/types/knowpost';

export interface FavoritesResponse {
  items: FeedItem[];
  nextCursor: number | null;
  hasMore: boolean;
}

export const favoriteService = {
  list: (cursor?: number, size = 20) => {
    const params = new URLSearchParams({ size: String(size) });
    if (cursor) params.set('cursor', String(cursor));
    return apiFetch<FavoritesResponse>(`/api/v1/favorites?${params.toString()}`);
  },
};
```

- [ ] **Step 2: Create CollectionsPage**

```tsx
// src/pages/CollectionsPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { favoriteService } from '@/services/favoriteService';
import type { FavoritesResponse } from '@/services/favoriteService';
import PostCard from '@/components/post/PostCard';
import { Button } from '@/components/ui/button';
import type { FeedItem } from '@/types/knowpost';

export default function CollectionsPage() {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (reset: boolean) => {
    if (!tokens) return;
    setLoading(true);
    try {
      const res = await favoriteService.list(reset ? undefined : (cursor ?? undefined));
      setItems(prev => reset ? res.items : [...prev, ...res.items]);
      setCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, [tokens, cursor]);

  useEffect(() => { load(true); }, [tokens]);

  if (!tokens) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-xl font-semibold mb-4">我的收藏</h1>

      <div className="space-y-3">
        {items.map(item => (
          <PostCard key={item.id} post={item} />
        ))}
        {items.length === 0 && !loading && (
          <p className="text-center text-muted-foreground py-12">暂无收藏</p>
        )}
        {hasMore && (
          <Button variant="ghost" className="w-full" onClick={() => load(false)} disabled={loading}>
            {loading ? '加载中…' : '加载更多'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

**Note:** Check what props `PostCard` expects by reading `src/components/post/PostCard.tsx`. The `post` prop type should be `FeedItem` or similar. Adjust if the type name differs.

- [ ] **Step 3: Add route**

In `App.tsx` add:
```tsx
import CollectionsPage from "@/pages/CollectionsPage";
// Inside <Route element={<Layout />}>:
<Route path="collections" element={<CollectionsPage />} />
```

- [ ] **Step 4: Type check**

```bash
cd yixiang_fe && npm run lint
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add yixiang_fe/src/services/favoriteService.ts
git add yixiang_fe/src/pages/CollectionsPage.tsx
git add yixiang_fe/src/App.tsx
git commit -m "feat: collections page listing favorited posts"
```

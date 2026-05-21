package com.tongji.knowpost.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.tongji.activity.mapper.ActivityMapper;
import com.tongji.cache.hotkey.HotKeyDetector;
import com.tongji.counter.recent.RecentLikersService;
import com.tongji.counter.service.CounterService;
import com.tongji.knowpost.api.dto.FeedPageResponse;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPostFeedRow;
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
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KnowPostFeedServiceImplUserPostsTest {

    @Mock KnowPostMapper mapper;
    @Mock StringRedisTemplate redis;
    @Mock CounterService counterService;
    @Mock RecentLikersService recentLikersService;
    @Mock ActivityMapper activityMapper;
    @Mock Cache<String, FeedPageResponse> feedPublicCache;
    @Mock Cache<String, FeedPageResponse> feedMineCache;
    @Mock HotKeyDetector hotKey;

    @Test
    void getUserPublished_returnsPublicUserPostsWithViewerState() {
        when(mapper.listUserPublished(eq(2L), eq(3), eq(0)))
                .thenReturn(List.of(row(10L, "first"), row(11L, "second"), row(12L, "third")));
        lenient().when(counterService.getCounts(anyString(), anyString(), any()))
                .thenReturn(Map.of("like", 0L, "fav", 0L, "comment", 0L));
        when(counterService.isLiked("knowpost", "10", 9L)).thenReturn(true);
        when(recentLikersService.top5Batch(any())).thenReturn(Map.of());
        when(recentLikersService.summary(any(), anyLong())).thenReturn("");

        KnowPostFeedServiceImpl service = new KnowPostFeedServiceImpl(
                mapper, redis, new ObjectMapper(), counterService, recentLikersService,
                activityMapper, feedPublicCache, feedMineCache, hotKey);

        FeedPageResponse resp = service.getUserPublished(2L, 1, 2, 9L);

        assertThat(resp.items()).extracting("id").containsExactly("10", "11");
        assertThat(resp.items().getFirst().liked()).isTrue();
        assertThat(resp.hasMore()).isTrue();
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

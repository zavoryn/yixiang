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

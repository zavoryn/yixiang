package com.tongji.hot.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.counter.service.CounterService;
import com.tongji.hot.service.HotPeriod;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HotServiceImplCounterKeyTest {

    @Test
    void listHotPostsReadsKnowpostCountersWithFavMetric() {
        KnowPostMapper postMapper = mock(KnowPostMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        CounterService counterService = mock(CounterService.class);
        when(postMapper.listPublishedSince(any(Instant.class), eq(200))).thenReturn(List.of(post()));
        when(userMapper.listSummariesByIds(eq(Set.of(2L)))).thenReturn(List.of(user()));
        when(counterService.getCountsBatch(eq("knowpost"), eq(List.of("10")), eq(List.of("like", "comment", "fav"))))
                .thenReturn(Map.of("10", Map.of("like", 3L, "comment", 2L, "fav", 1L)));

        HotServiceImpl service = new HotServiceImpl(postMapper, userMapper, counterService, new ObjectMapper());

        service.listHotPosts(HotPeriod.H24, null, 10);

        verify(counterService).getCountsBatch("knowpost", List.of("10"), List.of("like", "comment", "fav"));
    }

    private static KnowPost post() {
        return KnowPost.builder()
                .id(10L)
                .creatorId(2L)
                .title("title")
                .description("desc")
                .tags("[]")
                .imgUrls("[]")
                .createTime(Instant.now())
                .build();
    }

    private static User user() {
        return User.builder()
                .id(2L)
                .nickname("author")
                .avatar("avatar")
                .build();
    }
}

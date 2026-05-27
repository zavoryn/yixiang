package com.tongji.topic.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.counter.service.CounterService;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import com.tongji.topic.mapper.TopicMapper;
import com.tongji.topic.model.Topic;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.redisson.api.RedissonClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TopicServiceImplCounterKeyTest {

    @Test
    void listPostsByTagReadsKnowpostCountersWithFavMetric() {
        TopicMapper topicMapper = mock(TopicMapper.class);
        KnowPostMapper postMapper = mock(KnowPostMapper.class);
        UserMapper userMapper = mock(UserMapper.class);
        CounterService counterService = mock(CounterService.class);
        RedissonClient redisson = mock(RedissonClient.class);
        when(topicMapper.findByTag("AI")).thenReturn(Topic.builder().tag("AI").postCount(1).viewCount(1L).build());
        when(postMapper.listByTag("AI", 0, 11)).thenReturn(List.of(post()));
        when(userMapper.listSummariesByIds(eq(Set.of(2L)))).thenReturn(List.of(user()));
        when(counterService.getCountsBatch(eq("knowpost"), eq(List.of("10")), eq(List.of("like", "comment", "fav"))))
                .thenReturn(Map.of("10", Map.of("like", 3L, "comment", 2L, "fav", 1L)));

        TopicServiceImpl service = new TopicServiceImpl(
                topicMapper, postMapper, userMapper, counterService, redisson, new ObjectMapper());

        service.listPostsByTag("AI", null, 10);

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

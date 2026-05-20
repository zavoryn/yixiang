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
    private static final List<String> METRICS = List.of("like", "comment", "favorite");

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

        List<KnowPost> page = postMapper.listByTag(tag, offset, effective + 1);
        boolean hasMore = page.size() > effective;
        if (hasMore) page = page.subList(0, effective);

        List<String> postIds = page.stream().map(p -> String.valueOf(p.getId())).toList();
        Map<String, Map<String, Long>> countsBatch = postIds.isEmpty() ? Map.of()
                : counterService.getCountsBatch("post", postIds, METRICS);

        Set<Long> authorIds = page.stream().map(KnowPost::getCreatorId).collect(Collectors.toSet());
        Map<Long, UserBrief> authors = authorIds.isEmpty() ? Map.of() :
                userMapper.listSummariesByIds(authorIds).stream()
                        .collect(Collectors.toMap(User::getId, UserBrief::from));

        List<HotPostResponse> items = page.stream().map(p -> {
            Map<String, Long> c = countsBatch.getOrDefault(String.valueOf(p.getId()), Map.of());
            return new HotPostResponse(
                    p.getId(), p.getTitle(), p.getDescription(), firstImage(p.getImgUrls()),
                    parseTags(p.getTags()),
                    authors.get(p.getCreatorId()),
                    c.getOrDefault("like", 0L),
                    c.getOrDefault("comment", 0L),
                    c.getOrDefault("favorite", 0L),
                    p.getCreateTime()
            );
        }).toList();

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

    private String firstImage(String imgUrlsJson) {
        if (imgUrlsJson == null || imgUrlsJson.isBlank()) return null;
        try {
            List<String> imgs = objectMapper.readValue(imgUrlsJson, new TypeReference<>() {});
            return imgs.isEmpty() ? null : imgs.get(0);
        } catch (Exception e) {
            return null;
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

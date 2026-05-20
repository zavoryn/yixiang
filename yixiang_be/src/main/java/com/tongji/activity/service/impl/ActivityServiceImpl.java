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

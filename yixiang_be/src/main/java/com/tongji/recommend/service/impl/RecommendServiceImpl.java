package com.tongji.recommend.service.impl;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.tongji.circle.mapper.CircleMapper;
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
    private static final List<String> FOLLOWER_METRICS = List.of("follower");

    private final UserMapper userMapper;
    private final CircleMapper circleMapper;
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
                                RelationService relationService,
                                CounterService counterService) {
        this.userMapper = userMapper;
        this.circleMapper = circleMapper;
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

        List<String> uidStrings = topIds.stream().map(String::valueOf).toList();
        Map<String, Map<String, Long>> countsBatch = counterService.getCountsBatch("user", uidStrings, FOLLOWER_METRICS);

        List<RecommendUserResponse> result = new ArrayList<>(topIds.size());
        for (Long uid : topIds) {
            User u = users.get(uid);
            if (u == null) continue;
            long fc = countsBatch.getOrDefault(String.valueOf(uid), Map.of()).getOrDefault("follower", 0L);
            result.add(new RecommendUserResponse(
                    u.getId(), u.getNickname(), u.getAvatar(), u.getBio(),
                    u.getRoleTitle(),
                    u.getVerified() != null && u.getVerified(),
                    fc,
                    false
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

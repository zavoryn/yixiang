package com.tongji.counter.recent;

import com.tongji.user.api.dto.UserBrief;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.redisson.api.RScoredSortedSet;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecentLikersService {

    private static final String KEY_PREFIX = "recent:likers:";
    private static final int CAPACITY = 5;
    private static final Duration TTL = Duration.ofDays(7);

    private final RedissonClient redisson;
    private final UserMapper userMapper;

    public RecentLikersService(RedissonClient redisson, UserMapper userMapper) {
        this.redisson = redisson;
        this.userMapper = userMapper;
    }

    public void addLiker(long postId, long userId) {
        RScoredSortedSet<Long> zset = redisson.getScoredSortedSet(KEY_PREFIX + postId);
        zset.add((double) System.currentTimeMillis(), userId);
        while (zset.size() > CAPACITY) {
            zset.pollFirst();
        }
        zset.expire(TTL);
    }

    public void removeLiker(long postId, long userId) {
        RScoredSortedSet<Long> zset = redisson.getScoredSortedSet(KEY_PREFIX + postId);
        zset.remove(userId);
    }

    public List<UserBrief> top5(long postId) {
        RScoredSortedSet<Long> zset = redisson.getScoredSortedSet(KEY_PREFIX + postId);
        if (zset.isEmpty()) return List.of();
        Collection<Long> ids = zset.valueRangeReversed(0, CAPACITY - 1);
        if (ids.isEmpty()) return List.of();

        Map<Long, UserBrief> byId = userMapper.listSummariesByIds(ids).stream()
                .collect(Collectors.toMap(User::getId, UserBrief::from));
        List<UserBrief> out = new ArrayList<>(ids.size());
        for (Long id : ids) {
            UserBrief b = byId.get(id);
            if (b != null) out.add(b);
        }
        return out;
    }

    public Map<Long, List<UserBrief>> top5Batch(Collection<Long> postIds) {
        if (postIds == null || postIds.isEmpty()) return Map.of();
        Map<Long, List<UserBrief>> out = new HashMap<>(postIds.size());
        Map<Long, Collection<Long>> idsPerPost = new HashMap<>();
        Set<Long> allUserIds = new HashSet<>();
        for (Long pid : postIds) {
            RScoredSortedSet<Long> zset = redisson.getScoredSortedSet(KEY_PREFIX + pid);
            Collection<Long> ids = zset.isEmpty() ? List.of() : zset.valueRangeReversed(0, CAPACITY - 1);
            idsPerPost.put(pid, ids);
            allUserIds.addAll(ids);
        }
        Map<Long, UserBrief> byId = allUserIds.isEmpty() ? Map.of() :
                userMapper.listSummariesByIds(allUserIds).stream()
                        .collect(Collectors.toMap(User::getId, UserBrief::from));
        for (Map.Entry<Long, Collection<Long>> e : idsPerPost.entrySet()) {
            List<UserBrief> briefs = new ArrayList<>(e.getValue().size());
            for (Long uid : e.getValue()) {
                UserBrief b = byId.get(uid);
                if (b != null) briefs.add(b);
            }
            out.put(e.getKey(), briefs);
        }
        return out;
    }

    public String summary(List<UserBrief> briefs, long likeCount) {
        if (likeCount <= 0 || briefs == null || briefs.isEmpty()) return "";
        StringBuilder sb = new StringBuilder();
        int show = Math.min(2, briefs.size());
        for (int i = 0; i < show; i++) {
            if (i > 0) sb.append("、");
            sb.append(briefs.get(i).nickname());
        }
        if (likeCount > show) {
            sb.append(" 等 ").append(likeCount).append(" 人觉得很赞");
        } else {
            sb.append(" 觉得很赞");
        }
        return sb.toString();
    }
}

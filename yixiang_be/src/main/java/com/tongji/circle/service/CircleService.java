package com.tongji.circle.service;

import com.tongji.circle.api.dto.*;

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

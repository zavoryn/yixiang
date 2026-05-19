package com.tongji.recommend.service;

import com.tongji.recommend.api.dto.RecommendCircleResponse;
import com.tongji.recommend.api.dto.RecommendUserResponse;

import java.util.List;

public interface RecommendService {
    List<RecommendUserResponse> recommendUsers(Long viewerId, int limit);
    List<RecommendCircleResponse> recommendCircles(Long viewerId, int limit);
}

package com.tongji.recommend.api.dto;

public record RecommendCircleResponse(
        Long id,
        String name,
        String avatarUrl,
        String description,
        String category,
        int memberCount,
        boolean joined
) {}

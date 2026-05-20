package com.tongji.circle.api.dto;

public record CircleSummaryResponse(
        long id,
        String name,
        String description,
        String avatarUrl,
        String category,
        String visibility,
        int memberCount,
        int postCount,
        boolean joined
) {}

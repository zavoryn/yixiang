package com.tongji.recommend.api.dto;

public record RecommendUserResponse(
        Long id,
        String nickname,
        String avatar,
        String bio,
        String roleTitle,
        Boolean verified,
        long followerCount,
        boolean followed
) {}

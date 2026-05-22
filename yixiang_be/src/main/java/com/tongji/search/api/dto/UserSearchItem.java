package com.tongji.search.api.dto;

public record UserSearchItem(
        long id,
        String nickname,
        String avatar,
        boolean verified,
        String roleTitle,
        int followerCount,
        int followingCount
) {}

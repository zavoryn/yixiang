package com.tongji.hot.api.dto;

import com.tongji.user.api.dto.UserBrief;

import java.time.Instant;
import java.util.List;

public record HotPostResponse(
        Long id,
        String title,
        String description,
        String coverImage,
        List<String> tags,
        UserBrief author,
        long likeCount,
        long commentCount,
        long favoriteCount,
        Instant createdAt
) {}

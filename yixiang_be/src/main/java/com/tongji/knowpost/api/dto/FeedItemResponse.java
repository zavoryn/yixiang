package com.tongji.knowpost.api.dto;

import com.tongji.user.api.dto.UserBrief;

import java.time.Instant;
import java.util.List;

public record FeedItemResponse(
        String id,
        String title,
        String description,
        String coverImage,
        List<String> tags,
        String authorAvatar,
        String authorNickname,
        String tagJson,
        Long likeCount,
        Long favoriteCount,
        Long commentCount,
        Boolean liked,
        Boolean faved,
        Boolean isTop,
        List<UserBrief> recentLikers,
        String likerSummary,
        Instant publishTime
) {}

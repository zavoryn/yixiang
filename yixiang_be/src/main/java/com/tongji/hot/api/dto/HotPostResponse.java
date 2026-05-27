package com.tongji.hot.api.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import com.tongji.user.api.dto.UserBrief;

import java.time.Instant;
import java.util.List;

public record HotPostResponse(
        @JsonSerialize(using = ToStringSerializer.class) Long id,
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

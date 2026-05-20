package com.tongji.activity.api.dto;

import com.tongji.user.api.dto.UserBrief;

import java.time.Instant;
import java.util.Map;

public record ActivityResponse(
        Long id,
        UserBrief actor,
        String type,
        String targetType,
        Long targetId,
        Map<String, Object> payload,
        Instant createdAt
) {}

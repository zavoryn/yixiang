package com.tongji.circle.api.dto;

import java.time.Instant;

public record CircleMemberItem(
        Long userId,
        String nickname,
        String avatar,
        String role,        // OWNER / ADMIN / MEMBER
        Boolean verified,
        Instant joinedAt
) {}

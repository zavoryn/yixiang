package com.tongji.circle.api.dto;

import java.time.Instant;
import java.util.List;

public record CircleDetailResponse(
        long id,
        String name,
        String description,
        String avatarUrl,
        String category,
        String visibility,
        int memberCount,
        int postCount,
        Instant createdAt,
        boolean joined,
        String myRole,
        List<MemberSummary> topMembers
) {
    public record MemberSummary(long userId, String nickname, String avatar, String role) {}
}

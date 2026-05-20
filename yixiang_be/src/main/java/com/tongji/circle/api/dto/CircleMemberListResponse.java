package com.tongji.circle.api.dto;

import java.util.List;

public record CircleMemberListResponse(
        List<CircleMemberItem> items,
        long total,
        int page,
        int size,
        boolean hasMore
) {}

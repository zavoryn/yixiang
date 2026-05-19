package com.tongji.activity.api.dto;

import java.util.List;

public record ActivityListResponse(
        List<ActivityResponse> items,
        String nextCursor
) {}

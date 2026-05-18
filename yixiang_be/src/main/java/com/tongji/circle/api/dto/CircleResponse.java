package com.tongji.circle.api.dto;

import java.util.List;

public record CircleResponse(
        List<CircleSummaryResponse> items,
        int total,
        int page,
        int size
) {}

package com.tongji.hot.api.dto;

import java.util.List;

public record HotPostListResponse(
        List<HotPostResponse> items,
        String nextCursor
) {}

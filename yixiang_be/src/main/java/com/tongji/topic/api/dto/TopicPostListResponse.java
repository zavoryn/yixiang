package com.tongji.topic.api.dto;

import com.tongji.hot.api.dto.HotPostResponse;

import java.util.List;

public record TopicPostListResponse(
        String tag,
        List<HotPostResponse> items,
        String nextCursor
) {}

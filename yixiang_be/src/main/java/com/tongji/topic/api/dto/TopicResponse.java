package com.tongji.topic.api.dto;

public record TopicResponse(
        String tag,
        int postCount,
        long viewCount
) {}

package com.tongji.draft.api.dto;

import java.time.Instant;
import java.util.List;

public record DraftResponse(
        Long id,
        String title,
        String contentUrl,
        List<String> tags,
        Long circleId,
        String coverImage,
        Instant updatedAt,
        Instant createdAt
) {}

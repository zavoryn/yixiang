package com.tongji.draft.api.dto;

import java.util.List;

public record DraftCreateRequest(
        String title,
        String contentUrl,
        List<String> tags,
        Long circleId,
        String coverImage
) {}

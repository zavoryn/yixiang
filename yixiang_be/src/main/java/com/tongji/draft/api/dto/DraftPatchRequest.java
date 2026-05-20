package com.tongji.draft.api.dto;

import java.util.List;

public record DraftPatchRequest(
        String title,
        String contentUrl,
        List<String> tags,
        Long circleId,
        String coverImage
) {}

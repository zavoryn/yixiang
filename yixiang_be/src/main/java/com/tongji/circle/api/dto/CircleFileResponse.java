package com.tongji.circle.api.dto;

import java.time.Instant;

public record CircleFileResponse(
        long id,
        String filename,
        long fileSize,
        String mimeType,
        String ossUrl,
        long uploaderId,
        String uploaderNickname,
        Instant createdAt
) {}

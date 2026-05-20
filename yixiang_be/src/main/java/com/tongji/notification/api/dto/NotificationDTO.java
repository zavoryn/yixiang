package com.tongji.notification.api.dto;

import java.time.Instant;

public record NotificationDTO(
        long id,
        Long actorId,
        String actorNickname,
        String actorAvatar,
        String type,
        String entityType,
        Long entityId,
        String content,
        boolean isRead,
        Instant createdAt
) {}

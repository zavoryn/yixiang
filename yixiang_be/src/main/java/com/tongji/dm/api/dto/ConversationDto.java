package com.tongji.dm.api.dto;

import java.time.Instant;

public record ConversationDto(
        long id,
        long otherUserId,
        String otherNickname,
        String otherAvatar,
        boolean otherVerified,
        String lastMsgPreview,
        Instant lastMsgAt,
        int unreadCount
) {}

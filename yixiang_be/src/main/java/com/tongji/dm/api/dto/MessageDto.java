package com.tongji.dm.api.dto;

import java.time.Instant;

public record MessageDto(
        long id,
        long convId,
        long senderId,
        String senderNickname,
        String senderAvatar,
        String body,
        Instant sentAt,
        boolean isMine
) {}

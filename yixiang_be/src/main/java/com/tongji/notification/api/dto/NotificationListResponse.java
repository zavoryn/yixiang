package com.tongji.notification.api.dto;

import java.util.List;

public record NotificationListResponse(
        List<NotificationDTO> items,
        Long nextCursor,
        boolean hasMore
) {}

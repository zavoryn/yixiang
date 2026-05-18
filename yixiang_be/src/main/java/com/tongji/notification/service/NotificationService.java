package com.tongji.notification.service;

import com.tongji.notification.api.dto.NotificationListResponse;
import com.tongji.notification.model.Notification;

public interface NotificationService {
    void create(Notification notification);
    NotificationListResponse list(long recipientId, String type, Long cursor, int size);
    int unreadCount(long recipientId);
    void markAllRead(long recipientId);
    void markOneRead(long id, long recipientId);
}

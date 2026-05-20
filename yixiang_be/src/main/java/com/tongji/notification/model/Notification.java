package com.tongji.notification.model;

import lombok.Data;
import java.time.Instant;

@Data
public class Notification {
    private Long id;
    private Long recipientId;
    private Long actorId;
    private String type;
    private String entityType;
    private Long entityId;
    private String content;
    private boolean isRead;
    private Instant createdAt;
}

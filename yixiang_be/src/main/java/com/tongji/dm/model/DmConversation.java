package com.tongji.dm.model;

import lombok.Data;
import java.time.Instant;

@Data
public class DmConversation {
    private Long id;
    private Long user1Id;
    private Long user2Id;
    private Integer unread1;
    private Integer unread2;
    private String lastMsgPreview;
    private Instant lastMsgAt;
    private Instant createdAt;
}

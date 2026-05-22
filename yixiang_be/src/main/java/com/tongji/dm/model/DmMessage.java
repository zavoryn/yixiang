package com.tongji.dm.model;

import lombok.Data;
import java.time.Instant;

@Data
public class DmMessage {
    private Long id;
    private Long convId;
    private Long senderId;
    private String body;
    private Instant sentAt;
    private Instant readAt;
}

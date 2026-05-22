package com.tongji.circle.model;

import lombok.Data;
import java.time.Instant;

@Data
public class CircleFile {
    private Long id;
    private Long circleId;
    private Long uploaderId;
    private String filename;
    private Long fileSize;
    private String mimeType;
    private String ossKey;
    private String ossUrl;
    private Instant createdAt;
}

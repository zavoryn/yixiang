package com.tongji.activity.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Activity {
    private Long id;
    private Long userId;
    private String type;
    private String targetType;
    private Long targetId;
    private String payloadJson;
    private Instant createdAt;
}

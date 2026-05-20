package com.tongji.circle.model;

import lombok.Data;
import java.time.Instant;

@Data
public class CircleMember {
    private Long id;
    private Long circleId;
    private Long userId;
    private String role;
    private String status;
    private Instant joinedAt;
}

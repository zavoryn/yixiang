package com.tongji.circle.model;

import lombok.Data;
import java.time.Instant;

@Data
public class Circle {
    private Long id;
    private String name;
    private String description;
    private String avatarUrl;
    private Long ownerId;
    private String visibility;
    private String status;
    private String category;
    private int memberCount;
    private int postCount;
    private Instant createdAt;
}

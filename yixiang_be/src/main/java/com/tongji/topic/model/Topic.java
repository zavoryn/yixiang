package com.tongji.topic.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Topic {
    private String tag;
    private Integer postCount;
    private Long viewCount;
    private Instant lastUsedAt;
}

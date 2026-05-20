package com.tongji.draft.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Draft {
    private Long id;
    private Long userId;
    private String title;
    private String contentUrl;
    private String tagsJson;
    private Long circleId;
    private String coverImage;
    private Instant updatedAt;
    private Instant createdAt;
}

package com.tongji.circle.api.dto;

import jakarta.validation.constraints.Size;

public record CirclePatchRequest(
        @Size(max = 50) String name,
        @Size(max = 500) String description,
        String avatarUrl,
        String category,
        String visibility
) {}

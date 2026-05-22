package com.tongji.search.api.dto;

import java.util.List;

public record UserSearchResponse(
        List<UserSearchItem> items,
        boolean hasMore
) {}

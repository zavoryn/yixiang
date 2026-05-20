package com.tongji.counter.favorite;

import com.tongji.knowpost.api.dto.FeedItemResponse;
import java.util.List;

public record FavoritesResponse(
        List<FeedItemResponse> items,
        Long nextCursor,
        boolean hasMore
) {}

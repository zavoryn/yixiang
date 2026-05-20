package com.tongji.comment.api.dto;

import java.util.List;

public record CommentListResponse(
        List<CommentDTO> items,
        String nextCursor,
        boolean hasMore
) {}

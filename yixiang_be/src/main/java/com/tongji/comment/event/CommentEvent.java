package com.tongji.comment.event;

public record CommentEvent(
        long commentId,
        long postId,
        long postAuthorId,
        long commenterId,
        String contentSnippet
) {}

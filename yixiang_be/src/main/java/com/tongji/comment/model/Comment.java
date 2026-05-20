package com.tongji.comment.model;

import lombok.Data;
import java.time.Instant;

@Data
public class Comment {
    private Long id;
    private Long postId;
    private Long userId;
    private String content;
    private Long parentId;
    private Long replyToUserId;
    private Integer status;
    private Instant createdAt;
    private Instant updatedAt;
}

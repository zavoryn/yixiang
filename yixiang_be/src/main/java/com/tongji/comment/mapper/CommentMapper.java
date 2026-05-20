package com.tongji.comment.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Mapper
public interface CommentMapper {

    int insert(@Param("id") Long id,
               @Param("postId") Long postId,
               @Param("userId") Long userId,
               @Param("content") String content,
               @Param("parentId") Long parentId,
               @Param("replyToUserId") Long replyToUserId);

    int softDelete(@Param("id") Long id, @Param("userId") Long userId);

    Map<String, Object> findById(@Param("id") Long id);

    List<Map<String, Object>> listByPostId(@Param("postId") Long postId,
                                            @Param("createdAt") Instant createdAt,
                                            @Param("id") Long id,
                                            @Param("size") int size);

    List<Map<String, Object>> listReplies(@Param("parentId") Long parentId,
                                           @Param("createdAt") Instant createdAt,
                                           @Param("id") Long id,
                                           @Param("size") int size);

    int countReplies(@Param("parentId") Long parentId);
}

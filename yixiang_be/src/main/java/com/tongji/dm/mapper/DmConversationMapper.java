package com.tongji.dm.mapper;

import com.tongji.dm.model.DmConversation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DmConversationMapper {
    void insert(DmConversation conv);
    DmConversation findBetween(@Param("a") long a, @Param("b") long b);
    DmConversation findById(@Param("id") long id);
    List<DmConversation> listByUser(@Param("userId") long userId, @Param("limit") int limit);
    void updateLastMsg(@Param("id") long id, @Param("preview") String preview);
    void incrementUnread(@Param("id") long id, @Param("recipientId") long recipientId,
                         @Param("user1Id") long user1Id);
    void clearUnread(@Param("id") long id, @Param("userId") long userId,
                     @Param("user1Id") long user1Id);
    int totalUnread(@Param("userId") long userId);
}

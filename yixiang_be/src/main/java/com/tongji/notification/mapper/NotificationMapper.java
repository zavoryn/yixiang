package com.tongji.notification.mapper;

import com.tongji.notification.model.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationMapper {
    void insert(Notification notification);

    List<Notification> listByRecipient(@Param("recipientId") long recipientId,
                                       @Param("type") String type,
                                       @Param("lastId") Long lastId,
                                       @Param("size") int size);

    int countUnread(@Param("recipientId") long recipientId);

    int countByType(@Param("recipientId") long recipientId, @Param("type") String type);

    int markAllRead(@Param("recipientId") long recipientId);

    int markOneRead(@Param("id") long id, @Param("recipientId") long recipientId);
}

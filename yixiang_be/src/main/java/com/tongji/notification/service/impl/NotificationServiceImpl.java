package com.tongji.notification.service.impl;

import com.tongji.notification.api.dto.NotificationDTO;
import com.tongji.notification.api.dto.NotificationListResponse;
import com.tongji.notification.api.dto.NotificationOverviewResponse;
import com.tongji.notification.mapper.NotificationMapper;
import com.tongji.notification.model.Notification;
import com.tongji.notification.service.NotificationService;
import com.tongji.notification.sse.SseEmitterRegistry;
import com.tongji.user.domain.User;
import com.tongji.user.service.UserService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper mapper;
    private final SseEmitterRegistry registry;
    private final UserService userService;

    public NotificationServiceImpl(NotificationMapper mapper,
                                   SseEmitterRegistry registry,
                                   UserService userService) {
        this.mapper = mapper;
        this.registry = registry;
        this.userService = userService;
    }

    @Override
    public void create(Notification notification) {
        notification.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        mapper.insert(notification);
        int unread = mapper.countUnread(notification.getRecipientId());
        registry.sendUnreadCount(notification.getRecipientId(), unread);
    }

    @Override
    public NotificationListResponse list(long recipientId, String type, Long cursor, int size) {
        int querySize = size + 1;
        List<Notification> rows = mapper.listByRecipient(recipientId, type, cursor, querySize);
        boolean hasMore = rows.size() > size;
        if (hasMore) rows = rows.subList(0, size);

        List<NotificationDTO> items = rows.stream().map(n -> {
            String nickname = null;
            String avatar = null;
            if (n.getActorId() != null) {
                User actor = userService.findById(n.getActorId()).orElse(null);
                if (actor != null) {
                    nickname = actor.getNickname();
                    avatar = actor.getAvatar();
                }
            }
            return new NotificationDTO(n.getId(), n.getActorId(), nickname, avatar,
                    n.getType(), n.getEntityType(), n.getEntityId(),
                    n.getContent(), n.isRead(), n.getCreatedAt());
        }).toList();

        Long nextCursor = hasMore ? rows.get(rows.size() - 1).getId() : null;
        return new NotificationListResponse(items, nextCursor, hasMore);
    }

    @Override
    public int unreadCount(long recipientId) {
        return mapper.countUnread(recipientId);
    }

    @Override
    public NotificationOverviewResponse overview(long recipientId) {
        int unread = mapper.countUnread(recipientId);
        int comment = mapper.countByType(recipientId, "COMMENT");
        int like = mapper.countByType(recipientId, "LIKE");
        int follow = mapper.countByType(recipientId, "FOLLOW");
        int system = mapper.countByType(recipientId, "SYSTEM");
        return new NotificationOverviewResponse(unread, comment, like, follow, system);
    }

    @Override
    public void markAllRead(long recipientId) {
        mapper.markAllRead(recipientId);
    }

    @Override
    public void markOneRead(long id, long recipientId) {
        mapper.markOneRead(id, recipientId);
    }
}

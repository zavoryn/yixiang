package com.tongji.notification.service.impl;

import com.tongji.notification.mapper.NotificationMapper;
import com.tongji.notification.model.Notification;
import com.tongji.notification.sse.SseEmitterRegistry;
import com.tongji.user.service.UserService;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class NotificationServiceImplTest {

    private final NotificationMapper mapper = mock(NotificationMapper.class);
    private final SseEmitterRegistry registry = mock(SseEmitterRegistry.class);
    private final UserService userService = mock(UserService.class);
    private final NotificationServiceImpl service =
            new NotificationServiceImpl(mapper, registry, userService);

    @Test
    void createPersistsAndPushesUnreadCount() {
        when(mapper.countUnread(42L)).thenReturn(3);
        when(mapper.listByRecipient(anyLong(), any(), any(), anyInt())).thenReturn(List.of());

        Notification n = new Notification();
        n.setRecipientId(42L);
        n.setActorId(7L);
        n.setType("LIKE");
        n.setEntityType("POST");
        n.setEntityId(100L);
        n.setContent("有人点赞了你的帖子");
        service.create(n);

        verify(mapper).insert(argThat(notif -> notif.getId() != null && notif.getRecipientId() == 42L));
        verify(registry).sendUnreadCount(42L, 3);
    }

    @Test
    void markAllReadDelegatesToMapper() {
        service.markAllRead(99L);
        verify(mapper).markAllRead(99L);
    }
}

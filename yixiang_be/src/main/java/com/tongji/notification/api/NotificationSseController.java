package com.tongji.notification.api;

import com.tongji.auth.token.JwtService;
import com.tongji.notification.service.NotificationService;
import com.tongji.notification.sse.SseEmitterRegistry;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationSseController {

    private final SseEmitterRegistry registry;
    private final NotificationService notificationService;
    private final JwtService jwtService;

    public NotificationSseController(SseEmitterRegistry registry,
                                     NotificationService notificationService,
                                     JwtService jwtService) {
        this.registry = registry;
        this.notificationService = notificationService;
        this.jwtService = jwtService;
    }

    @GetMapping("/stream")
    public SseEmitter stream(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        SseEmitter emitter = registry.register(uid);
        try {
            int unread = notificationService.unreadCount(uid);
            emitter.send(SseEmitter.event().name("unread").data("{\"unreadCount\":" + unread + "}"));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        return emitter;
    }
}

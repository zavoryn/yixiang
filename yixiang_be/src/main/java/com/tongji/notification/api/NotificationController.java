package com.tongji.notification.api;

import com.tongji.auth.token.JwtService;
import com.tongji.notification.api.dto.NotificationListResponse;
import com.tongji.notification.api.dto.NotificationOverviewResponse;
import com.tongji.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtService jwtService;

    public NotificationController(NotificationService notificationService, JwtService jwtService) {
        this.notificationService = notificationService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public NotificationListResponse list(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "cursor", required = false) Long cursor,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return notificationService.list(uid, type, cursor, Math.min(size, 50));
    }

    @GetMapping("/unread-count")
    public Map<String, Integer> unreadCount(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return Map.of("unreadCount", notificationService.unreadCount(uid));
    }

    @GetMapping("/overview")
    public NotificationOverviewResponse overview(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return notificationService.overview(uid);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> readAll(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        notificationService.markAllRead(uid);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> readOne(@PathVariable long id,
                                        @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        notificationService.markOneRead(id, uid);
        return ResponseEntity.noContent().build();
    }
}

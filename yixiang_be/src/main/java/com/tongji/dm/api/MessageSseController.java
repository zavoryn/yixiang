package com.tongji.dm.api;

import com.tongji.auth.token.JwtService;
import com.tongji.dm.sse.DmSseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessageSseController {
    private final JwtService jwtService;
    private final DmSseEmitterRegistry registry;

    @GetMapping("/stream")
    public SseEmitter stream(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return registry.register(uid);
    }
}

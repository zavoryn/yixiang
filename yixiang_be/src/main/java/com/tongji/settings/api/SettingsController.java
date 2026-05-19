package com.tongji.settings.api;

import com.tongji.auth.token.JwtService;
import com.tongji.settings.api.dto.SettingsPatchRequest;
import com.tongji.settings.api.dto.SettingsResponse;
import com.tongji.settings.service.SettingsService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsService settingsService;
    private final JwtService jwtService;

    public SettingsController(SettingsService settingsService, JwtService jwtService) {
        this.settingsService = settingsService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public SettingsResponse get(@AuthenticationPrincipal Jwt jwt) {
        return settingsService.get(jwtService.extractUserId(jwt));
    }

    @PatchMapping
    public SettingsResponse patch(@AuthenticationPrincipal Jwt jwt, @RequestBody SettingsPatchRequest req) {
        return settingsService.patch(jwtService.extractUserId(jwt), req);
    }
}

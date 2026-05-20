package com.tongji.activity.api;

import com.tongji.activity.api.dto.ActivityListResponse;
import com.tongji.activity.service.ActivityService;
import com.tongji.auth.token.JwtService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/activities")
public class ActivityController {

    private final ActivityService activityService;
    private final JwtService jwtService;

    public ActivityController(ActivityService activityService, JwtService jwtService) {
        this.activityService = activityService;
        this.jwtService = jwtService;
    }

    @GetMapping("/following")
    public ActivityListResponse following(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "cursor", required = false) Long cursor,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        long uid = jwtService.extractUserId(jwt);
        return activityService.listFollowing(uid, cursor, size);
    }
}

package com.tongji.recommend.api;

import com.tongji.auth.token.JwtService;
import com.tongji.recommend.api.dto.RecommendCircleResponse;
import com.tongji.recommend.api.dto.RecommendUserResponse;
import com.tongji.recommend.service.RecommendService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommend")
public class RecommendController {

    private final RecommendService recommendService;
    private final JwtService jwtService;

    public RecommendController(RecommendService recommendService, JwtService jwtService) {
        this.recommendService = recommendService;
        this.jwtService = jwtService;
    }

    @GetMapping("/users")
    public List<RecommendUserResponse> recommendUsers(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        Long viewerId = jwt == null ? null : jwtService.extractUserId(jwt);
        return recommendService.recommendUsers(viewerId, limit);
    }

    @GetMapping("/circles")
    public List<RecommendCircleResponse> recommendCircles(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        Long viewerId = jwt == null ? null : jwtService.extractUserId(jwt);
        return recommendService.recommendCircles(viewerId, limit);
    }
}

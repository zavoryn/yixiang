package com.tongji.circle.api;

import com.tongji.auth.token.JwtService;
import com.tongji.circle.api.dto.*;
import com.tongji.circle.service.CircleService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/circles")
public class CircleController {

    private final CircleService circleService;
    private final JwtService jwtService;

    public CircleController(CircleService circleService, JwtService jwtService) {
        this.circleService = circleService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public CircleResponse list(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt) {
        Long uid = jwt != null ? jwtService.extractUserId(jwt) : null;
        return circleService.list(category, keyword, page, Math.min(size, 50), uid);
    }

    @PostMapping
    public Map<String, Long> create(@Valid @RequestBody CircleCreateRequest request,
                                    @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        long id = circleService.create(uid, request);
        return Map.of("id", id);
    }

    @GetMapping("/{id}")
    public CircleDetailResponse detail(@PathVariable long id,
                                       @AuthenticationPrincipal Jwt jwt) {
        Long uid = jwt != null ? jwtService.extractUserId(jwt) : null;
        return circleService.detail(id, uid);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable long id,
                                       @Valid @RequestBody CirclePatchRequest request,
                                       @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.update(uid, id, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/joined")
    public List<CircleSummaryResponse> joined(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return circleService.joined(uid);
    }
}

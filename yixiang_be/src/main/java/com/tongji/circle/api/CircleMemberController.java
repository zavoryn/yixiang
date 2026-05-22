package com.tongji.circle.api;

import com.tongji.auth.token.JwtService;
import com.tongji.circle.api.dto.CircleMemberListResponse;
import com.tongji.circle.service.CircleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/circles/{circleId}")
public class CircleMemberController {

    private final CircleService circleService;
    private final JwtService jwtService;

    public CircleMemberController(CircleService circleService, JwtService jwtService) {
        this.circleService = circleService;
        this.jwtService = jwtService;
    }

    @PostMapping("/join")
    public ResponseEntity<Void> join(@PathVariable long circleId,
                                     @RequestParam(value = "reason", required = false) String reason,
                                     @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.join(uid, circleId, reason);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/members/me")
    public ResponseEntity<Void> leave(@PathVariable long circleId,
                                      @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.leave(uid, circleId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/members/{userId}/approve")
    public ResponseEntity<Void> approve(@PathVariable long circleId,
                                        @PathVariable long userId,
                                        @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.approveMember(uid, circleId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/posts/{postId}/feature")
    public ResponseEntity<Void> feature(@PathVariable long circleId,
                                        @PathVariable long postId,
                                        @RequestParam(value = "featured", defaultValue = "true") boolean featured,
                                        @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        circleService.featurePost(uid, circleId, postId, featured);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/members")
    public CircleMemberListResponse listMembers(
            @PathVariable long circleId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return circleService.listMembers(circleId, page, size);
    }
}

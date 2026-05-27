package com.tongji.draft.api;

import com.tongji.auth.token.JwtService;
import com.tongji.draft.api.dto.DraftCreateRequest;
import com.tongji.draft.api.dto.DraftPatchRequest;
import com.tongji.draft.api.dto.DraftResponse;
import com.tongji.draft.service.DraftService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/drafts")
public class DraftController {

    private final DraftService draftService;
    private final JwtService jwtService;

    public DraftController(DraftService draftService, JwtService jwtService) {
        this.draftService = draftService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public List<DraftResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return draftService.listMine(jwtService.extractUserId(jwt));
    }

    @PostMapping
    public DraftResponse create(@RequestBody DraftCreateRequest req, @AuthenticationPrincipal Jwt jwt) {
        return draftService.create(jwtService.extractUserId(jwt), req);
    }

    @GetMapping("/{id}")
    public DraftResponse get(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        return draftService.get(jwtService.extractUserId(jwt), id);
    }

    @PutMapping("/{id}")
    public DraftResponse update(@PathVariable long id,
                                @RequestBody DraftPatchRequest req,
                                @AuthenticationPrincipal Jwt jwt) {
        return draftService.update(jwtService.extractUserId(jwt), id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        draftService.delete(jwtService.extractUserId(jwt), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public Map<String, String> publish(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        long postId = draftService.publish(jwtService.extractUserId(jwt), id);
        return Map.of("postId", String.valueOf(postId));
    }
}

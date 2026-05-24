package com.tongji.counter.favorite;

import com.tongji.auth.token.JwtService;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/favorites")
@Validated
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final JwtService jwtService;

    public FavoriteController(FavoriteService favoriteService, JwtService jwtService) {
        this.favoriteService = favoriteService;
        this.jwtService = jwtService;
    }

    @GetMapping
    public FavoritesResponse list(
            @RequestParam(value = "cursor", required = false) Long cursor,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return favoriteService.list(uid, cursor, Math.min(size, 50), folderId);
    }

    @GetMapping("/stats")
    public FavoriteStatsResponse stats(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return favoriteService.stats(uid);
    }

    @GetMapping("/folders")
    public List<FavoriteFolderDto> listFolders(@AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        return favoriteService.listFolders(uid);
    }

    @PostMapping("/folders")
    public Map<String, Long> createFolder(
            @RequestParam("name") @NotBlank @Size(max = 50) String name,
            @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        long id = favoriteService.createFolder(uid, name);
        return Map.of("id", id);
    }

    @DeleteMapping("/folders/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable long id,
                                             @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        favoriteService.deleteFolder(uid, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/posts/{postId}/folder")
    public ResponseEntity<Void> assignFolder(@PathVariable long postId,
                                             @RequestParam(value = "folderId", required = false) Long folderId,
                                             @AuthenticationPrincipal Jwt jwt) {
        long uid = jwtService.extractUserId(jwt);
        favoriteService.assignFolder(uid, postId, folderId);
        return ResponseEntity.noContent().build();
    }
}

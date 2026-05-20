package com.tongji.comment.api;

import com.tongji.auth.token.JwtService;
import com.tongji.comment.api.dto.CommentListResponse;
import com.tongji.comment.api.dto.CreateCommentRequest;
import com.tongji.comment.service.CommentService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/comment")
public class CommentController {

    private final CommentService commentService;
    private final JwtService jwtService;

    public CommentController(CommentService commentService, JwtService jwtService) {
        this.commentService = commentService;
        this.jwtService = jwtService;
    }

    @PostMapping
    public Long create(@AuthenticationPrincipal Jwt jwt, @RequestBody CreateCommentRequest request) {
        long uid = jwtService.extractUserId(jwt);
        return commentService.create(uid, request);
    }

    @DeleteMapping("/{id}")
    public boolean delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        long uid = jwtService.extractUserId(jwt);
        return commentService.delete(uid, id);
    }

    @GetMapping("/list")
    public CommentListResponse list(@RequestParam Long postId,
                                     @RequestParam(required = false) String cursor,
                                     @RequestParam(defaultValue = "20") int size) {
        size = Math.min(Math.max(size, 1), 50);
        return commentService.listTopLevel(postId, cursor, size);
    }

    @GetMapping("/replies")
    public CommentListResponse replies(@RequestParam Long parentId,
                                        @RequestParam(required = false) String cursor,
                                        @RequestParam(defaultValue = "20") int size) {
        size = Math.min(Math.max(size, 1), 50);
        return commentService.listReplies(parentId, cursor, size);
    }
}

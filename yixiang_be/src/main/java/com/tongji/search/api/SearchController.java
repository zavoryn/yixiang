package com.tongji.search.api;

import com.tongji.auth.token.JwtService;
import com.tongji.circle.api.dto.CircleResponse;
import com.tongji.circle.service.CircleService;
import com.tongji.relation.mapper.RelationMapper;
import com.tongji.search.api.dto.SearchResponse;
import com.tongji.search.api.dto.SuggestResponse;
import com.tongji.search.api.dto.UserSearchItem;
import com.tongji.search.api.dto.UserSearchResponse;
import com.tongji.search.service.SearchService;
import com.tongji.topic.api.dto.TopicResponse;
import com.tongji.topic.mapper.TopicMapper;
import com.tongji.topic.model.Topic;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@Validated
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final RelationMapper relationMapper;
    private final TopicMapper topicMapper;
    private final CircleService circleService;

    /**
     * 关键词检索。
     * @param q 关键词（必填）
     * @param size 返回条数（默认 20，最小 1）
     * @param tagsCsv 标签过滤（逗号分隔，可选）
     * @param after 游标（Base64URL，可选）
     */
    @GetMapping
    public SearchResponse search(@RequestParam("q") @NotBlank String q,
                                 @RequestParam(value = "size", required = false, defaultValue = "20") @Min(1) int size,
                                 @RequestParam(value = "tags", required = false) String tagsCsv,
                                 @RequestParam(value = "after", required = false) String after,
                                 @AuthenticationPrincipal Jwt jwt) {
        Long userId = (jwt == null) ? null : jwtService.extractUserId(jwt);
        return searchService.search(q, size, tagsCsv, after, userId);
    }

    @GetMapping("/suggest")
    public SuggestResponse suggest(@RequestParam("prefix") @NotBlank String prefix,
                                   @RequestParam(value = "size", required = false, defaultValue = "10") @Min(1) int size) {
        return searchService.suggest(prefix, size);
    }

    @GetMapping("/users")
    public UserSearchResponse searchUsers(
            @RequestParam("q") @NotBlank String q,
            @RequestParam(value = "page", defaultValue = "1") @Min(1) int page,
            @RequestParam(value = "size", defaultValue = "20") @Min(1) int size) {
        int offset = (page - 1) * size;
        int querySize = size + 1;
        List<User> users = userMapper.searchByNickname(q, offset, querySize);
        boolean hasMore = users.size() > size;
        if (hasMore) users = users.subList(0, size);

        List<UserSearchItem> items = new ArrayList<>(users.size());
        for (User u : users) {
            int followerCount = relationMapper.countFollowerActive(u.getId());
            int followingCount = relationMapper.countFollowingActive(u.getId());
            items.add(new UserSearchItem(
                    u.getId(),
                    u.getNickname(),
                    u.getAvatar(),
                    Boolean.TRUE.equals(u.getVerified()),
                    u.getRoleTitle(),
                    followerCount,
                    followingCount
            ));
        }
        return new UserSearchResponse(items, hasMore);
    }

    @GetMapping("/topics")
    public List<TopicResponse> searchTopics(
            @RequestParam("q") @NotBlank String q,
            @RequestParam(value = "size", defaultValue = "20") @Min(1) int size) {
        List<Topic> topics = topicMapper.searchByKeyword(q, size);
        return topics.stream()
                .map(t -> new TopicResponse(
                        t.getTag(),
                        t.getPostCount() == null ? 0 : t.getPostCount(),
                        t.getViewCount() == null ? 0L : t.getViewCount()))
                .toList();
    }

    @GetMapping("/circles")
    public CircleResponse searchCircles(
            @RequestParam("q") @NotBlank String q,
            @RequestParam(value = "page", defaultValue = "1") @Min(1) int page,
            @RequestParam(value = "size", defaultValue = "20") @Min(1) int size,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = (jwt == null) ? null : jwtService.extractUserId(jwt);
        return circleService.list(null, q, page, size, userId);
    }
}
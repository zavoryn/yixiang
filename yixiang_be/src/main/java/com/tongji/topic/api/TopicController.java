package com.tongji.topic.api;

import com.tongji.topic.api.dto.TopicPostListResponse;
import com.tongji.topic.api.dto.TopicResponse;
import com.tongji.topic.service.TopicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/topics")
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping("/hot")
    public List<TopicResponse> hot(@RequestParam(value = "limit", defaultValue = "20") int limit) {
        return topicService.listHot(limit);
    }

    @GetMapping("/{tag}/posts")
    public TopicPostListResponse posts(@PathVariable String tag,
                                       @RequestParam(value = "cursor", required = false) String cursor,
                                       @RequestParam(value = "size", defaultValue = "20") int size) {
        return topicService.listPostsByTag(tag, cursor, size);
    }

    @PostMapping("/{tag}/view")
    public ResponseEntity<Void> view(@PathVariable String tag) {
        topicService.recordView(tag);
        return ResponseEntity.accepted().build();
    }
}

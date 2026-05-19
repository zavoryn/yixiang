package com.tongji.hot.api;

import com.tongji.hot.api.dto.HotPostListResponse;
import com.tongji.hot.service.HotPeriod;
import com.tongji.hot.service.HotService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hot")
public class HotController {

    private final HotService hotService;

    public HotController(HotService hotService) {
        this.hotService = hotService;
    }

    @GetMapping("/posts")
    public HotPostListResponse hotPosts(
            @RequestParam(value = "period", required = false) String period,
            @RequestParam(value = "cursor", required = false) String cursor,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        return hotService.listHotPosts(HotPeriod.parse(period), cursor, size);
    }
}

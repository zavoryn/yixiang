package com.tongji.hot.service;

import com.tongji.hot.api.dto.HotPostListResponse;

public interface HotService {
    HotPostListResponse listHotPosts(HotPeriod period, String cursor, int size);
}

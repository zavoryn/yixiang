package com.tongji.topic.service;

import com.tongji.topic.api.dto.TopicPostListResponse;
import com.tongji.topic.api.dto.TopicResponse;

import java.util.List;

public interface TopicService {
    List<TopicResponse> listHot(int limit);
    TopicPostListResponse listPostsByTag(String tag, String cursor, int size);
    void recordView(String tag);
    void onPostCreated(List<String> tags);
}

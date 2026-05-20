package com.tongji.activity.service;

import com.tongji.activity.api.dto.ActivityListResponse;
import com.tongji.activity.model.Activity;

public interface ActivityService {
    void record(Activity activity);
    ActivityListResponse listFollowing(long viewerId, Long cursor, int size);
}

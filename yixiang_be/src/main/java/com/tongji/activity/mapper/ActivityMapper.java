package com.tongji.activity.mapper;

import com.tongji.activity.model.Activity;
import org.apache.ibatis.annotations.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface ActivityMapper {
    void insert(Activity activity);
    List<Activity> listByUsers(@Param("userIds") Collection<Long> userIds,
                               @Param("cursorId") Long cursorId,
                               @Param("limit") int limit);
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}

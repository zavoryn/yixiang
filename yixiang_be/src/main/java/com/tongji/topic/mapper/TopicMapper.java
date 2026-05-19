package com.tongji.topic.mapper;

import com.tongji.topic.model.Topic;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

public interface TopicMapper {
    List<Topic> listHot(@Param("limit") int limit);
    Topic findByTag(@Param("tag") String tag);
    void upsertOnPost(@Param("tag") String tag);
    void incrementViewBatch(@Param("deltas") Map<String, Long> deltas);
}

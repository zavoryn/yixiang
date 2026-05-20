package com.tongji.topic.job;

import com.tongji.topic.mapper.TopicMapper;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RKeys;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class TopicViewFlushJob {

    private static final Logger log = LoggerFactory.getLogger(TopicViewFlushJob.class);
    private static final String PREFIX = "topic:view:";

    private final RedissonClient redisson;
    private final TopicMapper topicMapper;

    public TopicViewFlushJob(RedissonClient redisson, TopicMapper topicMapper) {
        this.redisson = redisson;
        this.topicMapper = topicMapper;
    }

    @Scheduled(fixedDelay = 60_000L)
    public void flush() {
        RKeys keys = redisson.getKeys();
        Map<String, Long> deltas = new HashMap<>();
        for (String key : keys.getKeysByPattern(PREFIX + "*")) {
            RAtomicLong c = redisson.getAtomicLong(key);
            long v = c.getAndSet(0);
            if (v > 0) {
                String tag = key.substring(PREFIX.length());
                deltas.put(tag, v);
            }
        }
        if (!deltas.isEmpty()) {
            try {
                topicMapper.incrementViewBatch(deltas);
                log.info("topic view flush: {} tags", deltas.size());
            } catch (Exception e) {
                log.error("topic view flush failed; deltas dropped", e);
            }
        }
    }
}

package com.tongji.activity.job;

import com.tongji.activity.mapper.ActivityMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

@Component
public class ActivityArchiveJob {

    private static final Logger log = LoggerFactory.getLogger(ActivityArchiveJob.class);
    private static final Duration TTL = Duration.ofDays(90);

    private final ActivityMapper activityMapper;

    public ActivityArchiveJob(ActivityMapper activityMapper) {
        this.activityMapper = activityMapper;
    }

    @Scheduled(cron = "0 0 3 * * *")
    public void purge() {
        Instant cutoff = Instant.now().minus(TTL);
        try {
            int deleted = activityMapper.deleteOlderThan(cutoff);
            log.info("activity archive: deleted {} rows older than {}", deleted, cutoff);
        } catch (Exception e) {
            log.error("activity archive failed", e);
        }
    }
}

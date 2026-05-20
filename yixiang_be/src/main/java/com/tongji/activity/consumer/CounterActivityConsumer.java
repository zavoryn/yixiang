package com.tongji.activity.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.activity.model.Activity;
import com.tongji.activity.service.ActivityService;
import com.tongji.counter.event.CounterEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class CounterActivityConsumer {

    private static final Logger log = LoggerFactory.getLogger(CounterActivityConsumer.class);

    private final ObjectMapper objectMapper;
    private final ActivityService activityService;

    public CounterActivityConsumer(ObjectMapper objectMapper, ActivityService activityService) {
        this.objectMapper = objectMapper;
        this.activityService = activityService;
    }

    @KafkaListener(topics = "counter-events", groupId = "activity-counter")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            CounterEvent evt = objectMapper.readValue(message, CounterEvent.class);
            if (evt.getDelta() != 1) {
                ack.acknowledge();
                return;
            }
            String type;
            if ("like".equals(evt.getMetric())) type = "LIKE";
            else if ("favorite".equals(evt.getMetric())) type = "FAVORITE";
            else { ack.acknowledge(); return; }

            Activity a = Activity.builder()
                    .userId(evt.getUserId())
                    .type(type)
                    .targetType("POST")
                    .targetId(Long.parseLong(evt.getEntityId()))
                    .build();
            activityService.record(a);
            ack.acknowledge();
        } catch (Exception e) {
            log.warn("CounterActivityConsumer failed; ack to avoid poison pill", e);
            ack.acknowledge();
        }
    }
}

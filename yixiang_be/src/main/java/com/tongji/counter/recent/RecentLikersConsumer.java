package com.tongji.counter.recent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.counter.event.CounterEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class RecentLikersConsumer {

    private static final Logger log = LoggerFactory.getLogger(RecentLikersConsumer.class);

    private final ObjectMapper objectMapper;
    private final RecentLikersService recentLikersService;

    public RecentLikersConsumer(ObjectMapper objectMapper, RecentLikersService recentLikersService) {
        this.objectMapper = objectMapper;
        this.recentLikersService = recentLikersService;
    }

    @KafkaListener(topics = "counter-events", groupId = "recent-likers")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            CounterEvent evt = objectMapper.readValue(message, CounterEvent.class);
            if (!"like".equals(evt.getMetric())) {
                ack.acknowledge();
                return;
            }
            long postId = Long.parseLong(evt.getEntityId());
            long userId = evt.getUserId();
            if (evt.getDelta() == 1) {
                recentLikersService.addLiker(postId, userId);
            } else if (evt.getDelta() == -1) {
                recentLikersService.removeLiker(postId, userId);
            }
            ack.acknowledge();
        } catch (Exception e) {
            log.warn("RecentLikersConsumer failed; ack to skip", e);
            ack.acknowledge();
        }
    }
}

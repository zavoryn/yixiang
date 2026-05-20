package com.tongji.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.counter.event.CounterEvent;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import com.tongji.notification.model.Notification;
import com.tongji.notification.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class LikeNotificationConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final KnowPostMapper knowPostMapper;

    public LikeNotificationConsumer(ObjectMapper objectMapper,
                                    NotificationService notificationService,
                                    KnowPostMapper knowPostMapper) {
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
        this.knowPostMapper = knowPostMapper;
    }

    @KafkaListener(topics = "counter-events", groupId = "notification-like")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            CounterEvent evt = objectMapper.readValue(message, CounterEvent.class);
            if (!"like".equals(evt.getMetric()) || evt.getDelta() != 1) {
                ack.acknowledge();
                return;
            }
            KnowPost post = knowPostMapper.findById(Long.parseLong(evt.getEntityId()));
            if (post == null || post.getCreatorId() == null) {
                ack.acknowledge();
                return;
            }
            if (post.getCreatorId() == evt.getUserId()) {
                ack.acknowledge();
                return;
            }
            Notification n = new Notification();
            n.setRecipientId(post.getCreatorId());
            n.setActorId(evt.getUserId());
            n.setType("LIKE");
            n.setEntityType("POST");
            n.setEntityId(Long.parseLong(evt.getEntityId()));
            n.setContent("点赞了你的帖子");
            notificationService.create(n);
            ack.acknowledge();
        } catch (Exception e) {
            // 不 ack，让 Kafka 重试
        }
    }
}

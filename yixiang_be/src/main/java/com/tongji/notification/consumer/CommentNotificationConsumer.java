package com.tongji.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.comment.event.CommentEvent;
import com.tongji.comment.event.CommentTopics;
import com.tongji.notification.model.Notification;
import com.tongji.notification.service.NotificationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

@Service
public class CommentNotificationConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public CommentNotificationConsumer(ObjectMapper objectMapper,
                                       NotificationService notificationService) {
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = CommentTopics.EVENTS, groupId = "notification-comment")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            CommentEvent evt = objectMapper.readValue(message, CommentEvent.class);
            Notification n = new Notification();
            n.setRecipientId(evt.postAuthorId());
            n.setActorId(evt.commenterId());
            n.setType("COMMENT");
            n.setEntityType("POST");
            n.setEntityId(evt.postId());
            n.setContent(evt.contentSnippet());
            notificationService.create(n);
            ack.acknowledge();
        } catch (Exception e) {
            // 不 ack，让 Kafka 重试
        }
    }
}

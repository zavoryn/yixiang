package com.tongji.notification.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.common.util.OutboxMessageUtil;
import com.tongji.notification.model.Notification;
import com.tongji.notification.service.NotificationService;
import com.tongji.relation.event.RelationEvent;
import com.tongji.relation.outbox.OutboxTopics;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FollowNotificationConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    public FollowNotificationConsumer(ObjectMapper objectMapper,
                                      NotificationService notificationService) {
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
    }

    @KafkaListener(topics = OutboxTopics.CANAL_OUTBOX, groupId = "notification-follow")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            List<JsonNode> rows = OutboxMessageUtil.extractRows(objectMapper, message);
            for (JsonNode row : rows) {
                JsonNode payloadNode = row.get("payload");
                if (payloadNode == null) continue;
                RelationEvent evt = objectMapper.readValue(payloadNode.asText(), RelationEvent.class);
                if (!"FOLLOW".equals(evt.type())) continue;

                Notification n = new Notification();
                n.setRecipientId(evt.toUserId());
                n.setActorId(evt.fromUserId());
                n.setType("FOLLOW");
                n.setEntityType(null);
                n.setEntityId(null);
                n.setContent("关注了你");
                notificationService.create(n);
            }
            ack.acknowledge();
        } catch (Exception e) {
            // 不 ack，让 Kafka 重试
        }
    }
}

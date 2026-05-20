package com.tongji.activity.consumer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.activity.model.Activity;
import com.tongji.activity.service.ActivityService;
import com.tongji.common.util.OutboxMessageUtil;
import com.tongji.relation.event.RelationEvent;
import com.tongji.relation.outbox.OutboxTopics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RelationActivityConsumer {

    private static final Logger log = LoggerFactory.getLogger(RelationActivityConsumer.class);

    private final ObjectMapper objectMapper;
    private final ActivityService activityService;

    public RelationActivityConsumer(ObjectMapper objectMapper, ActivityService activityService) {
        this.objectMapper = objectMapper;
        this.activityService = activityService;
    }

    @KafkaListener(topics = OutboxTopics.CANAL_OUTBOX, groupId = "activity-relation")
    public void onMessage(String message, Acknowledgment ack) {
        try {
            List<JsonNode> rows = OutboxMessageUtil.extractRows(objectMapper, message);
            for (JsonNode row : rows) {
                JsonNode payloadNode = row.get("payload");
                if (payloadNode == null) continue;
                RelationEvent evt = objectMapper.readValue(payloadNode.asText(), RelationEvent.class);
                if (!"FOLLOW".equals(evt.type())) continue;

                Activity a = Activity.builder()
                        .userId(evt.fromUserId())
                        .type("FOLLOW")
                        .targetType("USER")
                        .targetId(evt.toUserId())
                        .build();
                activityService.record(a);
            }
            ack.acknowledge();
        } catch (Exception e) {
            log.warn("RelationActivityConsumer failed; ack", e);
            ack.acknowledge();
        }
    }
}

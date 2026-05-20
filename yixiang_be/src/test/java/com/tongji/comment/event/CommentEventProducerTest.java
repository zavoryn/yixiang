package com.tongji.comment.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.kafka.core.KafkaTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class CommentEventProducerTest {

    @Test
    void publishSerializesEventToCorrectTopic() throws Exception {
        KafkaTemplate<String, String> kafka = mock(KafkaTemplate.class);
        ObjectMapper mapper = new ObjectMapper();
        CommentEventProducer producer = new CommentEventProducer(kafka, mapper);

        CommentEvent event = new CommentEvent(1L, 2L, 3L, 4L, "测试评论内容");
        producer.publish(event);

        ArgumentCaptor<String> topicCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> payloadCaptor = ArgumentCaptor.forClass(String.class);
        verify(kafka).send(topicCaptor.capture(), payloadCaptor.capture());

        assertThat(topicCaptor.getValue()).isEqualTo("comment-events");
        assertThat(payloadCaptor.getValue()).contains("\"commentId\":1");
        assertThat(payloadCaptor.getValue()).contains("\"postAuthorId\":3");
    }
}

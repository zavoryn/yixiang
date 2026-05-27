package com.tongji.knowpost.api;

import com.tongji.llm.rag.RagIndexService;
import com.tongji.llm.rag.RagQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class KnowPostRagControllerTest {

    @Test
    void qaStreamEmitsMessageEventsAndTerminalDoneEvent() {
        RagIndexService indexService = mock(RagIndexService.class);
        RagQueryService queryService = mock(RagQueryService.class);
        when(queryService.streamAnswerFlux(42L, "问题", 5, 1024))
                .thenReturn(Flux.just("第一段", "第二段"));

        KnowPostRagController controller = new KnowPostRagController(indexService, queryService);

        List<ServerSentEvent<String>> events = controller.qaStream(42L, "问题", 5, 1024)
                .collectList()
                .block();

        assertThat(events).hasSize(3);
        assertThat(events).extracting(ServerSentEvent::event)
                .containsExactly("message", "message", "done");
        assertThat(events).extracting(ServerSentEvent::data)
                .containsExactly("第一段", "第二段", "");
    }
}

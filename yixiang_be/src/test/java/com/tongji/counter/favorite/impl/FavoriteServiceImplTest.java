package com.tongji.counter.favorite.impl;

import com.tongji.counter.favorite.FavoriteMapper;
import com.tongji.knowpost.mapper.KnowPostMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FavoriteServiceImplTest {

    private final FavoriteMapper mapper = mock(FavoriteMapper.class);
    private final KnowPostMapper knowPostMapper = mock(KnowPostMapper.class);
    private final FavoriteServiceImpl service = new FavoriteServiceImpl(mapper, knowPostMapper);

    @Test
    void addInsertsRow() {
        service.add(1L, 100L);
        verify(mapper).insert(anyLong(), eq(1L), eq(100L));
    }

    @Test
    void removeDeletesRow() {
        service.remove(1L, 100L);
        verify(mapper).delete(1L, 100L);
    }

    @Test
    void listReturnsEmptyWhenNoFavorites() {
        when(mapper.listPostIds(anyLong(), any(), anyInt())).thenReturn(List.of());
        var result = service.list(1L, null, 20);
        assertThat(result.items()).isEmpty();
        assertThat(result.hasMore()).isFalse();
        assertThat(result.nextCursor()).isNull();
    }
}

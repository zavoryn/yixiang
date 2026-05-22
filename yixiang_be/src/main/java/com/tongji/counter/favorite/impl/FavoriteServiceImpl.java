package com.tongji.counter.favorite.impl;

import com.tongji.counter.favorite.FavoriteMapper;
import com.tongji.counter.favorite.FavoriteService;
import com.tongji.counter.favorite.FavoritesResponse;
import com.tongji.knowpost.api.dto.FeedItemResponse;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.knowpost.model.KnowPost;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteMapper mapper;
    private final KnowPostMapper knowPostMapper;

    public FavoriteServiceImpl(FavoriteMapper mapper, KnowPostMapper knowPostMapper) {
        this.mapper = mapper;
        this.knowPostMapper = knowPostMapper;
    }

    @Override
    public void add(long userId, long postId) {
        mapper.insert(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE), userId, postId);
    }

    @Override
    public void remove(long userId, long postId) {
        mapper.delete(userId, postId);
    }

    @Override
    public FavoritesResponse list(long userId, Long cursor, int size) {
        int querySize = size + 1;
        List<Long> ids = mapper.listPostIds(userId, cursor, querySize);
        boolean hasMore = ids.size() > size;
        if (hasMore) ids = ids.subList(0, size);

        List<FeedItemResponse> items = new ArrayList<>();
        for (Long id : ids) {
            KnowPost post = knowPostMapper.findById(id);
            if (post == null) continue;
            items.add(new FeedItemResponse(
                    String.valueOf(post.getId()),
                    post.getTitle(),
                    post.getDescription(),
                    null,
                    null,
                    null,
                    null,
                    post.getTags(),
                    null, null, null,
                    null,
                    Boolean.TRUE,
                    post.getIsTop(),
                    java.util.Collections.emptyList(), "",
                    null
            ));
        }

        Long nextCursor = hasMore && !ids.isEmpty() ? ids.get(ids.size() - 1) : null;
        return new FavoritesResponse(items, nextCursor, hasMore);
    }
}

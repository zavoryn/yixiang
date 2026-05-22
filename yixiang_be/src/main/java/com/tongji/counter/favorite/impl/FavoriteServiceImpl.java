package com.tongji.counter.favorite.impl;

import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.counter.favorite.FavoriteFolder;
import com.tongji.counter.favorite.FavoriteFolderDto;
import com.tongji.counter.favorite.FavoriteFolderMapper;
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
    private final FavoriteFolderMapper folderMapper;
    private final KnowPostMapper knowPostMapper;

    public FavoriteServiceImpl(FavoriteMapper mapper, FavoriteFolderMapper folderMapper, KnowPostMapper knowPostMapper) {
        this.mapper = mapper;
        this.folderMapper = folderMapper;
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

    @Override
    public long createFolder(long userId, String name) {
        if (folderMapper.countByUser(userId) >= 20) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "收藏夹数量已达上限（20个）");
        }
        long id = ThreadLocalRandom.current().nextLong(Long.MAX_VALUE);
        folderMapper.insert(id, userId, name);
        return id;
    }

    @Override
    public List<FavoriteFolderDto> listFolders(long userId) {
        List<FavoriteFolder> folders = folderMapper.listByUser(userId);
        List<FavoriteFolderDto> result = new ArrayList<>(folders.size());
        for (FavoriteFolder f : folders) {
            result.add(new FavoriteFolderDto(f.getId(), f.getName()));
        }
        return result;
    }

    @Override
    public void deleteFolder(long userId, long folderId) {
        mapper.unassignFolder(userId, folderId);
        folderMapper.deleteById(folderId, userId);
    }

    @Override
    public void assignFolder(long userId, long postId, Long folderId) {
        mapper.assignFolder(userId, postId, folderId);
    }
}

package com.tongji.counter.favorite;

import java.util.List;

public interface FavoriteService {
    void add(long userId, long postId);
    void remove(long userId, long postId);
    FavoritesResponse list(long userId, Long cursor, int size);

    long createFolder(long userId, String name);
    List<FavoriteFolderDto> listFolders(long userId);
    void deleteFolder(long userId, long folderId);
    void assignFolder(long userId, long postId, Long folderId);
}

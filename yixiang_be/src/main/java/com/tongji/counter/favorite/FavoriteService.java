package com.tongji.counter.favorite;

public interface FavoriteService {
    void add(long userId, long postId);
    void remove(long userId, long postId);
    FavoritesResponse list(long userId, Long cursor, int size);
}

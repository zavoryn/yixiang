package com.tongji.counter.favorite;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FavoriteMapper {
    void insert(@Param("id") long id,
                @Param("userId") long userId,
                @Param("postId") long postId);

    void delete(@Param("userId") long userId,
                @Param("postId") long postId);

    List<Long> listPostIds(@Param("userId") long userId,
                           @Param("lastId") Long lastId,
                           @Param("size") int size);
}

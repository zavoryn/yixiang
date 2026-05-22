package com.tongji.counter.favorite;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FavoriteFolderMapper {
    void insert(@Param("id") long id, @Param("userId") long userId, @Param("name") String name);
    List<FavoriteFolder> listByUser(@Param("userId") long userId);
    int deleteById(@Param("id") long id, @Param("userId") long userId);
    int countByUser(@Param("userId") long userId);
}

package com.tongji.circle.mapper;

import com.tongji.circle.model.Circle;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CircleMapper {
    void insert(Circle circle);
    Circle findById(@Param("id") long id);
    int update(Circle circle);
    List<Circle> list(@Param("category") String category,
                      @Param("keyword") String keyword,
                      @Param("offset") int offset,
                      @Param("size") int size);
    int count(@Param("category") String category, @Param("keyword") String keyword);
    List<Circle> listJoined(@Param("userId") long userId);
    int incrementMemberCount(@Param("id") long id, @Param("delta") int delta);
    int incrementPostCount(@Param("id") long id, @Param("delta") int delta);
}

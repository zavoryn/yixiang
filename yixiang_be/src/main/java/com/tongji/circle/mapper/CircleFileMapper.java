package com.tongji.circle.mapper;

import com.tongji.circle.model.CircleFile;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CircleFileMapper {
    void insert(CircleFile file);
    List<CircleFile> listByCircle(@Param("circleId") long circleId, @Param("limit") int limit);
    CircleFile findById(@Param("id") long id);
    void deleteById(@Param("id") long id);
}

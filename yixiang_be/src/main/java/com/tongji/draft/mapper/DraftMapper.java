package com.tongji.draft.mapper;

import com.tongji.draft.model.Draft;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DraftMapper {
    void insert(Draft draft);
    Draft findById(@Param("id") long id);
    List<Draft> listByUser(@Param("userId") long userId);
    void update(Draft draft);
    int delete(@Param("id") long id, @Param("userId") long userId);
}

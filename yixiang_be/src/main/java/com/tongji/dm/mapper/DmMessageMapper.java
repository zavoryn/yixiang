package com.tongji.dm.mapper;

import com.tongji.dm.model.DmMessage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface DmMessageMapper {
    void insert(DmMessage msg);
    List<DmMessage> listByConv(@Param("convId") long convId,
                               @Param("beforeId") Long beforeId,
                               @Param("size") int size);
}

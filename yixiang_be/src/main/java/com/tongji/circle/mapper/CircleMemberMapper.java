package com.tongji.circle.mapper;

import com.tongji.circle.model.CircleMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CircleMemberMapper {
    void insert(CircleMember member);
    CircleMember findByCircleAndUser(@Param("circleId") long circleId, @Param("userId") long userId);
    List<CircleMember> listActiveMembers(@Param("circleId") long circleId,
                                         @Param("offset") int offset,
                                         @Param("size") int size);
    int updateStatus(@Param("circleId") long circleId,
                     @Param("userId") long userId,
                     @Param("status") String status);
    int delete(@Param("circleId") long circleId, @Param("userId") long userId);
    int countActive(@Param("circleId") long circleId);
}

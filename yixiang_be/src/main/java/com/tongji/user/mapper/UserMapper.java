package com.tongji.user.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.tongji.user.domain.User;
import java.util.Collection;
import java.util.List;

@Mapper
public interface UserMapper {

    User findByPhone(@Param("phone") String phone);

    User findByEmail(@Param("email") String email);

    boolean existsByPhone(@Param("phone") String phone);

    boolean existsByEmail(@Param("email") String email);

    void insert(User user);

    User findById(@Param("id") Long id);

    void updatePassword(@Param("id") Long id, @Param("passwordHash") String passwordHash);

    void updateProfile(User user);

    boolean existsByZgIdExceptId(@Param("zgId") String zgId, @Param("excludeId") Long excludeId);

    List<User> listByIds(@Param("ids") List<Long> ids);

    List<User> listSummariesByIds(@Param("ids") Collection<Long> ids);

    List<Long> findTopFollowedUserIds(@Param("limit") int limit, @Param("excludeIds") Collection<Long> excludeIds);

    List<User> searchByNickname(@Param("keyword") String keyword, @Param("offset") int offset, @Param("size") int size);

    int countByNickname(@Param("keyword") String keyword);
}

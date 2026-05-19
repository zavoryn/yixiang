package com.tongji.circle.service.impl;

import com.tongji.activity.service.ActivityService;
import com.tongji.circle.api.dto.CircleMemberListResponse;
import com.tongji.circle.mapper.CircleMapper;
import com.tongji.circle.mapper.CircleMemberMapper;
import com.tongji.circle.model.Circle;
import com.tongji.circle.model.CircleMember;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import com.tongji.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CircleServiceImplListMembersTest {

    @Mock CircleMapper circleMapper;
    @Mock CircleMemberMapper memberMapper;
    @Mock UserService userService;
    @Mock KnowPostMapper knowPostMapper;
    @Mock ActivityService activityService;
    @Mock UserMapper userMapper;

    @Test
    void listMembers_returnsItemsInRoleOrder_withHasMore() {
        Circle c = new Circle();
        c.setId(1L);
        c.setStatus("ACTIVE");
        when(circleMapper.findById(1L)).thenReturn(c);

        CircleMember owner = member(10L, 1L, "OWNER");
        CircleMember m1 = member(20L, 1L, "MEMBER");
        CircleMember m2 = member(30L, 1L, "MEMBER");
        // page=1, size=2 => offset=0, safeSize+1=3
        when(memberMapper.listActiveMembers(eq(1L), eq(0), eq(3)))
                .thenReturn(List.of(owner, m1, m2));
        when(memberMapper.countActive(1L)).thenReturn(3);

        when(userMapper.listSummariesByIds(any()))
                .thenReturn(List.of(user(10L, "alice"), user(20L, "bob"), user(30L, "carol")));

        CircleServiceImpl service = new CircleServiceImpl(
                circleMapper, memberMapper, userService, knowPostMapper, activityService, userMapper);

        CircleMemberListResponse resp = service.listMembers(1L, 1, 2);

        assertThat(resp.items()).hasSize(2);
        assertThat(resp.items().get(0).userId()).isEqualTo(10L);
        assertThat(resp.hasMore()).isTrue();
        assertThat(resp.total()).isEqualTo(3);
    }

    private static CircleMember member(long uid, long cid, String role) {
        CircleMember m = new CircleMember();
        m.setUserId(uid);
        m.setCircleId(cid);
        m.setRole(role);
        m.setStatus("ACTIVE");
        m.setJoinedAt(Instant.now());
        return m;
    }

    private static User user(long id, String nick) {
        User u = new User();
        u.setId(id);
        u.setNickname(nick);
        u.setAvatar("https://example.com/" + nick + ".png");
        return u;
    }
}

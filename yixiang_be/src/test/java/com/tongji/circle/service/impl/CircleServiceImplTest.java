package com.tongji.circle.service.impl;

import com.tongji.circle.api.dto.CircleCreateRequest;
import com.tongji.circle.mapper.CircleMapper;
import com.tongji.circle.mapper.CircleMemberMapper;
import com.tongji.circle.model.Circle;
import com.tongji.circle.model.CircleMember;
import com.tongji.common.exception.BusinessException;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.user.service.UserService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CircleServiceImplTest {

    private final CircleMapper circleMapper = mock(CircleMapper.class);
    private final CircleMemberMapper memberMapper = mock(CircleMemberMapper.class);
    private final UserService userService = mock(UserService.class);
    private final KnowPostMapper knowPostMapper = mock(KnowPostMapper.class);
    private final CircleServiceImpl service =
            new CircleServiceImpl(circleMapper, memberMapper, userService, knowPostMapper);

    @Test
    void createCircleInsertsCircleAndOwnerMember() {
        CircleCreateRequest req = new CircleCreateRequest("测试圈子", "简介", null, "投资", null);
        service.create(1L, req);

        verify(circleMapper).insert(argThat(c ->
                "测试圈子".equals(c.getName()) && c.getOwnerId() == 1L && "PUBLIC".equals(c.getVisibility())));
        verify(memberMapper).insert(argThat(m ->
                m.getUserId() == 1L && "OWNER".equals(m.getRole()) && "ACTIVE".equals(m.getStatus())));
    }

    @Test
    void joinPublicCircleAutoApproves() {
        Circle circle = new Circle();
        circle.setId(10L);
        circle.setVisibility("PUBLIC");
        when(circleMapper.findById(10L)).thenReturn(circle);
        when(memberMapper.findByCircleAndUser(10L, 2L)).thenReturn(null);

        service.join(2L, 10L, null);

        verify(memberMapper).insert(argThat(m -> "ACTIVE".equals(m.getStatus())));
        verify(circleMapper).incrementMemberCount(10L, 1);
    }

    @Test
    void joinPrivateCircleCreatesPendingMember() {
        Circle circle = new Circle();
        circle.setId(10L);
        circle.setVisibility("PRIVATE");
        when(circleMapper.findById(10L)).thenReturn(circle);
        when(memberMapper.findByCircleAndUser(10L, 2L)).thenReturn(null);

        service.join(2L, 10L, "申请加入");

        verify(memberMapper).insert(argThat(m -> "PENDING".equals(m.getStatus())));
        verify(circleMapper, never()).incrementMemberCount(anyLong(), anyInt());
    }

    @Test
    void joinThrowsIfAlreadyActiveMember() {
        Circle circle = new Circle();
        circle.setId(10L);
        circle.setVisibility("PUBLIC");
        when(circleMapper.findById(10L)).thenReturn(circle);
        CircleMember existing = new CircleMember();
        existing.setStatus("ACTIVE");
        when(memberMapper.findByCircleAndUser(10L, 2L)).thenReturn(existing);

        assertThatThrownBy(() -> service.join(2L, 10L, null))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void approveChangesPendingToActive() {
        Circle circle = new Circle();
        circle.setId(10L);
        circle.setOwnerId(1L);
        when(circleMapper.findById(10L)).thenReturn(circle);
        CircleMember ownerMember = new CircleMember();
        ownerMember.setRole("OWNER");
        ownerMember.setStatus("ACTIVE");
        when(memberMapper.findByCircleAndUser(10L, 1L)).thenReturn(ownerMember);
        CircleMember pending = new CircleMember();
        pending.setStatus("PENDING");
        when(memberMapper.findByCircleAndUser(10L, 3L)).thenReturn(pending);

        service.approveMember(1L, 10L, 3L);

        verify(memberMapper).updateStatus(10L, 3L, "ACTIVE");
        verify(circleMapper).incrementMemberCount(10L, 1);
    }
}

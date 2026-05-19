package com.tongji.circle.service.impl;

import com.tongji.circle.api.dto.*;
import com.tongji.circle.mapper.CircleMapper;
import com.tongji.circle.mapper.CircleMemberMapper;
import com.tongji.circle.model.Circle;
import com.tongji.circle.model.CircleMember;
import com.tongji.circle.service.CircleService;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.knowpost.mapper.KnowPostMapper;
import com.tongji.activity.model.Activity;
import com.tongji.activity.service.ActivityService;
import com.tongji.user.domain.User;
import com.tongji.user.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class CircleServiceImpl implements CircleService {

    private final CircleMapper circleMapper;
    private final CircleMemberMapper memberMapper;
    private final UserService userService;
    private final KnowPostMapper knowPostMapper;
    private final ActivityService activityService;

    public CircleServiceImpl(CircleMapper circleMapper,
                             CircleMemberMapper memberMapper,
                             UserService userService,
                             KnowPostMapper knowPostMapper,
                             ActivityService activityService) {
        this.circleMapper = circleMapper;
        this.memberMapper = memberMapper;
        this.userService = userService;
        this.knowPostMapper = knowPostMapper;
        this.activityService = activityService;
    }

    @Override
    @Transactional
    public long create(long userId, CircleCreateRequest req) {
        Circle circle = new Circle();
        circle.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        circle.setName(req.name());
        circle.setDescription(req.description());
        circle.setAvatarUrl(req.avatarUrl());
        circle.setCategory(req.category());
        circle.setVisibility(req.visibility() != null ? req.visibility().toUpperCase() : "PUBLIC");
        circle.setStatus("ACTIVE");
        circle.setOwnerId(userId);
        circle.setMemberCount(1);
        circle.setPostCount(0);
        circleMapper.insert(circle);

        CircleMember owner = new CircleMember();
        owner.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        owner.setCircleId(circle.getId());
        owner.setUserId(userId);
        owner.setRole("OWNER");
        owner.setStatus("ACTIVE");
        memberMapper.insert(owner);

        return circle.getId();
    }

    @Override
    public CircleDetailResponse detail(long circleId, Long viewerId) {
        Circle circle = requireCircle(circleId);
        boolean joined = viewerId != null && isMember(viewerId, circleId);

        if ("PRIVATE".equals(circle.getVisibility()) && !joined) {
            throw new BusinessException(ErrorCode.NOT_CIRCLE_MEMBER);
        }

        String myRole = null;
        if (viewerId != null) {
            CircleMember m = memberMapper.findByCircleAndUser(circleId, viewerId);
            if (m != null && "ACTIVE".equals(m.getStatus())) myRole = m.getRole();
        }

        List<CircleMember> topMembersRaw = memberMapper.listActiveMembers(circleId, 0, 6);
        List<CircleDetailResponse.MemberSummary> topMembers = topMembersRaw.stream().map(m -> {
            User u = userService.findById(m.getUserId()).orElse(null);
            return new CircleDetailResponse.MemberSummary(
                    m.getUserId(),
                    u != null ? u.getNickname() : "用户" + m.getUserId(),
                    u != null ? u.getAvatar() : null,
                    m.getRole()
            );
        }).toList();

        return new CircleDetailResponse(
                circle.getId(), circle.getName(), circle.getDescription(),
                circle.getAvatarUrl(), circle.getCategory(), circle.getVisibility(),
                circle.getMemberCount(), circle.getPostCount(), circle.getCreatedAt(),
                joined, myRole, topMembers
        );
    }

    @Override
    public CircleResponse list(String category, String keyword, int page, int size, Long viewerId) {
        int offset = page * size;
        List<Circle> circles = circleMapper.list(
                (category != null && !category.isBlank()) ? category : null,
                (keyword != null && !keyword.isBlank()) ? keyword : null,
                offset, size);
        int total = circleMapper.count(
                (category != null && !category.isBlank()) ? category : null,
                (keyword != null && !keyword.isBlank()) ? keyword : null);

        List<CircleSummaryResponse> items = circles.stream().map(c -> {
            boolean joined = viewerId != null && isMember(viewerId, c.getId());
            return toSummary(c, joined);
        }).toList();

        return new CircleResponse(items, total, page, size);
    }

    @Override
    @Transactional
    public void update(long userId, long circleId, CirclePatchRequest req) {
        Circle circle = requireCircle(circleId);
        requireOwnerOrAdmin(userId, circleId);
        if (req.name() != null) circle.setName(req.name());
        if (req.description() != null) circle.setDescription(req.description());
        if (req.avatarUrl() != null) circle.setAvatarUrl(req.avatarUrl());
        if (req.category() != null) circle.setCategory(req.category());
        if (req.visibility() != null) circle.setVisibility(req.visibility().toUpperCase());
        circleMapper.update(circle);
    }

    @Override
    @Transactional
    public void join(long userId, long circleId, String applyReason) {
        Circle circle = requireCircle(circleId);
        CircleMember existing = memberMapper.findByCircleAndUser(circleId, userId);
        if (existing != null && "ACTIVE".equals(existing.getStatus())) {
            throw new BusinessException(ErrorCode.ALREADY_CIRCLE_MEMBER);
        }

        CircleMember member = new CircleMember();
        member.setId(ThreadLocalRandom.current().nextLong(Long.MAX_VALUE));
        member.setCircleId(circleId);
        member.setUserId(userId);
        member.setRole("MEMBER");

        if ("PUBLIC".equals(circle.getVisibility())) {
            member.setStatus("ACTIVE");
            memberMapper.insert(member);
            circleMapper.incrementMemberCount(circleId, 1);
            activityService.record(Activity.builder()
                    .userId(userId)
                    .type("JOIN_CIRCLE")
                    .targetType("CIRCLE")
                    .targetId(circleId)
                    .build());
        } else {
            member.setStatus("PENDING");
            memberMapper.insert(member);
        }
    }

    @Override
    @Transactional
    public void leave(long userId, long circleId) {
        Circle circle = requireCircle(circleId);
        if (circle.getOwnerId() != null && circle.getOwnerId() == userId) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        CircleMember member = memberMapper.findByCircleAndUser(circleId, userId);
        if (member == null || !"ACTIVE".equals(member.getStatus())) {
            throw new BusinessException(ErrorCode.NOT_CIRCLE_MEMBER);
        }
        memberMapper.delete(circleId, userId);
        circleMapper.incrementMemberCount(circleId, -1);
    }

    @Override
    @Transactional
    public void approveMember(long operatorId, long circleId, long targetUserId) {
        requireOwnerOrAdmin(operatorId, circleId);
        CircleMember member = memberMapper.findByCircleAndUser(circleId, targetUserId);
        if (member == null || !"PENDING".equals(member.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        memberMapper.updateStatus(circleId, targetUserId, "ACTIVE");
        circleMapper.incrementMemberCount(circleId, 1);
        activityService.record(Activity.builder()
                .userId(targetUserId)
                .type("JOIN_CIRCLE")
                .targetType("CIRCLE")
                .targetId(circleId)
                .build());
    }

    @Override
    public void featurePost(long operatorId, long circleId, long postId, boolean featured) {
        requireOwnerOrAdmin(operatorId, circleId);
        knowPostMapper.setFeatured(postId, circleId, featured ? 1 : 0);
    }

    @Override
    public List<CircleSummaryResponse> joined(long userId) {
        return circleMapper.listJoined(userId).stream()
                .map(c -> toSummary(c, true))
                .toList();
    }

    @Override
    public boolean isMember(long userId, long circleId) {
        CircleMember m = memberMapper.findByCircleAndUser(circleId, userId);
        return m != null && "ACTIVE".equals(m.getStatus());
    }

    private Circle requireCircle(long circleId) {
        Circle circle = circleMapper.findById(circleId);
        if (circle == null) throw new BusinessException(ErrorCode.CIRCLE_NOT_FOUND);
        return circle;
    }

    private void requireOwnerOrAdmin(long userId, long circleId) {
        CircleMember m = memberMapper.findByCircleAndUser(circleId, userId);
        if (m == null || !"ACTIVE".equals(m.getStatus()) ||
                (!"OWNER".equals(m.getRole()) && !"ADMIN".equals(m.getRole()))) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private CircleSummaryResponse toSummary(Circle c, boolean joined) {
        return new CircleSummaryResponse(c.getId(), c.getName(), c.getDescription(),
                c.getAvatarUrl(), c.getCategory(), c.getVisibility(),
                c.getMemberCount(), c.getPostCount(), joined);
    }
}

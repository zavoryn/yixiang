package com.tongji.profile.service;

import com.tongji.profile.api.dto.ProfilePatchRequest;
import com.tongji.profile.api.dto.ProfileResponse;
import com.tongji.profile.api.dto.VisitorItem;
import com.tongji.user.domain.User;

import java.util.List;
import java.util.Optional;

public interface ProfileService {

    Optional<User> getById(long userId);

    ProfileResponse getProfile(long userId);

    ProfileResponse updateProfile(long userId, ProfilePatchRequest req);

    ProfileResponse updateAvatar(long userId, String avatarUrl);

    void recordVisit(long targetId, long visitorId);

    List<VisitorItem> recentVisitors(long targetId, int limit);
}
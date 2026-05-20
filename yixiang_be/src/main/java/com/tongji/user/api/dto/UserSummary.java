package com.tongji.user.api.dto;

import com.tongji.user.domain.User;

public record UserSummary(
        Long id,
        String nickname,
        String avatar,
        String bio,
        Boolean verified,
        String roleTitle,
        String bannerImage
) {
    public static UserSummary from(User u) {
        return new UserSummary(
                u.getId(),
                u.getNickname(),
                u.getAvatar(),
                u.getBio(),
                u.getVerified() != null && u.getVerified(),
                u.getRoleTitle(),
                u.getBannerImage()
        );
    }
}

package com.tongji.user.api.dto;

import com.tongji.user.domain.User;

public record UserBrief(
        Long id,
        String nickname,
        String avatar,
        Boolean verified
) {
    public static UserBrief from(User u) {
        return new UserBrief(
                u.getId(),
                u.getNickname(),
                u.getAvatar(),
                u.getVerified() != null && u.getVerified()
        );
    }
}

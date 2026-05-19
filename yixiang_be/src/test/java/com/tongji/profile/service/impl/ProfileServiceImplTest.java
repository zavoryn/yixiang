package com.tongji.profile.service.impl;

import com.tongji.common.exception.BusinessException;
import com.tongji.profile.api.dto.ProfileResponse;
import com.tongji.user.domain.User;
import com.tongji.user.mapper.UserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    @Mock UserMapper userMapper;
    @InjectMocks ProfileServiceImpl service;

    @Test
    void getProfile_returnsResponse_whenUserExists() {
        User u = new User();
        u.setId(42L);
        u.setNickname("test-nick");
        u.setAvatar("https://example.com/a.png");
        when(userMapper.findById(42L)).thenReturn(u);

        ProfileResponse resp = service.getProfile(42L);

        assertThat(resp.id()).isEqualTo(42L);
        assertThat(resp.nickname()).isEqualTo("test-nick");
        assertThat(resp.avatar()).isEqualTo("https://example.com/a.png");
    }

    @Test
    void getProfile_throws_whenUserMissing() {
        when(userMapper.findById(99L)).thenReturn(null);

        assertThatThrownBy(() -> service.getProfile(99L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("用户不存在");
    }
}

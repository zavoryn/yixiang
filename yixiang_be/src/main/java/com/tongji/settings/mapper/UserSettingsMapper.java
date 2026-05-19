package com.tongji.settings.mapper;

import com.tongji.settings.model.UserSettings;
import org.apache.ibatis.annotations.Param;

public interface UserSettingsMapper {
    UserSettings findByUserId(@Param("userId") long userId);
    void upsert(UserSettings settings);
}

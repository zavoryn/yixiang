package com.tongji.settings.service;

import com.tongji.settings.api.dto.SettingsPatchRequest;
import com.tongji.settings.api.dto.SettingsResponse;

public interface SettingsService {
    SettingsResponse get(long userId);
    SettingsResponse patch(long userId, SettingsPatchRequest req);
}

package com.tongji.settings.api.dto;

import java.util.Map;

public record SettingsPatchRequest(
        Map<String, Object> notificationPref,
        Map<String, Object> privacy,
        String theme,
        String language
) {}

package com.tongji.settings.service;

import java.util.Map;

public final class SettingsDefaults {
    public static final Map<String, Object> NOTIFICATION_PREF = Map.of(
            "like",    true,
            "comment", true,
            "follow",  true,
            "system",  true
    );
    public static final Map<String, Object> PRIVACY = Map.of(
            "hideFollowing",  false,
            "hideCollections", false
    );
    public static final String THEME = "light";
    public static final String LANGUAGE = "zh-CN";

    private SettingsDefaults() {}
}

package com.tongji.settings.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;
import com.tongji.settings.api.dto.SettingsPatchRequest;
import com.tongji.settings.api.dto.SettingsResponse;
import com.tongji.settings.mapper.UserSettingsMapper;
import com.tongji.settings.model.UserSettings;
import com.tongji.settings.service.SettingsDefaults;
import com.tongji.settings.service.SettingsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class SettingsServiceImpl implements SettingsService {

    private final UserSettingsMapper mapper;
    private final ObjectMapper objectMapper;

    public SettingsServiceImpl(UserSettingsMapper mapper, ObjectMapper objectMapper) {
        this.mapper = mapper;
        this.objectMapper = objectMapper;
    }

    @Override
    public SettingsResponse get(long userId) {
        UserSettings s = mapper.findByUserId(userId);
        if (s == null) {
            return new SettingsResponse(
                    SettingsDefaults.NOTIFICATION_PREF,
                    SettingsDefaults.PRIVACY,
                    SettingsDefaults.THEME,
                    SettingsDefaults.LANGUAGE
            );
        }
        return toResponse(s);
    }

    @Override
    @Transactional
    public SettingsResponse patch(long userId, SettingsPatchRequest req) {
        UserSettings patch = UserSettings.builder()
                .userId(userId)
                .notificationPrefJson(serialize(req.notificationPref()))
                .privacyJson(serialize(req.privacy()))
                .theme(req.theme())
                .language(req.language())
                .build();
        try {
            mapper.upsert(patch);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.SETTINGS_INVALID_PAYLOAD);
        }
        return get(userId);
    }

    private SettingsResponse toResponse(UserSettings s) {
        return new SettingsResponse(
                deserialize(s.getNotificationPrefJson(), SettingsDefaults.NOTIFICATION_PREF),
                deserialize(s.getPrivacyJson(), SettingsDefaults.PRIVACY),
                s.getTheme() != null ? s.getTheme() : SettingsDefaults.THEME,
                s.getLanguage() != null ? s.getLanguage() : SettingsDefaults.LANGUAGE
        );
    }

    private String serialize(Map<String, Object> map) {
        if (map == null) return null;
        try { return objectMapper.writeValueAsString(map); }
        catch (Exception e) { throw new BusinessException(ErrorCode.SETTINGS_INVALID_PAYLOAD); }
    }

    private Map<String, Object> deserialize(String json, Map<String, Object> fallback) {
        if (json == null || json.isBlank()) return fallback;
        try { return objectMapper.readValue(json, new TypeReference<>() {}); }
        catch (Exception e) { return fallback; }
    }
}

package com.tongji.settings.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {
    private Long userId;
    private String notificationPrefJson;
    private String privacyJson;
    private String theme;
    private String language;
    private Instant updatedAt;
}

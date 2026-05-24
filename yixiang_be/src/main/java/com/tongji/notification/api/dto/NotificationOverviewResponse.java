package com.tongji.notification.api.dto;

public record NotificationOverviewResponse(int unread, int comment, int like, int follow, int system) {}

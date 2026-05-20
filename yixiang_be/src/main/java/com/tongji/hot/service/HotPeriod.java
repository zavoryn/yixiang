package com.tongji.hot.service;

import com.tongji.common.exception.BusinessException;
import com.tongji.common.exception.ErrorCode;

import java.time.Duration;

public enum HotPeriod {
    H24(Duration.ofHours(24), "24h"),
    D7(Duration.ofDays(7), "7d"),
    D30(Duration.ofDays(30), "30d");

    private final Duration window;
    private final String code;

    HotPeriod(Duration window, String code) {
        this.window = window;
        this.code = code;
    }

    public Duration window() { return window; }
    public String code() { return code; }

    public static HotPeriod parse(String s) {
        if (s == null || s.isBlank()) return H24;
        for (HotPeriod p : values()) {
            if (p.code.equals(s)) return p;
        }
        throw new BusinessException(ErrorCode.HOT_PERIOD_INVALID);
    }
}

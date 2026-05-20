package com.tongji.stock.dto;

public record MarketIndexDTO(
        String code,
        String name,
        double price,
        double change,
        double changePercent
) {}

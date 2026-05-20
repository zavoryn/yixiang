package com.tongji.stock.dto;

public record StockQuoteDTO(
        String code,
        String name,
        double open,
        double close,
        double high,
        double low,
        double price,
        double prevClose,
        double change,
        double changePercent,
        long volume,
        double amount,
        String time
) {}

package com.tongji.stock.service;

import com.tongji.stock.dto.MarketIndexDTO;
import com.tongji.stock.dto.StockQuoteDTO;

import java.util.List;

public interface StockDataService {
    List<MarketIndexDTO> getMarketIndices();
    StockQuoteDTO getQuote(String code);
    List<StockQuoteDTO> getQuotes(List<String> codes);
}

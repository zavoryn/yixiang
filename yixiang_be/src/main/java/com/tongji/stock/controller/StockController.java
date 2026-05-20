package com.tongji.stock.controller;

import com.tongji.stock.dto.MarketIndexDTO;
import com.tongji.stock.dto.StockQuoteDTO;
import com.tongji.stock.service.StockDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/stock")
public class StockController {

    private final StockDataService stockDataService;

    public StockController(StockDataService stockDataService) {
        this.stockDataService = stockDataService;
    }

    @GetMapping("/market")
    public List<MarketIndexDTO> marketIndices() {
        return stockDataService.getMarketIndices();
    }

    @GetMapping("/quote")
    public StockQuoteDTO quote(@RequestParam String code) {
        return stockDataService.getQuote(code);
    }

    @GetMapping("/quotes")
    public List<StockQuoteDTO> quotes(@RequestParam String codes) {
        return stockDataService.getQuotes(List.of(codes.split(",")));
    }
}

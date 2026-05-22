package com.tongji.counter.favorite;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteFolder {
    private Long id;
    private Long userId;
    private String name;
    private Instant createdAt;
}

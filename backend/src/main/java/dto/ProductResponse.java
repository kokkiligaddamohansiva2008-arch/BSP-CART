package com.bspcart.dto;

import com.bspcart.entity.Product;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductResponse(
        Long id,
        Long sellerId,
        String name,
        String description,
        BigDecimal price,
        BigDecimal mrp,
        Integer stock,
        String category,
        List<String> images,
        LocalDateTime createdAt) {

    public static ProductResponse of(Product p) {
        return new ProductResponse(
                p.getId(),
                p.getSellerId(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getMrp(),
                p.getStock(),
                p.getCategory(),
                List.copyOf(p.getImages()),
                p.getCreatedAt());
    }
}

package com.bspcart.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;

    private String productName;

    private String description;

    private BigDecimal price;

    private Integer quantity;

    private String brand;

    private String imageUrl;

    private Boolean available;

    private String categoryName;

    private Long categoryId;

    private String sellerName;

    private Long sellerId;

    private LocalDateTime createdAt;

}
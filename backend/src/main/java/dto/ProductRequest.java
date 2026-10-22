package com.bspcart.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ProductRequest(

        @NotBlank
        @Size(max = 255)
        String productName,

        @Size(max = 3000)
        String description,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal price,

        @NotNull
        @Min(0)
        Integer quantity,

        @Size(max = 255)
        String imageUrl,

        @Size(max = 255)
        String brand,

        Boolean available,

        Long categoryId
) {
}
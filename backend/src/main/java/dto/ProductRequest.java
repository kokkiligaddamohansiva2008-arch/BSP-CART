package com.bspcart.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/** Body of POST/PUT /api/seller/products. Field names match the Product entity and the React app. */
public record ProductRequest(

        @NotBlank
        @Size(max = 255)
        String name,

        @Size(max = 3000)
        String description,

        @NotNull
        @DecimalMin("0.0")
        BigDecimal price,

        /** Maximum retail price; defaults to price when omitted. */
        @DecimalMin("0.0")
        BigDecimal mrp,

        /** Defaults to 0 when omitted. */
        @Min(0)
        Integer stock,

        /** grocery, electronics, fashion, home */
        @Size(max = 255)
        String category,

        /** Image URLs (first one is the main photo). */
        List<@Size(max = 2000) String> images
) {
}

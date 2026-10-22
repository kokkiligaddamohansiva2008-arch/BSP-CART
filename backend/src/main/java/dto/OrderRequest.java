package com.bspcart.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequest {

    @NotNull(message = "Address ID is required")
    private Long addressId;

    private String paymentMethod;

    private String remarks;

}
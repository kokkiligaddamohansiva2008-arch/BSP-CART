package com.bspcart.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String name,
        String email,
        String phone,
        @NotBlank @Size(min = 6, message = "must be at least 6 characters") String password,
        String role) {
}

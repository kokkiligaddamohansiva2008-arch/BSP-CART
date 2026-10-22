package com.bspcart.dto;

import jakarta.validation.constraints.NotBlank;

/** identifier = email or phone number */
public record LoginRequest(@NotBlank String identifier, @NotBlank String password) {
}

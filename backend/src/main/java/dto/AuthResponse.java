package com.bspcart.dto;

/** Field names match what the React app stores: token, role, userId, name. */
public record AuthResponse(String token, Long userId, String name, String role) {
}

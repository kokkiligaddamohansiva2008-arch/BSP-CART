package com.bspcart.dto;

import com.bspcart.entity.User;

public record UserSummary(Long id, String name, String email, String phone, String role) {
    public static UserSummary of(User u) {
        return new UserSummary(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole().name());
    }
}

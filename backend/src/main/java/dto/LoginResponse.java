package com.bspcart.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private Long userId;

    private String name;

    private String email;

    private String role;

    private String token;

    private String message;

}
package com.bspcart.controller;

import com.bspcart.dto.AuthResponse;
import com.bspcart.dto.LoginRequest;
import com.bspcart.dto.RegisterRequest;
import com.bspcart.entity.Role;
import com.bspcart.entity.User;
import com.bspcart.repository.UserRepository;
import com.bspcart.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtUtil jwtUtil) {
        this.users = users;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest r) {
        String email = blankToNull(r.email());
        String phone = blankToNull(r.phone());
        if (email != null) email = email.toLowerCase();

        if (email == null && phone == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email or phone is required");
        }
        if (email != null && users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        if (phone != null && users.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered");
        }

        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPhone(phone);
        u.setPassword(encoder.encode(r.password()));
        // Admin accounts can never be created through public registration.
        u.setRole("SELLER".equalsIgnoreCase(r.role()) ? Role.SELLER : Role.BUYER);
        u = users.save(u);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(u));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) {
        String id = r.identifier().trim();
        User u = users.findByEmail(id.toLowerCase())
                .or(() -> users.findByPhone(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!encoder.matches(r.password(), u.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        return toResponse(u);
    }

    private AuthResponse toResponse(User u) {
        return new AuthResponse(jwtUtil.generate(u), u.getId(), u.getName(), u.getRole().name());
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}

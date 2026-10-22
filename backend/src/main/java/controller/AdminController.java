package com.bspcart.controller;

import com.bspcart.dto.UserSummary;
import com.bspcart.entity.Role;
import com.bspcart.repository.ProductRepository;
import com.bspcart.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository users;
    private final ProductRepository products;

    public AdminController(UserRepository users, ProductRepository products) {
        this.users = users;
        this.products = products;
    }

    @GetMapping("/users")
    public List<UserSummary> allUsers() {
        return users.findAll().stream().map(UserSummary::of).toList();
    }

    @PutMapping("/users/{id}/role")
    public UserSummary setRole(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        notSelf(id, auth);
        var u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        try {
            u.setRole(Role.valueOf(String.valueOf(body.get("role")).toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be BUYER, SELLER or ADMIN");
        }
        return UserSummary.of(users.save(u));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        notSelf(id, auth);
        try {
            users.deleteById(id);
            users.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User still has products or orders");
        }
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/products/{id}/stock")
    public Map<String, Integer> setStock(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer stock = body.get("stock");
        if (stock == null || stock < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid stock");
        var p = products.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        p.setStock(stock);
        products.save(p);
        return Map.of("stock", stock);
    }

    private void notSelf(Long id, Authentication auth) {
        if (id.equals(auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot change your own account");
        }
    }
}

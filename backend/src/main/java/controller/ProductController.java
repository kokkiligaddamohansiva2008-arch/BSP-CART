package com.bspcart.controller;

import com.bspcart.dto.ProductRequest;
import com.bspcart.entity.Product;
import com.bspcart.repository.ProductRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class ProductController {

    private final ProductRepository products;

    public ProductController(ProductRepository products) {
        this.products = products;
    }

    // ---------- public ----------

    @GetMapping("/api/products")
    public List<Product> list(@RequestParam(defaultValue = "") String category,
                              @RequestParam(defaultValue = "") String q) {
        return products.search(category.trim(), q.trim());
    }

    @GetMapping("/api/products/{id}")
    public Product get(@PathVariable Long id) {
        return products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    // ---------- seller (and admin) ----------

    @GetMapping("/api/seller/products")
    public List<Product> mine(Authentication auth) {
        return products.findBySellerId((Long) auth.getPrincipal());
    }

    @PostMapping("/api/seller/products")
    public ResponseEntity<Product> create(@Valid @RequestBody ProductRequest r, Authentication auth) {
        Product p = new Product();
        p.setSellerId((Long) auth.getPrincipal());
        apply(p, r);
        return ResponseEntity.status(HttpStatus.CREATED).body(products.save(p));
    }

    @PutMapping("/api/seller/products/{id}")
    public Product update(@PathVariable Long id, @Valid @RequestBody ProductRequest r, Authentication auth) {
        Product p = owned(id, auth);
        apply(p, r);
        return products.save(p);
    }

    @DeleteMapping("/api/seller/products/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        products.delete(owned(id, auth));
        return ResponseEntity.noContent().build();
    }

    // ---------- helpers ----------

    private Product owned(Long id, Authentication auth) {
        Product p = get(id);
        boolean admin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!admin && !p.getSellerId().equals(auth.getPrincipal())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This is not your product");
        }
        return p;
    }

    private void apply(Product p, ProductRequest r) {
        p.setName(r.name().trim());
        p.setDescription(r.description());
        p.setPrice(r.price());
        p.setMrp(r.mrp() != null ? r.mrp() : r.price());
        p.setStock(r.stock() != null ? r.stock() : 0);
        p.setCategory(r.category());
        p.getImages().clear();
        if (r.images() != null) {
            p.getImages().addAll(r.images());
        }
    }
}

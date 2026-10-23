package com.bspcart.service;

import com.bspcart.dto.ProductRequest;
import com.bspcart.dto.ProductResponse;
import com.bspcart.entity.Product;
import com.bspcart.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository products;

    public ProductService(ProductRepository products) {
        this.products = products;
    }

    // ---------- public ----------

    public List<ProductResponse> getProducts(String category, String query) {
        String c = category == null ? "" : category.trim();
        String q = query == null ? "" : query.trim();
        return products.search(c, q).stream().map(ProductResponse::of).toList();
    }

    public ProductResponse getProductById(Long id) {
        return ProductResponse.of(find(id));
    }

    // ---------- seller / admin ----------

    public List<ProductResponse> getSellerProducts(Long sellerId) {
        return products.findBySellerId(sellerId).stream().map(ProductResponse::of).toList();
    }

    public ProductResponse createProduct(ProductRequest request, Long sellerId) {
        Product p = new Product();
        p.setSellerId(sellerId);
        apply(p, request);
        return ProductResponse.of(products.save(p));
    }

    public ProductResponse updateProduct(Long productId, ProductRequest request, Long sellerId, boolean admin) {
        Product p = owned(productId, sellerId, admin);
        apply(p, request);
        return ProductResponse.of(products.save(p));
    }

    public void deleteProduct(Long productId, Long sellerId, boolean admin) {
        products.delete(owned(productId, sellerId, admin));
    }

    // ---------- helpers ----------

    private Product find(Long id) {
        return products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private Product owned(Long productId, Long sellerId, boolean admin) {
        Product p = find(productId);
        if (!admin && !p.getSellerId().equals(sellerId)) {
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

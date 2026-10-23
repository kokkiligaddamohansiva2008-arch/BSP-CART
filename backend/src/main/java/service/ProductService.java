package com.bspcart.service;

import com.bspcart.dto.ProductRequest;
import com.bspcart.dto.ProductResponse;
import com.bspcart.entity.Category;
import com.bspcart.entity.Product;
import com.bspcart.entity.Seller;
import com.bspcart.repository.CategoryRepository;
import com.bspcart.repository.ProductRepository;
import com.bspcart.repository.SellerRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerRepository sellerRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SellerRepository sellerRepository) {

        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.sellerRepository = sellerRepository;
    }

    // ---------- PUBLIC ----------

    public List<ProductResponse> getProducts(
            String category,
            String query) {

        List<Product> products;

        String cleanQuery = query == null ? "" : query.trim();
        String cleanCategory = category == null ? "" : category.trim();

        if (!cleanQuery.isBlank()) {

            products = productRepository
                    .findByProductNameContainingIgnoreCase(cleanQuery);

        } else if (!cleanCategory.isBlank()) {

            Category categoryEntity =
                    categoryRepository
                            .findByCategoryName(cleanCategory)
                            .orElse(null);

            if (categoryEntity == null) {
                return List.of();
            }

            products = productRepository
                    .findByCategoryAndAvailableTrue(categoryEntity);

        } else {

            products = productRepository
                    .findByAvailableTrue();
        }

        return products.stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse getProductById(Long id) {

        Product product = productRepository
                .findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "Product not found"
                        ));

        return toResponse(product);
    }

    // ---------- SELLER ----------

    public List<ProductResponse> getSellerProducts(Long sellerId) {

        Seller seller = sellerRepository
                .findById(sellerId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "Seller not found"
                        ));

        return productRepository
                .findBySeller(seller)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse createProduct(
            ProductRequest request,
            Long sellerId) {

        Seller seller = sellerRepository
                .findById(sellerId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "Seller not found"
                        ));

        Product product = new Product();

        product.setSeller(seller);

        applyRequest(product, request);

        return toResponse(
                productRepository.save(product)
        );
    }

    public ProductResponse updateProduct(
            Long productId,
            ProductRequest request,
            Long sellerId,
            boolean admin) {

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "Product not found"
                        ));

        if (!admin &&
                (product.getSeller() == null ||
                 !product.getSeller().getId().equals(sellerId))) {

            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "This is not your product"
            );
        }

        applyRequest(product, request);

        return toResponse(
                productRepository.save(product)
        );
    }

    public void deleteProduct(
            Long productId,
            Long sellerId,
            boolean admin) {

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "Product not found"
                        ));

        if (!admin &&
                (product.getSeller() == null ||
                 !product.getSeller().getId().equals(sellerId))) {

            throw new ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "This is not your product"
            );
        }

        productRepository.delete(product);
    }

    // ---------- HELPERS ----------

    private void applyRequest(
            Product product,
            ProductRequest request) {

        product.setProductName(
                request.productName().trim()
        );

        product.setDescription(
                request.description()
        );

        product.setPrice(
                request.price()
        );

        product.setQuantity(
                request.quantity()
        );

        product.setImageUrl(
                request.imageUrl()
        );

        product.setBrand(
                request.brand()
        );

        product.setAvailable(
                request.available() == null
                        ? true
                        : request.available()
        );

        if (request.categoryId() != null) {

            Category category =
                    categoryRepository
                            .findById(request.categoryId())
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            NOT_FOUND,
                                            "Category not found"
                                    ));

            product.setCategory(category);

        } else {

            product.setCategory(null);
        }
    }

    private ProductResponse toResponse(Product product) {

        ProductResponse response =
                new ProductResponse();

        response.setId(product.getId());
        response.setProductName(product.getProductName());
        response.setDescription(product.getDescription());
        response.setPrice(product.getPrice());
        response.setQuantity(product.getQuantity());
        response.setBrand(product.getBrand());
        response.setImageUrl(product.getImageUrl());
        response.setAvailable(product.getAvailable());
        response.setCreatedAt(product.getCreatedAt());

        if (product.getCategory() != null) {

            response.setCategoryId(
                    product.getCategory().getId()
            );

            response.setCategoryName(
                    product.getCategory().getCategoryName()
            );
        }

        if (product.getSeller() != null) {

            response.setSellerId(
                    product.getSeller().getId()
            );

            response.setSellerName(
                    product.getSeller().getShopName()
            );

            if (response.getSellerName() == null ||
                    response.getSellerName().isBlank()) {

                response.setSellerName(
                        product.getSeller().getFullName()
                );
            }
        }

        return response;
    }
}
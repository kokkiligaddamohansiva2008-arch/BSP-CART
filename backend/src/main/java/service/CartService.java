package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class CartService {


    public String addToCart(Long productId) {
        return "Product Added To Cart : " + productId;
    }


    public String removeFromCart(Long productId) {
        return "Product Removed From Cart : " + productId;
    }


    public String updateQuantity(Long productId,int quantity) {
        return "Quantity Updated";
    }


    public String getCartItems(Long userId) {
        return "Cart Items For User : " + userId;
    }


    public String clearCart(Long userId) {
        return "Cart Cleared";
    }
}
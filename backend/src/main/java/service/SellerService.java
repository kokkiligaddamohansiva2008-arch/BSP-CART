package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class SellerService {

    public String registerSeller() {
        return "Seller Registered";
    }

    public String addProduct() {
        return "Product Added";
    }

    public String updateProduct() {
        return "Product Updated";
    }

    public String removeProduct(Long productId) {
        return "Product Removed : " + productId;
    }

    public String manageInventory() {
        return "Inventory Updated";
    }
}
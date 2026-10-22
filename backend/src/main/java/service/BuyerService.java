package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class BuyerService {

    public String browseProducts() {
        return "Products List";
    }

    public String searchProducts(String keyword) {
        return "Search Result : " + keyword;
    }

    public String viewOrders(Long buyerId) {
        return "Orders of Buyer : " + buyerId;
    }
}
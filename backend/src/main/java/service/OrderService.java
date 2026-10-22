package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class OrderService {


    public String createOrder(Long userId) {
        return "Order Created For User : " + userId;
    }


    public String cancelOrder(Long orderId) {
        return "Order Cancelled : " + orderId;
    }


    public String updateOrderStatus(Long orderId,String status) {
        return "Order Status Updated : " + status;
    }


    public String getOrderHistory(Long userId) {
        return "Order History";
    }
}
package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class AdminService {

    public String approveSeller(Long sellerId) {
        return "Seller Approved : " + sellerId;
    }

    public String blockUser(Long userId) {
        return "User Blocked : " + userId;
    }

    public String viewReports() {
        return "Admin Reports";
    }
}
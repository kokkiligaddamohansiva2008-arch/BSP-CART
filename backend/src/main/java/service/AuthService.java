package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public String registerUser() {
        return "User Registered Successfully";
    }

    public String loginUser() {
        return "Login Successful";
    }

    public String logoutUser() {
        return "Logout Successful";
    }

    public String changePassword() {
        return "Password Changed Successfully";
    }
}
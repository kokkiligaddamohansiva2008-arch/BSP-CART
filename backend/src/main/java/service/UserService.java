package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    public String createUser() {
        return "User Created";
    }

    public String getUserById(Long id) {
        return "User ID : " + id;
    }

    public String updateUser() {
        return "User Updated";
    }

    public String deleteUser(Long id) {
        return "User Deleted : " + id;
    }

    public String getAllUsers() {
        return "All Users";
    }
}
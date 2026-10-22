package com.bspcart.service;

import org.springframework.stereotype.Service;

@Service
public class CategoryService {


    public String createCategory() {
        return "Category Created";
    }


    public String updateCategory() {
        return "Category Updated";
    }


    public String deleteCategory(Long id) {
        return "Category Deleted : " + id;
    }


    public String getAllCategories() {
        return "Categories";
    }
}
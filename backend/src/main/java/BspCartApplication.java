package com.bspcart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BspCartApplication {

    public static void main(String[] args) {

        SpringApplication.run(
                BspCartApplication.class,
                args
        );

        System.out.println("========================================");
        System.out.println(" BSP CART APPLICATION STARTED ");
        System.out.println(" http://localhost:8080 ");
        System.out.println("========================================");
    }

}
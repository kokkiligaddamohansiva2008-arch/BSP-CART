package com.bspcart.repository;

import com.bspcart.entity.Buyer;
import com.bspcart.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByBuyer(Buyer buyer);

}
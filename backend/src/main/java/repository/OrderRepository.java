package com.bspcart.repository;

import com.bspcart.entity.Buyer;
import com.bspcart.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyer(Buyer buyer);

}
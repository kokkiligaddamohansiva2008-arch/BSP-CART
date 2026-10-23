package com.bspcart.repository;

import com.bspcart.entity.Address;
import com.bspcart.entity.Buyer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AddressRepository extends JpaRepository<Address, Long> {

    List<Address> findByBuyer(Buyer buyer);

}
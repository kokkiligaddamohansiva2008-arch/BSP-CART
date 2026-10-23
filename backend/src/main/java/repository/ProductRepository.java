package com.bspcart.repository;

import com.bspcart.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findBySellerId(Long sellerId);

    /** Empty category / q means "no filter". Newest products first. */
    @Query("""
            select p from Product p
            where (:category = '' or lower(p.category) = lower(:category))
              and (:q = '' or lower(p.name) like lower(concat('%', :q, '%')))
            order by p.id desc
            """)
    List<Product> search(@Param("category") String category, @Param("q") String q);

}

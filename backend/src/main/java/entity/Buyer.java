package com.bspcart.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "buyers")
public class Buyer extends User {

    @OneToMany(
            mappedBy = "buyer",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Address> addresses = new ArrayList<>();

    @OneToOne(
            mappedBy = "buyer",
            cascade = CascadeType.ALL
    )
    private Cart cart;

    @OneToMany(
            mappedBy = "buyer",
            cascade = CascadeType.ALL
    )
    private List<Order> orders = new ArrayList<>();

}
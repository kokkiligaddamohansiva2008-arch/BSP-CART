package com.bspcart.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "sellers")
public class Seller extends User {

    private String shopName;

    private String gstNumber;

    private String shopAddress;

}

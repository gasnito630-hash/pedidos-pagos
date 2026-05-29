package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "detallepedido")
@Data
public class DetallePedidoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detalleid")
    private Long detalleid;

    @Column(name = "pedidoid")
    private Long pedidoid;

    @Column(name = "productoid")
    private Long productoid;

    @Column(name = "cantidad")
    private Integer cantidad;

    @Column(name = "preciounitario", precision = 10, scale = 2)
    private BigDecimal preciounitario;

    @Column(name = "subtotal", precision = 10, scale = 2, insertable = false, updatable = false)
    private BigDecimal subtotal;
}

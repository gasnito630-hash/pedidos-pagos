package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "envio")
@Data
public class EnvioEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "envioid")
    private Long envioid;

    @Column(name = "pedidoid")
    private Long pedidoid;
    @Column(name = "metodoenvioid")
    private Long metodoenvioid;
    @Column(name = "numerotracking", length = 100)
    private String numerotracking;
    @Column(name = "estadoenvio", length = 50)
    private String estadoenvio;
    @Column(name = "fechaestimadaentrega")
    private LocalDateTime fechaestimadaentrega;
    @Column(name = "fechaenvio")
    private LocalDateTime fechaenvio;
    @Column(name = "fechaentrega")
    private LocalDateTime fechaentrega;

    @PrePersist
    protected void onCreate() {
        if (estadoenvio == null)
            estadoenvio = "PREPARANDO";
        if (fechaenvio == null)
            fechaenvio = LocalDateTime.now();
    }
}

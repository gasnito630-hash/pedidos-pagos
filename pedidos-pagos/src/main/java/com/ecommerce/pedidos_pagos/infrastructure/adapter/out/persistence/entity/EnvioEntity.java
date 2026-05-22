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
    private Long envioId;

    @Column(name = "pedidoid", nullable = false)
    private Long pedidoId;

    @Column(name = "metodoenvioid")
    private Long metodoEnvioId;

    @Column(name = "numerotracking", length = 100)
    private String numeroTracking;

    @Column(name = "estadoenvio", length = 50)
    private String estadoEnvio;

    @Column(name = "fechaestimadaentrega")
    private LocalDateTime fechaEstimadaEntrega;

    @Column(name = "fechaenvio")
    private LocalDateTime fechaEnvio;

    @Column(name = "fechaentrega")
    private LocalDateTime fechaEntrega;

    @PrePersist
    protected void onCreate() {
        if (estadoEnvio == null)
            estadoEnvio = "PREPARANDO";
        if (fechaEnvio == null)
            fechaEnvio = LocalDateTime.now();
    }
}

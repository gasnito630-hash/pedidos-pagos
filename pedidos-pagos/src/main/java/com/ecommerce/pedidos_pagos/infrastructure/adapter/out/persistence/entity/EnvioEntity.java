package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "Envio")
@Data
public class EnvioEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EnvioID")
    private Long envioId;

    @Column(name = "PedidoID")
    private Long pedidoId;
    @Column(name = "MetodoEnvioID")
    private Long metodoEnvioId;
    @Column(name = "NumeroTracking", length = 100)
    private String numeroTracking;
    @Column(name = "EstadoEnvio", length = 50)
    private String estadoEnvio;
    @Column(name = "FechaEstimadaEntrega")
    private LocalDateTime fechaEstimadaEntrega;
    @Column(name = "FechaEnvio")
    private LocalDateTime fechaEnvio;
    @Column(name = "FechaEntrega")
    private LocalDateTime fechaEntrega;

    @PrePersist
    protected void onCreate() {
        if (estadoEnvio == null)
            estadoEnvio = "PREPARANDO";
        if (fechaEnvio == null)
            fechaEnvio = LocalDateTime.now();
    }
}
package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Pedido")
@Data
public class PedidoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PedidoID")
    private Long pedidoId;

    @Column(name = "UsuarioID")
    private Long usuarioId;

    @Column(name = "DireccionEnvioID")
    private Long direccionEnvioId;

    @Column(name = "Estado", length = 20)
    private String estado;

    @Column(name = "MontoTotal", precision = 10, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "CreadoEn")
    private LocalDateTime creadoEn;

    @Column(name = "ActualizadoEn")
    private LocalDateTime actualizadoEn;

    @Column(name = "DireccionEnvio", length = 255)
    private String direccionEnvio;

    @Column(name = "TelefonoContacto", length = 20)
    private String telefonoContacto;

    // ✅ NO AGREGAR metodoPago - No existe en la tabla Pedido

    @PrePersist
    protected void onCreate() {
        creadoEn = LocalDateTime.now();
        actualizadoEn = LocalDateTime.now();
        if (estado == null)
            estado = "PENDIENTE";
    }

    @PreUpdate
    protected void onUpdate() {
        actualizadoEn = LocalDateTime.now();
    }
}
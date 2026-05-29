package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pedido")
@Data
public class PedidoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pedidoid")
    private Long pedidoId;

    @Column(name = "usuarioid", nullable = false)
    private Long usuarioId;

    @Column(name = "direccionenvioid")
    private Long direccionEnvioId;

    @Column(name = "estado", nullable = false, length = 50)
    private String estado;

    @Column(name = "montototal", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "creadoen")
    private LocalDateTime creadoEn;

    @Column(name = "actualizadoen")
    private LocalDateTime actualizadoEn;

    @Column(name = "direccionenvio", length = 500)
    private String direccionEnvio;

    @Column(name = "telefonocontacto", length = 20)
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

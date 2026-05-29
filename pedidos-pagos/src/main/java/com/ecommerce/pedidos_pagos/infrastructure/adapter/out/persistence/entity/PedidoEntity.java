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
    private Long pedidoid;

    @Column(name = "usuarioid")
    private Long usuarioid;

    @Column(name = "direccionenvioid")
    private Long direccionenvioid;

    @Column(name = "estado", length = 20)
    private String estado;

    @Column(name = "montototal", precision = 10, scale = 2)
    private BigDecimal montototal;

    @Column(name = "creadoen")
    private LocalDateTime creadoen;

    @Column(name = "actualizadoen")
    private LocalDateTime actualizadoen;

    @Column(name = "direccionenvio", length = 255)
    private String direccionenvio;

    @Column(name = "telefonocontacto", length = 20)
    private String telefonocontacto;

    @PrePersist
    protected void onCreate() {
        creadoen = LocalDateTime.now();
        actualizadoen = LocalDateTime.now();
        if (estado == null)
            estado = "PENDIENTE";
    }

    @PreUpdate
    protected void onUpdate() {
        actualizadoen = LocalDateTime.now();
    }
}

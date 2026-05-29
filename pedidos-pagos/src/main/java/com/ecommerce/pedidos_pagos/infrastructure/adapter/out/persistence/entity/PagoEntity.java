package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pago")
@Data
public class PagoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pagoid")
    private Long pagoid;

    @Column(name = "pedidoid")
    private Long pedidoid;

    @Column(name = "metodopago", length = 20)
    private String metodopago;

    @Column(name = "monto", precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "estadopago", length = 20)
    private String estadopago;

    @Column(name = "transaccionexterna", length = 100)
    private String transaccionexterna;

    @Column(name = "fechapago")
    private LocalDateTime fechapago;

    @PrePersist
    protected void onCreate() {
        if (fechapago == null) {
            fechapago = LocalDateTime.now();
        }
        if (estadopago == null) {
            estadopago = "COMPLETADO";
        }
    }
}

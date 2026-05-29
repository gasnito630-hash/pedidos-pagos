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
    private Long pagoId;

    @Column(name = "pedidoid")
    private Long pedidoId;

    @Column(name = "metodopago", length = 20)
    private String metodoPago;

    // ✅ USAR "Monto" (como está en la BD), no "MontoPago"
    @Column(name = "monto", precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "estadopago", length = 20)
    private String estadoPago;

    @Column(name = "transaccionexterna", length = 100)
    private String transaccionExterna;

    @Column(name = "fechapago")
    private LocalDateTime fechaPago;

    @PrePersist
    protected void onCreate() {
        if (fechaPago == null) {
            fechaPago = LocalDateTime.now();
        }
        if (estadoPago == null) {
            estadoPago = "COMPLETADO";
        }
    }

    // Si @Data no genera los getters/setters, agrégalos manualmente:
    // public BigDecimal getMonto() { return monto; }
    // public void setMonto(BigDecimal monto) { this.monto = monto; }
}

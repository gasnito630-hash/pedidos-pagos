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
    private Long detalleId;

    @Column(name = "pedidoid", nullable = false)
    private Long pedidoId;

    @Column(name = "productoid", nullable = false)
    private Long productoId;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "preciounitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    // ✅ ELIMINAR: Si es columna calculada, NO la mapeamos para INSERT/UPDATE
    // Solo la leemos (opcional con @Column(insertable = false, updatable = false))
    @Column(name = "subtotal", precision = 10, scale = 2, insertable = false, updatable = false)
    private BigDecimal subtotal;
}

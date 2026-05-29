package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "DetallePedido")
@Data
public class DetallePedidoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DetalleID")
    private Long detalleId;

    @Column(name = "PedidoID")
    private Long pedidoId;

    @Column(name = "ProductoID")
    private Long productoId;

    @Column(name = "Cantidad")
    private Integer cantidad;

    @Column(name = "PrecioUnitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    // ✅ ELIMINAR: Si es columna calculada, NO la mapeamos para INSERT/UPDATE
    // Solo la leemos (opcional con @Column(insertable = false, updatable = false))
    @Column(name = "Subtotal", precision = 10, scale = 2, insertable = false, updatable = false)
    private BigDecimal subtotal;
}
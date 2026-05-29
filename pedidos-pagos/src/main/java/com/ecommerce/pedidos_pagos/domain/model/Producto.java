package com.ecommerce.pedidos_pagos.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductoID")
    private Long productoId;

    @Column(name = "Nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "SKU", nullable = false, length = 20, unique = true)
    private String sku;

    @Column(name = "Precio", nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "Stock", nullable = false)
    private Integer stock;

    // ✅ AGREGAR ESTE CAMPO
    @Column(name = "ImagenURL", length = 500)
    private String imagenUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoriaID")
    private Categoria categoria;

    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PedidoProducto> pedidoProductos = new ArrayList<>();

    // Lógica de dominio necesaria
    public boolean hayStockDisponible(Integer cantidad) {
        return this.stock != null && this.stock >= cantidad;
    }

    public boolean descontarStock(Integer cantidad) {
        if (hayStockDisponible(cantidad)) {
            this.stock -= cantidad;
            return true;
        }
        return false;
    }

    public BigDecimal calcularPrecioTotal(Integer cantidad) {
        return this.precio != null && cantidad != null
                ? this.precio.multiply(BigDecimal.valueOf(cantidad))
                : BigDecimal.ZERO;
    }

}
package com.ecommerce.pedidos_pagos.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad de dominio para Categoría.
 * Incluye anotaciones JPA porque Producto tiene relación @ManyToOne con ella.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CategoriaID")
    private Long categoriaId;

    @Column(name = "Nombre", nullable = false, length = 100, unique = true)
    private String nombre;

    @Column(name = "Descripcion", length = 255)
    private String descripcion;

    // Relación inversa: Una categoría tiene muchos productos
    @OneToMany(mappedBy = "categoria", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Producto> productos = new ArrayList<>();

    // ========================================
    // MÉTODOS DE DOMINIO (Lógica de negocio)
    // ========================================

    public void agregarProducto(Producto producto) {
        if (!productos.contains(producto)) {
            productos.add(producto);
            producto.setCategoria(this);
        }
    }

    public void removerProducto(Producto producto) {
        if (productos.remove(producto)) {
            producto.setCategoria(null);
        }
    }

    public boolean tieneProductosConStock() {
        return productos.stream()
                .anyMatch(p -> p.getStock() != null && p.getStock() > 0);
    }

    public List<Producto> getProductosConStock() {
        return productos.stream()
                .filter(p -> p.getStock() != null && p.getStock() > 0)
                .toList();
    }
}
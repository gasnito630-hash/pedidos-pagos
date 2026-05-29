package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "Categoria") // ← Sugiero plural para consistencia con "productos"
public class CategoriaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CategoriaID")
    private Long categoriaId;

    @Column(name = "Nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "Descripcion", length = 255)
    private String descripcion;

    // Si tu tabla NO tiene la columna "Activo", comenta o elimina esta línea:
    @Column(name = "Activo")
    private Boolean activo;
}
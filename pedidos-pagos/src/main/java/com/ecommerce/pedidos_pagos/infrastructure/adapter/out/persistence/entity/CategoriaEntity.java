package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "categoria")
@Data
public class CategoriaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "categoriaid")
    private Long categoriaId;

    @Column(name = "nombre", nullable = false, length = 100, unique = true)
    private String nombre;

    @Column(name = "descripcion", length = 255)
    private String descripcion;

    @Column(name = "activo")
    private Boolean activo;
}

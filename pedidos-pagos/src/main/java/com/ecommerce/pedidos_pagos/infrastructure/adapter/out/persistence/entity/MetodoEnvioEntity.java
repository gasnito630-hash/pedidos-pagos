package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "MetodoEnvio")
@Data
public class MetodoEnvioEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MetodoID")
    private Long metodoId;

    @Column(name = "Nombre", length = 100)
    private String nombre;
    @Column(name = "Descripcion", length = 255)
    private String descripcion;
    @Column(name = "CostoBase", precision = 10, scale = 2)
    private BigDecimal costoBase;
    @Column(name = "DiasEntregaMin")
    private Integer diasEntregaMin;
    @Column(name = "DiasEntregaMax")
    private Integer diasEntregaMax;
    @Column(name = "Activo")
    private Boolean activo;
}
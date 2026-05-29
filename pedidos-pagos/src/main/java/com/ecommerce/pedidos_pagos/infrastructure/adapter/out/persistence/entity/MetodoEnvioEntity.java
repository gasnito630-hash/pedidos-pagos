package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "metodoenvio")
@Data
public class MetodoEnvioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "metodoid")
    private Long metodoId;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "descripcion", length = 500)
    private String descripcion;

    @Column(name = "costobase", precision = 10, scale = 2)
    private BigDecimal costoBase;

    @Column(name = "diasentregamin")
    private Integer diasEntregaMin;

    @Column(name = "diasentregamax")
    private Integer diasEntregaMax;

    @Column(name = "activo")
    private Boolean activo;
}

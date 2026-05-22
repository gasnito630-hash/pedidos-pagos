package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "direccion")
@Data
public class DireccionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "direccionid")
    private Long direccionId;

    @Column(name = "usuarioid", nullable = false)
    private Long usuarioId;

    @Column(name = "calle", nullable = false, length = 200)
    private String calle;

    @Column(name = "numero", nullable = false, length = 20)
    private String numero;

    @Column(name = "ciudad", length = 100)
    private String ciudad;

    @Column(name = "pais", length = 100)
    private String pais;

    @Column(name = "codigopostal", length = 20)
    private String codigoPostal;

    @Column(name = "esprincipal")
    private Boolean esPrincipal;
}

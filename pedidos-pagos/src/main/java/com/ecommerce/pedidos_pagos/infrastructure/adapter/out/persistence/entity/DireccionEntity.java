package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "Direccion")
@Data
public class DireccionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DireccionID")
    private Long direccionId;

    @Column(name = "UsuarioID")
    private Long usuarioId;
    @Column(name = "Calle")
    private String calle;
    @Column(name = "Numero")
    private String numero;
    @Column(name = "Ciudad")
    private String ciudad;
    @Column(name = "Pais")
    private String pais;
    @Column(name = "EsPrincipal")
    private Boolean esPrincipal;
}
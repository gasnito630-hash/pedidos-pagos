package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto;

import lombok.Data;

@Data
public class DireccionDTO {
    private Long direccionId;
    private Long usuarioId;
    private String calle;
    private String numero;
    private String ciudad;
    private String pais;
    private Boolean esPrincipal;
}
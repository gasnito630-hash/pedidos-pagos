package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType;
    private String rol;
    private Long usuarioId;
    private String nombre; // ← Para mostrar en dashboard
    private String email; // ← Para mostrar en dashboard
}
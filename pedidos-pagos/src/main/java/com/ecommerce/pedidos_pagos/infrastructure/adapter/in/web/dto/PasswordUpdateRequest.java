package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto;

import lombok.Data;

@Data
public class PasswordUpdateRequest {
    private Long usuarioId;
    private String newPassword;
}
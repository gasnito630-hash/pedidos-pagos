package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto;

import lombok.Data;
import java.util.List;

@Data
public class PedidoRequestDTO {
    private List<ItemPedidoDTO> items;

    // ✅ El frontend envía texto, lo convertimos a dirección en el service
    private String direccionEnvio;
    private String telefonoContacto;
    private String metodoPago;
    private Long metodoEnvioId;

    @Data
    public static class ItemPedidoDTO {
        private Long productoId;
        private Integer cantidad;
    }
}
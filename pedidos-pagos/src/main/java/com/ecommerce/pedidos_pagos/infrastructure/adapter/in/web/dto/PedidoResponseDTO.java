package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PedidoResponseDTO {
    private Long pedidoId;
    private Long usuarioId;
    private LocalDateTime creadoEn;
    private String estado;
    private BigDecimal montoTotal;
    private String direccionEnvio;
    private String telefonoContacto;

    // ✅ MÉTODO DE PAGO
    private String metodoPago;

    // ✅ INFORMACIÓN DE ENVÍO
    private String metodoEnvioNombre;
    private BigDecimal costoEnvio;
    private String numeroTracking;
    private String estadoEnvio;
    private LocalDateTime fechaEstimadaEntrega;

    private List<ItemPedidoDTO> items;

    @Data
    public static class ItemPedidoDTO {
        private Long productoId;
        private String nombreProducto;
        private Integer cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal subtotal;

        // ✅ AGREGAR ESTE CAMPO
        private String imagenUrl;
    }
}
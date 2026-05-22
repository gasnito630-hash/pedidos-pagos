package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class VentasReporteDTO {
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private BigDecimal totalVentas;
    private Long totalPedidos;
    private Long totalClientes;
    private BigDecimal ticketPromedio;
    private List<ProductoVendidoDTO> productosMasVendidos;
    private List<VentaPorEstadoDTO> ventasPorEstado;
    private List<VentaPorCategoriaDTO> ventasPorCategoria;
    private List<VentaDiariaDTO> ventasPorDia;

    @Data
    public static class ProductoVendidoDTO {
        private Long productoId;
        private String nombre;
        private String imagenUrl;
        private Long cantidadVendida;
        private BigDecimal ingresoTotal;
    }

    @Data
    public static class VentaPorEstadoDTO {
        private String estado;
        private Long cantidad;
        private BigDecimal montoTotal;
    }

    @Data
    public static class VentaPorCategoriaDTO {
        private String categoria;
        private Long cantidadPedidos;
        private BigDecimal montoTotal;
    }

    @Data
    public static class VentaDiariaDTO {
        private LocalDate fecha;
        private Long cantidadPedidos;
        private BigDecimal montoTotal;
    }
}
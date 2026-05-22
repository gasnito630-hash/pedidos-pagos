package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductoDTO {
    private Long productoId;
    private String nombre;
    private String sku;
    private BigDecimal precio;
    private Integer stock;

    // ✅ CAMPO PARA RECIBIR EL ID DE CATEGORÍA DESDE EL FRONTEND
    private Long categoriaId;
    private String imagenUrl;

    // Opcional: si quieres recibir el objeto completo (no recomendado)
    // private CategoriaEntity categoria;
}

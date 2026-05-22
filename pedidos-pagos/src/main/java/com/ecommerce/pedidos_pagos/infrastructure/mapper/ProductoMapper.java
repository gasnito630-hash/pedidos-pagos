package com.ecommerce.pedidos_pagos.infrastructure.mapper;

import com.ecommerce.pedidos_pagos.domain.model.Producto;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.ProductoEntity;
import org.springframework.stereotype.Component;

@Component
public class ProductoMapper {

    private final CategoriaMapper categoriaMapper;

    public ProductoMapper(CategoriaMapper categoriaMapper) {
        this.categoriaMapper = categoriaMapper;
    }

    /**
     * Convierte Entity → Model (lectura desde BD)
     */
    public Producto toModel(ProductoEntity entity) {
        if (entity == null)
            return null;

        return Producto.builder()
                .productoId(entity.getProductoId())
                .nombre(entity.getNombre())
                .sku(entity.getSku())
                .precio(entity.getPrecio())
                .stock(entity.getStock())
                // ✅ AGREGAR ESTA LÍNEA (CRÍTICA)
                .imagenUrl(entity.getImagenUrl())
                // ✅ CORRECTO: entity.getCategoria() devuelve CategoriaEntity
                .categoria(categoriaMapper.toModel(entity.getCategoria()))
                .build();
    }

    /**
     * Convierte Model → Entity (guardado en BD)
     */
    public ProductoEntity toEntity(Producto model) {
        if (model == null)
            return null;

        ProductoEntity entity = new ProductoEntity();
        entity.setProductoId(model.getProductoId());
        entity.setNombre(model.getNombre());
        entity.setSku(model.getSku());
        entity.setPrecio(model.getPrecio());
        entity.setStock(model.getStock());
        // ✅ AGREGAR ESTA LÍNEA TAMBIÉN
        entity.setImagenUrl(model.getImagenUrl());
        // ✅ CORRECTO: setCategoria() espera CategoriaEntity
        entity.setCategoria(categoriaMapper.toEntity(model.getCategoria()));

        return entity;
    }
}
package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.domain.model.Producto;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.ProductoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.ProductoRepository;
import com.ecommerce.pedidos_pagos.infrastructure.mapper.ProductoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoMapper productoMapper;

    /**
     * Obtiene todos los productos como Modelos de Dominio
     * CORRECCIÓN: Se añade @Transactional(readOnly = true) para asegurar la sesión
     * abierta con los mappers
     */
    @Transactional(readOnly = true)
    public List<Producto> obtenerTodosLosProductos() {
        List<ProductoEntity> entities = productoRepository.findAll();
        return entities.stream()
                .map(productoMapper::toModel)
                .collect(Collectors.toList());
    }

    /**
     * Busca un producto por ID y lo devuelve como Modelo
     * CORRECCIÓN: Se añade @Transactional(readOnly = true) para evitar fallos de
     * inicialización perezosa
     */
    @Transactional(readOnly = true)
    public Producto obtenerProductoPorId(Long id) {
        ProductoEntity entity = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));
        return productoMapper.toModel(entity);
    }

    /**
     * Guarda o actualiza un producto
     */
    @Transactional
    public Producto guardarProducto(Producto producto) {
        ProductoEntity entity = productoMapper.toEntity(producto);
        ProductoEntity entityGuardada = productoRepository.save(entity);
        return productoMapper.toModel(entityGuardada);
    }

    /**
     * Elimina un producto
     */
    @Transactional
    public void eliminarProducto(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new RuntimeException("Producto no encontrado con ID: " + id);
        }
        productoRepository.deleteById(id);
    }
}

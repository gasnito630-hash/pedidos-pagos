package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.domain.model.Producto;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.ProductoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.ProductoRepository;
import com.ecommerce.pedidos_pagos.infrastructure.mapper.ProductoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoMapper productoMapper;

    public Page<ProductoEntity> listarProductos(int page, int size, String buscar) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("productoId").descending());
        return productoRepository.buscarProductos(buscar, pageable);
    }

    @Transactional(readOnly = true)
    public List<Producto> obtenerTodosLosProductos() {
        List<ProductoEntity> entities = productoRepository.findAll();
        return entities.stream()
                .map(productoMapper::toModel)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Producto obtenerProductoPorId(Long id) {
        ProductoEntity entity = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con ID: " + id));
        return productoMapper.toModel(entity);
    }

    @Transactional
    public ProductoEntity guardar(ProductoEntity producto) {
        if (producto.getProductoId() != null && producto.getProductoId() > 0) {
            ProductoEntity existente = productoRepository.findById(producto.getProductoId())
                    .orElseThrow(
                            () -> new RuntimeException("Producto no encontrado con ID: " + producto.getProductoId()));

            existente.setNombre(producto.getNombre());
            existente.setSku(producto.getSku());
            existente.setPrecio(producto.getPrecio());
            existente.setStock(producto.getStock());
            existente.setImagenUrl(producto.getImagenUrl());

            if (producto.getCategoria() != null && producto.getCategoria().getCategoriaId() != null) {
                existente.setCategoria(producto.getCategoria());
            }

            return productoRepository.save(existente);
        }

        return productoRepository.save(producto);
    }

    @Transactional
    public Producto guardarProducto(Producto producto) {
        ProductoEntity entity = productoMapper.toEntity(producto);
        ProductoEntity entityGuardada = productoRepository.save(entity);
        return productoMapper.toModel(entityGuardada);
    }

    @Transactional
    public void eliminarProducto(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new RuntimeException("Producto no encontrado con ID: " + id);
        }
        productoRepository.deleteById(id);
    }
}
package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.CategoriaEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public Page<CategoriaEntity> listarCategorias(int page, int size, String buscar) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("categoriaId").descending());
        return categoriaRepository.buscarCategorias(buscar, pageable);
    }

    public Optional<CategoriaEntity> obtenerPorId(Long id) {
        return categoriaRepository.findById(id);
    }

    public CategoriaEntity guardar(CategoriaEntity categoria) {
        return categoriaRepository.save(categoria);
    }

    public void eliminar(Long id) {
        categoriaRepository.deleteById(id);
    }
}
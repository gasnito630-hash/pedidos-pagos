package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.MetodoEnvioEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.MetodoEnvioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MetodoEnvioService {
    private final MetodoEnvioRepository metodoEnvioRepository;

    // ✅ PAGINACIÓN + BÚSQUEDA
    public Page<MetodoEnvioEntity> listarMetodosEnvio(int page, int size, String buscar) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("metodoId").ascending());
        return metodoEnvioRepository.buscarMetodosEnvio(buscar, pageable);
    }

    public MetodoEnvioEntity guardar(MetodoEnvioEntity metodo) {
        return metodoEnvioRepository.save(metodo);
    }

    public void eliminar(Long id) {
        metodoEnvioRepository.deleteById(id);
    }
}
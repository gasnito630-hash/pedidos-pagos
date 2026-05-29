package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.MetodoEnvioEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MetodoEnvioRepository extends JpaRepository<MetodoEnvioEntity, Long> {
    List<MetodoEnvioEntity> findByActivoTrue();

    // 🔍 Búsqueda con paginación
    @Query("SELECT m FROM MetodoEnvioEntity m WHERE " +
            "(:buscar IS NULL OR :buscar = '' OR " +
            "LOWER(m.nombre) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "LOWER(m.descripcion) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "CAST(m.metodoId AS string) LIKE CONCAT('%', :buscar, '%'))")
    Page<MetodoEnvioEntity> buscarMetodosEnvio(@Param("buscar") String buscar, Pageable pageable);
}
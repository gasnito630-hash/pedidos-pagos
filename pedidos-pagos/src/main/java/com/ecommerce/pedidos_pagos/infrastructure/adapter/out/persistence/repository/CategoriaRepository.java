package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.CategoriaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<CategoriaEntity, Long> {
    List<CategoriaEntity> findByActivoTrue();

    // Búsqueda paginada por Nombre o ID
    @Query("SELECT c FROM CategoriaEntity c WHERE " +
            "(:buscar IS NULL OR :buscar = '' OR " +
            "LOWER(c.nombre) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "CAST(c.categoriaId AS string) LIKE CONCAT('%', :buscar, '%'))")
    Page<CategoriaEntity> buscarCategorias(@Param("buscar") String buscar, Pageable pageable);
}
package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.ProductoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<ProductoEntity, Long> {

    // Métodos personalizados si los necesitas
    List<ProductoEntity> findByCategoria_CategoriaId(Long categoriaId);

    List<ProductoEntity> findByNombreContainingIgnoreCase(String nombre);

    // 🔍 Búsqueda con paginación
    @Query("SELECT p FROM ProductoEntity p LEFT JOIN p.categoria c WHERE " +
            "(:buscar IS NULL OR :buscar = '' OR " +
            "LOWER(p.nombre) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "LOWER(p.sku) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "LOWER(c.nombre) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "CAST(p.productoId AS string) LIKE CONCAT('%', :buscar, '%'))")
    Page<ProductoEntity> buscarProductos(@Param("buscar") String buscar, Pageable pageable);

}
package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.ProductoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProductoRepository extends JpaRepository<ProductoEntity, Long> {

    // Métodos personalizados si los necesitas
    List<ProductoEntity> findByCategoria_CategoriaId(Long categoriaId);

    List<ProductoEntity> findByNombreContainingIgnoreCase(String nombre);
}
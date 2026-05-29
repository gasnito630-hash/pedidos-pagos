package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PagoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<PagoEntity, Long>, JpaSpecificationExecutor<PagoEntity> {

    Optional<PagoEntity> findByPedidoId(Long pedidoId);

    // ✅ Query nativa con nombres de campos CORRECTOS según PagoEntity
    @Query("SELECT p FROM PagoEntity p WHERE " +
            "(:buscar IS NULL OR :buscar = '' OR " +
            "CAST(p.pagoId AS string) LIKE CONCAT('%', :buscar, '%') OR " +
            "CAST(p.pedidoId AS string) LIKE CONCAT('%', :buscar, '%') OR " +
            "LOWER(p.metodoPago) LIKE LOWER(CONCAT('%', :buscar, '%')))")
    Page<PagoEntity> buscarPagos(@Param("buscar") String buscar, Pageable pageable);
}
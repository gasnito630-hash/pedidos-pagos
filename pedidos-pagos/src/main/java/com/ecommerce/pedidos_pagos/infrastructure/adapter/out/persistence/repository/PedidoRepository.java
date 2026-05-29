package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PedidoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<PedidoEntity, Long> {

    // ✅ ESTE MÉTODO ES CRÍTICO:
    List<PedidoEntity> findByUsuarioId(Long usuarioId);

    // 🔍 Búsqueda con paginación
    @Query("SELECT p FROM PedidoEntity p WHERE " +
            "(:buscar IS NULL OR :buscar = '' OR " +
            "CAST(p.pedidoId AS string) LIKE CONCAT('%', :buscar, '%') OR " +
            "LOWER(p.estado) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "CAST(p.usuarioId AS string) LIKE CONCAT('%', :buscar, '%'))")
    Page<PedidoEntity> buscarPedidos(@Param("buscar") String buscar, Pageable pageable);

}
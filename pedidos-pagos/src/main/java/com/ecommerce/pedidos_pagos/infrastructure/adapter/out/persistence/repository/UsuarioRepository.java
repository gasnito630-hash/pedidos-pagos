package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.UsuarioEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<UsuarioEntity, Long> {
    Optional<UsuarioEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    // 🔍 Búsqueda con paginación
    @Query("SELECT u FROM UsuarioEntity u WHERE " +
            "(:buscar IS NULL OR :buscar = '' OR " +
            "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "LOWER(u.apellido) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :buscar, '%')) OR " +
            "CAST(u.usuarioId AS string) LIKE CONCAT('%', :buscar, '%'))")
    Page<UsuarioEntity> buscarUsuarios(@Param("buscar") String buscar, Pageable pageable);
}
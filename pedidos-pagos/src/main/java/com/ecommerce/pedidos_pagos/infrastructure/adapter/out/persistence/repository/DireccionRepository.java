package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.DireccionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DireccionRepository extends JpaRepository<DireccionEntity, Long> {

    List<DireccionEntity> findByUsuarioId(Long usuarioId);

    DireccionEntity findByUsuarioIdAndEsPrincipalTrue(Long usuarioId);

    @Modifying
    @Query("UPDATE DireccionEntity d SET d.esPrincipal = false WHERE d.usuarioId = :usuarioId")
    void desmarcarTodasComoPrincipal(Long usuarioId);
}
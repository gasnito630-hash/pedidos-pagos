package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.MetodoEnvioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MetodoEnvioRepository extends JpaRepository<MetodoEnvioEntity, Long> {
    List<MetodoEnvioEntity> findByActivoTrue();
}
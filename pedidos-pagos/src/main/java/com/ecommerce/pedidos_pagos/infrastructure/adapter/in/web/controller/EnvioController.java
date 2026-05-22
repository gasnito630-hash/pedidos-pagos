package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.MetodoEnvioEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.MetodoEnvioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/envios")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EnvioController {
    private final MetodoEnvioRepository metodoEnvioRepository;

    @GetMapping("/metodos")
    public ResponseEntity<List<MetodoEnvioEntity>> listarMetodos() {
        return ResponseEntity.ok(metodoEnvioRepository.findByActivoTrue());
    }
}
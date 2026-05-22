package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.CategoriaEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoriaController {

    private final CategoriaRepository categoriaRepository;

    @GetMapping
    public ResponseEntity<List<CategoriaEntity>> listarCategorias() {
        List<CategoriaEntity> categorias = categoriaRepository.findByActivoTrue();
        return ResponseEntity.ok(categorias);
    }
}
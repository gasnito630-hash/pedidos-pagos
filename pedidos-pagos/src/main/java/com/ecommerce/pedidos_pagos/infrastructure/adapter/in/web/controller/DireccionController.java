package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.DireccionDTO;
import com.ecommerce.pedidos_pagos.infrastructure.service.DireccionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/direcciones")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DireccionController {

    private final DireccionService direccionService;

    @GetMapping
    public ResponseEntity<List<DireccionDTO>> obtenerDirecciones(
            @RequestParam Long usuarioId) {
        List<DireccionDTO> direcciones = direccionService.obtenerDireccionesPorUsuario(usuarioId);
        return ResponseEntity.ok(direcciones);
    }

    @GetMapping("/principal")
    public ResponseEntity<DireccionDTO> obtenerDireccionPrincipal(
            @RequestParam Long usuarioId) {
        DireccionDTO direccion = direccionService.obtenerDireccionPrincipal(usuarioId);
        return direccion != null ? ResponseEntity.ok(direccion) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<DireccionDTO> crearDireccion(@RequestBody DireccionDTO dto) {
        try {
            DireccionDTO creada = direccionService.crearDireccion(dto);
            return ResponseEntity.ok(creada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DireccionDTO> actualizarDireccion(
            @PathVariable Long id,
            @RequestBody DireccionDTO dto) {
        try {
            DireccionDTO actualizada = direccionService.actualizarDireccion(id, dto);
            return ResponseEntity.ok(actualizada);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarDireccion(@PathVariable Long id) {
        try {
            direccionService.eliminarDireccion(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
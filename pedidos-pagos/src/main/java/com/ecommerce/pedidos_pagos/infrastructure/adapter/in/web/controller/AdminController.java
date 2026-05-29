package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminController {

    // Este controller ahora está VACÍO de CRUDs básicos.
    // Los métodos listarUsuarios, crearProducto, eliminarPedido, etc.
    // ya están en sus propios controllers (UsuarioController, ProductoController,
    // etc.)

    // Puedes dejar este espacio para endpoints específicos del admin que no sean
    // CRUDs simples,
    // por ejemplo: Dashboard Stats, Configuración global, etc.
}
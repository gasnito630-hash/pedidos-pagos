package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.AuthRequest;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.AuthResponse;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.PasswordUpdateRequest;
import com.ecommerce.pedidos_pagos.infrastructure.service.AuthService;
import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // ← Debe tener esto
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService; // ← Inyección por constructor

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody AuthRequest request) {
        try {
            authService.registrar(request);
            return ResponseEntity.ok("Usuario registrado con éxito");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/update-password")
    public ResponseEntity<?> actualizarContraseña(
            @RequestBody PasswordUpdateRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        try {
            // Validar token si está presente (opcional para desarrollo)
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                // Aquí podrías validar el JWT si tienes JwtUtil implementado
                // Por ahora, confiamos en que el frontend envía el token correcto
            }

            // Validar datos de entrada
            if (request.getUsuarioId() == null || request.getNewPassword() == null) {
                return ResponseEntity.badRequest().body("Faltan datos: usuarioId y newPassword son requeridos");
            }

            // Ejecutar actualización
            authService.actualizarContraseña(request.getUsuarioId(), request.getNewPassword());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Contraseña actualizada correctamente"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", "Error interno del servidor"));
        }
    }

}
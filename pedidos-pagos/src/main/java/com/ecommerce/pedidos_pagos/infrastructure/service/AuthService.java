package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.AuthRequest;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.AuthResponse;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.UsuarioEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.UsuarioRepository;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security.JwtUtil; // ← Para generar token real

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil; // ← Inyectar para generar tokens reales

    /**
     * Login de usuario - Retorna token JWT con datos del usuario
     */
    public AuthResponse login(AuthRequest request) {
        UsuarioEntity entity = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.password(), entity.getPassword())) {
            throw new RuntimeException("Contraseña incorrecta");
        }

        // ✅ Generar token JWT real con claims completos
        String token = jwtUtil.generateToken(entity);

        return new AuthResponse(
                token,
                "Bearer",
                entity.getRol(),
                entity.getUsuarioId(),
                entity.getNombre(),
                entity.getEmail());
    }

    /**
     * Registro simple con AuthRequest (para frontend de registro)
     */
    @Transactional
    public UsuarioEntity registrar(AuthRequest request) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        UsuarioEntity nuevo = new UsuarioEntity();
        nuevo.setEmail(request.email());
        nuevo.setPassword(passwordEncoder.encode(request.password()));
        nuevo.setNombre("Nuevo"); // Puedes pedir nombre en AuthRequest si quieres
        nuevo.setApellido("Usuario");
        nuevo.setRol("CLIENTE");
        nuevo.setActivo(true);
        nuevo.setCreadoEn(LocalDateTime.now());

        return usuarioRepository.save(nuevo);
    }

    /**
     * Registro completo para ADMIN (crea usuarios con rol personalizado)
     * ← ESTE es el que usa AdminController
     */
    @Transactional
    public UsuarioEntity registrarCompleto(String email, String password, String nombre, String rol) {
        if (usuarioRepository.existsByEmail(email)) { // ← Usa existsByEmail si existe
            throw new RuntimeException("El email ya está registrado");
        }

        UsuarioEntity nuevo = new UsuarioEntity();
        nuevo.setEmail(email);
        nuevo.setPassword(passwordEncoder.encode(password));
        nuevo.setNombre(nombre);
        nuevo.setRol(rol != null ? rol : "CLIENTE");
        nuevo.setActivo(true);
        nuevo.setCreadoEn(LocalDateTime.now());

        return usuarioRepository.save(nuevo);
    }

    /**
     * Actualizar usuario - Para ADMIN
     * ← ESTE es el que usa AdminController
     */
    @Transactional
    public UsuarioEntity actualizarUsuario(Long id, UsuarioEntity datos) {
        UsuarioEntity usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuario.setNombre(datos.getNombre());
        usuario.setEmail(datos.getEmail());
        usuario.setRol(datos.getRol());

        // Si hay nueva contraseña, encriptarla
        if (datos.getPassword() != null && !datos.getPassword().isEmpty()) {
            usuario.setPassword(passwordEncoder.encode(datos.getPassword()));
        }

        return usuarioRepository.save(usuario);
    }

    /**
     * Cambiar contraseña - Para el propio usuario
     */
    @Transactional
    public boolean actualizarContraseña(Long usuarioId, String nuevaContraseña) {
        UsuarioEntity usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (nuevaContraseña == null || nuevaContraseña.length() < 6) {
            throw new RuntimeException("La contraseña debe tener al menos 6 caracteres");
        }

        usuario.setPassword(passwordEncoder.encode(nuevaContraseña));
        usuarioRepository.save(usuario);

        return true;
    }

    /**
     * Obtener usuario por ID - Helper para admin
     */
    public UsuarioEntity obtenerUsuarioPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @Transactional
    public UsuarioEntity registrarUsuarioCompleto(String email, String password, String nombre, String apellido,
            String rol) {
        if (usuarioRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        UsuarioEntity nuevo = new UsuarioEntity();
        nuevo.setEmail(email);
        nuevo.setPassword(passwordEncoder.encode(password));
        nuevo.setNombre(nombre);
        nuevo.setApellido(apellido); // ✅ AGREGAR APELLIDO
        nuevo.setRol(rol != null ? rol : "CLIENTE");
        nuevo.setActivo(true);
        nuevo.setCreadoEn(LocalDateTime.now());

        return usuarioRepository.save(nuevo);
    }
}
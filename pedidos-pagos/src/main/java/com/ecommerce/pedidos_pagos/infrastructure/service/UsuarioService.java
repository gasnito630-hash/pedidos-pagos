package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.UsuarioEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;

    // ✅ PAGINACIÓN + BÚSQUEDA
    public Page<UsuarioEntity> listarUsuarios(int page, int size, String buscar) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("usuarioId").descending());
        return usuarioRepository.buscarUsuarios(buscar, pageable);
    }

    public UsuarioEntity guardar(UsuarioEntity usuario) {
        return usuarioRepository.save(usuario);
    }

    public void eliminar(Long id) {
        usuarioRepository.deleteById(id);
    }

    // AGREGAR ESTE MÉTODO en UsuarioService.java
    public UsuarioEntity obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
    }
}
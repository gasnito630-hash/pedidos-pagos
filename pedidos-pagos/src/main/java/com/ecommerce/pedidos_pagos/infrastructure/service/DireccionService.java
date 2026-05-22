package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.DireccionDTO;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.DireccionEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.DireccionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DireccionService {

    private final DireccionRepository direccionRepository;

    public List<DireccionDTO> obtenerDireccionesPorUsuario(Long usuarioId) {
        return direccionRepository.findByUsuarioId(usuarioId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public DireccionDTO crearDireccion(DireccionDTO dto) {
        // Si es principal, desmarcar las demás del mismo usuario
        if (Boolean.TRUE.equals(dto.getEsPrincipal())) {
            direccionRepository.desmarcarTodasComoPrincipal(dto.getUsuarioId());
        }

        DireccionEntity entity = new DireccionEntity();
        entity.setUsuarioId(dto.getUsuarioId());
        entity.setCalle(dto.getCalle());
        entity.setNumero(dto.getNumero());
        entity.setCiudad(dto.getCiudad());
        entity.setPais(dto.getPais());
        entity.setEsPrincipal(dto.getEsPrincipal() != null ? dto.getEsPrincipal() : false);

        DireccionEntity saved = direccionRepository.save(entity);
        return mapToDTO(saved);
    }

    @Transactional
    public DireccionDTO actualizarDireccion(Long direccionId, DireccionDTO dto) {
        DireccionEntity entity = direccionRepository.findById(direccionId)
                .orElseThrow(() -> new RuntimeException("Dirección no encontrada"));

        // Si es principal, desmarcar las demás
        if (Boolean.TRUE.equals(dto.getEsPrincipal())) {
            direccionRepository.desmarcarTodasComoPrincipal(entity.getUsuarioId());
        }

        entity.setCalle(dto.getCalle());
        entity.setNumero(dto.getNumero());
        entity.setCiudad(dto.getCiudad());
        entity.setPais(dto.getPais());
        entity.setEsPrincipal(dto.getEsPrincipal() != null ? dto.getEsPrincipal() : false);

        DireccionEntity saved = direccionRepository.save(entity);
        return mapToDTO(saved);
    }

    @Transactional
    public void eliminarDireccion(Long direccionId) {
        if (!direccionRepository.existsById(direccionId)) {
            throw new RuntimeException("Dirección no encontrada");
        }
        direccionRepository.deleteById(direccionId);
    }

    public DireccionDTO obtenerDireccionPrincipal(Long usuarioId) {
        DireccionEntity entity = direccionRepository.findByUsuarioIdAndEsPrincipalTrue(usuarioId);
        return entity != null ? mapToDTO(entity) : null;
    }

    private DireccionDTO mapToDTO(DireccionEntity entity) {
        DireccionDTO dto = new DireccionDTO();
        dto.setDireccionId(entity.getDireccionId());
        dto.setUsuarioId(entity.getUsuarioId());
        dto.setCalle(entity.getCalle());
        dto.setNumero(entity.getNumero());
        dto.setCiudad(entity.getCiudad());
        dto.setPais(entity.getPais());
        dto.setEsPrincipal(entity.getEsPrincipal());
        return dto;
    }
}
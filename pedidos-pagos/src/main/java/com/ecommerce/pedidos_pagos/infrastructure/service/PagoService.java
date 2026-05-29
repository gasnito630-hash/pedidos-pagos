package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PagoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;

    // ✅ LISTAR CON PAGINACIÓN Y BÚSQUEDA
    public Page<PagoEntity> listar(int page, int size, String buscar) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaPago").descending());
        return pagoRepository.buscarPagos(buscar, pageable);
    }

    // ✅ GUARDAR (CREAR O ACTUALIZAR)
    @Transactional
    public PagoEntity guardar(PagoEntity pago) {
        if (pago.getFechaPago() == null) {
            pago.setFechaPago(LocalDateTime.now());
        }
        if (pago.getEstadoPago() == null) {
            pago.setEstadoPago("COMPLETADO");
        }
        return pagoRepository.save(pago);
    }

    // ✅ ELIMINAR
    @Transactional
    public void eliminar(Long id) {
        pagoRepository.deleteById(id);
    }

    // ✅ OBTENER POR ID
    public PagoEntity obtenerPorId(Long id) {
        return pagoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado con ID: " + id));
    }

    // ✅ OBTENER PAGOS POR USUARIO (simplificado)
    public List<PagoEntity> obtenerPagosPorUsuario(Long usuarioId) {
        return pagoRepository.findAll(); // En producción, filtrar por usuario a través de Pedido
    }

    // ✅ OBTENER PAGO POR ID
    public PagoEntity obtenerPagoPorId(Long pagoId) {
        return pagoRepository.findById(pagoId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado con ID: " + pagoId));
    }

    // ✅ OBTENER PAGO POR PEDIDO
    public PagoEntity obtenerPagoPorPedido(Long pedidoId) {
        return pagoRepository.findByPedidoId(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado para el pedido: " + pedidoId));
    }

    // ✅ LISTAR PARA ADMIN CON PAGINACIÓN Y BÚSQUEDA (usando Specification)
    public Page<PagoEntity> listarAdmin(int page, int size, String buscar) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaPago").descending());

        if (buscar == null || buscar.isEmpty()) {
            return pagoRepository.findAll(pageable);
        }

        // ✅ Specification con nombres de campos CORRECTOS según PagoEntity
        Specification<PagoEntity> spec = (root, query, cb) -> {
            String likePattern = "%" + buscar.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("metodoPago")), likePattern),
                    cb.like(cb.lower(root.get("estadoPago")), likePattern),
                    cb.like(cb.lower(root.get("transaccionExterna")), likePattern),
                    cb.like(cb.lower(root.get("pedidoId").as(String.class)), likePattern),
                    cb.like(cb.lower(root.get("pagoId").as(String.class)), likePattern));
        };

        return pagoRepository.findAll(spec, pageable);
    }
}
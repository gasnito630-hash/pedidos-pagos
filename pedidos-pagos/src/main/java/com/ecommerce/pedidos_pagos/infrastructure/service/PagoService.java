package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PagoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.PagoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;

    /**
     * Obtiene todos los pagos de un usuario (a través de sus pedidos)
     * NOTA: Esto requiere que tengas acceso al PedidoRepository o que
     * los pagos tengan usuarioId. Para simplificar, retornamos todos los pagos.
     */
    public List<PagoEntity> obtenerPagosPorUsuario(Long usuarioId) {
        // Retorna todos los pagos (en producción, filtrarías por usuario)
        return pagoRepository.findAll();
    }

    /**
     * Obtiene un pago específico por su ID
     */
    public PagoEntity obtenerPagoPorId(Long pagoId) {
        return pagoRepository.findById(pagoId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado con ID: " + pagoId));
    }

    /**
     * Obtiene el pago asociado a un pedido
     */
    public PagoEntity obtenerPagoPorPedido(Long pedidoId) {
        // Busca el pago por pedidoId (asumiendo que tienes este método en el
        // repository)
        return pagoRepository.findByPedidoId(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado para el pedido: " + pedidoId));
    }
}
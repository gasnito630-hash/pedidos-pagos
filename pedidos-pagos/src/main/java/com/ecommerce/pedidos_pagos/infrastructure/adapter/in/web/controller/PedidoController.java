package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.PedidoRequestDTO;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.PedidoResponseDTO;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.EnvioEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PagoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PedidoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.DetallePedidoRepository;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.EnvioRepository;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.PagoRepository;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.PedidoRepository;
import com.ecommerce.pedidos_pagos.infrastructure.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos") // ← BASE PATH: /api/pedidos
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PedidoController {

    private final PedidoService pedidoService;
    private final DetallePedidoRepository detalleRepository;
    private final PagoRepository pagoRepository;
    private final EnvioRepository envioRepository;
    private final PedidoRepository pedidoRepository;

    // ✅ POST /api/pedidos
    @PostMapping
    public ResponseEntity<?> crearPedido(
            @RequestBody PedidoRequestDTO request,
            @RequestHeader(value = "X-Usuario-ID", required = false) Long usuarioId) {

        if (usuarioId == null)
            usuarioId = 1L;

        try {
            PedidoResponseDTO pedido = pedidoService.crearPedido(request, usuarioId);
            return ResponseEntity.ok(java.util.Map.of(
                    "pedidoId", pedido.getPedidoId(),
                    "estado", pedido.getEstado(),
                    "montoTotal", pedido.getMontoTotal()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // ✅ GET /api/pedidos/mis-pedidos?usuarioId=1 ← ESTE ES EL QUE FALTABA
    @GetMapping("/mis-pedidos")
    public ResponseEntity<List<PedidoResponseDTO>> obtenerMisPedidos(@RequestParam Long usuarioId) {
        try {
            List<PedidoResponseDTO> pedidos = pedidoService.obtenerPedidosPorUsuario(usuarioId);
            return ResponseEntity.ok(pedidos);
        } catch (Exception e) {
            System.err.println("Error al obtener pedidos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    // ✅ GET /api/pedidos/{pedidoId}
    @GetMapping("/{pedidoId}")
    public ResponseEntity<PedidoResponseDTO> obtenerDetallePedido(@PathVariable Long pedidoId) {
        try {
            PedidoResponseDTO pedido = pedidoService.obtenerPedidoDetalle(pedidoId);
            return ResponseEntity.ok(pedido);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CLIENTE') or hasRole('ADMIN')")
    public ResponseEntity<?> eliminarPedido(@PathVariable Long id,
            @RequestHeader(value = "X-Usuario-ID", required = false) Long usuarioId) {
        try {
            PedidoEntity pedido = pedidoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

            // Verificar que el pedido pertenezca al usuario
            if (!pedido.getUsuarioId().equals(usuarioId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permiso para eliminar este pedido"));
            }

            // Solo se puede eliminar si está PENDIENTE
            if (!"PENDIENTE".equalsIgnoreCase(pedido.getEstado())) {
                return ResponseEntity.badRequest().body(Map.of("error",
                        "Solo se pueden eliminar pedidos en estado PENDIENTE. Estado actual: " + pedido.getEstado()));
            }

            // Eliminar detalles del pedido primero (por foreign key)
            detalleRepository.deleteByPedidoId(id);

            // Eliminar pago asociado (si existe)
            PagoEntity pago = pagoRepository.findByPedidoId(id).orElse(null);
            if (pago != null) {
                pagoRepository.delete(pago);
            }

            // Eliminar envío asociado (si existe)
            EnvioEntity envio = envioRepository.findByPedidoId(id).orElse(null);
            if (envio != null) {
                envioRepository.delete(envio);
            }

            // Finalmente eliminar el pedido
            pedidoRepository.deleteById(id);

            return ResponseEntity.ok(Map.of("message", "Pedido eliminado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}
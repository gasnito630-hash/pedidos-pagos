package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.PedidoRequestDTO;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.PedidoResponseDTO;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.*;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class PedidoService {

        private final PedidoRepository pedidoRepository;
        private final DetallePedidoRepository detalleRepository;
        private final PagoRepository pagoRepository;
        private final ProductoRepository productoRepository;
        private final DireccionRepository direccionRepository;

        public Page<PedidoEntity> listarPedidos(int page, int size, String buscar) {
                Pageable pageable = PageRequest.of(page, size, Sort.by("pedidoId").descending());
                return pedidoRepository.buscarPedidos(buscar, pageable);
        }

        // ✅ Para gestión de envíos
        private final MetodoEnvioRepository metodoEnvioRepository;
        private final EnvioRepository envioRepository;
        private final org.springframework.transaction.PlatformTransactionManager transactionManager;

        // ==================== MÉTODOS EXISTENTES ====================

        @Transactional
        public PedidoResponseDTO crearPedido(PedidoRequestDTO request, Long usuarioId) {
                // 1. Obtener método de envío seleccionado
                MetodoEnvioEntity metodoEnvio = null;
                BigDecimal costoEnvio = BigDecimal.ZERO;
                int diasEntregaEstimados = 3;

                if (request.getMetodoEnvioId() != null) {
                        metodoEnvio = metodoEnvioRepository.findById(request.getMetodoEnvioId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Método de envío no válido: " + request.getMetodoEnvioId()));
                        costoEnvio = metodoEnvio.getCostoBase() != null ? metodoEnvio.getCostoBase() : BigDecimal.ZERO;
                        diasEntregaEstimados = metodoEnvio.getDiasEntregaMax() != null ? metodoEnvio.getDiasEntregaMax()
                                        : 3;
                }

                // 2. Crear el pedido
                PedidoEntity pedido = new PedidoEntity();
                pedido.setUsuarioId(usuarioId);
                pedido.setEstado("PENDIENTE");
                pedido.setDireccionEnvio(request.getDireccionEnvio());
                pedido.setTelefonoContacto(request.getTelefonoContacto());
                pedido.setMontoTotal(BigDecimal.ZERO);

                PedidoEntity pedidoGuardado = pedidoRepository.save(pedido);
                Long pedidoId = pedidoGuardado.getPedidoId();

                BigDecimal totalProductos = BigDecimal.ZERO;

                // 3. Procesar cada item
                for (PedidoRequestDTO.ItemPedidoDTO itemDTO : request.getItems()) {
                        ProductoEntity producto = productoRepository.findById(itemDTO.getProductoId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Producto no encontrado: " + itemDTO.getProductoId()));

                        if (producto.getStock() < itemDTO.getCantidad()) {
                                throw new RuntimeException("Stock insuficiente para: " + producto.getNombre());
                        }

                        producto.setStock(producto.getStock() - itemDTO.getCantidad());
                        productoRepository.save(producto);

                        BigDecimal subtotal = producto.getPrecio().multiply(BigDecimal.valueOf(itemDTO.getCantidad()));

                        DetallePedidoEntity detalle = new DetallePedidoEntity();
                        detalle.setPedidoId(pedidoId);
                        detalle.setProductoId(itemDTO.getProductoId());
                        detalle.setCantidad(itemDTO.getCantidad());
                        detalle.setPrecioUnitario(producto.getPrecio());

                        detalleRepository.save(detalle);
                        totalProductos = totalProductos.add(subtotal);
                }

                // 4. Calcular total final
                BigDecimal totalFinal = totalProductos.add(costoEnvio);
                pedidoGuardado.setMontoTotal(totalFinal);
                pedidoRepository.save(pedidoGuardado);

                // 5. Crear registro de envío
                EnvioEntity envio = new EnvioEntity();
                envio.setPedidoId(pedidoId);
                if (metodoEnvio != null) {
                        envio.setMetodoEnvioId(metodoEnvio.getMetodoId());
                }
                envio.setEstadoEnvio("PREPARANDO");
                envio.setFechaEstimadaEntrega(LocalDateTime.now().plusDays(diasEntregaEstimados));
                envio.setNumeroTracking("TRK-" + pedidoId + "-" + System.currentTimeMillis());
                envioRepository.save(envio);

                // 6. Crear registro de pago
                PagoEntity pago = new PagoEntity();
                pago.setPedidoId(pedidoId);
                pago.setMetodoPago(request.getMetodoPago() != null ? request.getMetodoPago().toUpperCase()
                                : "NO ESPECIFICADO");
                pago.setMonto(totalFinal);
                pago.setEstadoPago("COMPLETADO");
                pago.setFechaPago(LocalDateTime.now());
                pagoRepository.save(pago);

                System.out.println("✅ Pago creado - Método: " + pago.getMetodoPago());

                return obtenerPedidoDetalle(pedidoId);
        }

        public List<PedidoResponseDTO> obtenerPedidosPorUsuario(Long usuarioId) {
                List<PedidoEntity> pedidos = pedidoRepository.findByUsuarioId(usuarioId);
                return pedidos.stream()
                                .map(p -> obtenerPedidoDetalle(p.getPedidoId()))
                                .collect(Collectors.toList());
        }

        public PedidoResponseDTO obtenerPedidoDetalle(Long pedidoId) {
                PedidoEntity pedido = pedidoRepository.findById(pedidoId)
                                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

                List<DetallePedidoEntity> detalles = detalleRepository.findByPedidoId(pedidoId);

                PagoEntity pago = pagoRepository.findByPedidoId(pedidoId).orElse(null);
                EnvioEntity envio = envioRepository.findByPedidoId(pedidoId).orElse(null);
                MetodoEnvioEntity metodoEnvio = null;
                if (envio != null && envio.getMetodoEnvioId() != null) {
                        metodoEnvio = metodoEnvioRepository.findById(envio.getMetodoEnvioId()).orElse(null);
                }

                PedidoResponseDTO dto = new PedidoResponseDTO();
                dto.setPedidoId(pedido.getPedidoId());
                dto.setUsuarioId(pedido.getUsuarioId());
                dto.setCreadoEn(pedido.getCreadoEn());
                dto.setEstado(pedido.getEstado());
                dto.setMontoTotal(pedido.getMontoTotal());
                dto.setDireccionEnvio(pedido.getDireccionEnvio() != null ? pedido.getDireccionEnvio()
                                : "Dirección no especificada");
                dto.setTelefonoContacto(pedido.getTelefonoContacto());
                dto.setMetodoPago(pago != null && pago.getMetodoPago() != null ? pago.getMetodoPago()
                                : "No especificado");

                if (metodoEnvio != null) {
                        dto.setMetodoEnvioNombre(metodoEnvio.getNombre());
                        dto.setCostoEnvio(metodoEnvio.getCostoBase());
                }
                if (envio != null) {
                        dto.setNumeroTracking(envio.getNumeroTracking());
                        dto.setEstadoEnvio(envio.getEstadoEnvio());
                        dto.setFechaEstimadaEntrega(envio.getFechaEstimadaEntrega());
                }

                // Mapear items
                List<PedidoResponseDTO.ItemPedidoDTO> items = detalles.stream()
                                .map(detalle -> {
                                        ProductoEntity producto = productoRepository.findById(detalle.getProductoId())
                                                        .orElse(null);

                                        PedidoResponseDTO.ItemPedidoDTO itemDTO = new PedidoResponseDTO.ItemPedidoDTO();
                                        itemDTO.setProductoId(detalle.getProductoId());
                                        itemDTO.setNombreProducto(producto != null ? producto.getNombre()
                                                        : "Producto desconocido");
                                        itemDTO.setCantidad(detalle.getCantidad());
                                        itemDTO.setPrecioUnitario(detalle.getPrecioUnitario());
                                        itemDTO.setSubtotal(detalle.getSubtotal() != null ? detalle.getSubtotal()
                                                        : detalle.getPrecioUnitario().multiply(
                                                                        BigDecimal.valueOf(detalle.getCantidad())));

                                        // ✅ AGREGAR IMAGEN URL
                                        itemDTO.setImagenUrl(producto != null ? producto.getImagenUrl() : null);

                                        return itemDTO;
                                })
                                .collect(Collectors.toList());

                dto.setItems(items);
                return dto;
        }

        /**
         * Elimina un pedido solo si está en estado PENDIENTE
         */
        @Transactional(rollbackFor = Exception.class) // ← CRÍTICO: Transacción en el SERVICE
        public void eliminarPedidoSiPendiente(Long pedidoId, Long usuarioId) {

                try {
                        System.out.println(" Iniciando eliminación del pedido #" + pedidoId);

                        // 1. Buscar y validar
                        PedidoEntity pedido = pedidoRepository.findById(pedidoId)
                                        .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

                        if (!pedido.getUsuarioId().equals(usuarioId)) {
                                throw new RuntimeException("No tienes permiso para eliminar este pedido");
                        }

                        if (!"PENDIENTE".equalsIgnoreCase(pedido.getEstado())) {
                                throw new RuntimeException("Solo pedidos PENDIENTE pueden eliminarse. Estado: "
                                                + pedido.getEstado());
                        }

                        // 2. Restaurar stock
                        System.out.println("📦 Restaurando stock...");
                        List<DetallePedidoEntity> detalles = detalleRepository.findByPedidoId(pedidoId);

                        for (DetallePedidoEntity detalle : detalles) {
                                productoRepository.findById(detalle.getProductoId()).ifPresent(producto -> {
                                        int nuevoStock = producto.getStock() + detalle.getCantidad();
                                        producto.setStock(nuevoStock);
                                        productoRepository.save(producto);
                                        System.out.println("  ✅ " + producto.getNombre() + ": stock + "
                                                        + detalle.getCantidad());
                                });
                        }

                        // 3. Eliminar registros relacionados
                        System.out.println("🗑️ Eliminando detalles...");
                        detalleRepository.deleteByPedidoId(pedidoId);

                        System.out.println("🗑️ Eliminando pago...");
                        pagoRepository.findByPedidoId(pedidoId).ifPresent(p -> {
                                pagoRepository.delete(p);
                        });

                        System.out.println("🗑️ Eliminando envío...");
                        envioRepository.findByPedidoId(pedidoId).ifPresent(e -> {
                                envioRepository.delete(e);
                        });

                        // 4. Eliminar pedido
                        System.out.println("🗑️ Eliminando pedido...");
                        pedidoRepository.deleteById(pedidoId);

                        System.out.println("✅ Pedido #" + pedidoId + " eliminado exitosamente");

                } catch (Exception e) {
                        System.err.println("❌ Error al eliminar pedido: " + e.getMessage());
                        e.printStackTrace();
                        throw new RuntimeException("Error al eliminar el pedido: " + e.getMessage());
                }
        }

}
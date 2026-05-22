package com.ecommerce.pedidos_pagos.infrastructure.service;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.VentasReporteDTO;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PedidoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteVentasService {

    private final PedidoRepository pedidoRepository;

    @SuppressWarnings("deprecation")
    public VentasReporteDTO generarReporte(LocalDate fechaInicio, LocalDate fechaFin) {
        VentasReporteDTO reporte = new VentasReporteDTO();
        reporte.setFechaInicio(fechaInicio);
        reporte.setFechaFin(fechaFin);

        List<PedidoEntity> pedidos = pedidoRepository.findAll();

        // Filtrar por fecha
        List<PedidoEntity> pedidosFiltrados = pedidos.stream()
                .filter(p -> {
                    LocalDate fechaPedido = p.getCreadoEn().toLocalDate();
                    return !fechaPedido.isBefore(fechaInicio) && !fechaPedido.isAfter(fechaFin);
                })
                .collect(Collectors.toList());

        // Totales generales
        BigDecimal totalVentas = pedidosFiltrados.stream()
                .filter(p -> "COMPLETADO".equals(p.getEstado()) || "ENVIADO".equals(p.getEstado())
                        || "PAGADO".equals(p.getEstado()))
                .map(PedidoEntity::getMontoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        reporte.setTotalVentas(totalVentas);
        reporte.setTotalPedidos((long) pedidosFiltrados.size());
        reporte.setTotalClientes((long) pedidosFiltrados.stream().map(PedidoEntity::getUsuarioId).distinct().count());
        reporte.setTicketPromedio(pedidosFiltrados.isEmpty() ? BigDecimal.ZERO
                : totalVentas.divide(BigDecimal.valueOf(pedidosFiltrados.size()), 2, BigDecimal.ROUND_HALF_UP));

        // Ventas por estado
        Map<String, List<PedidoEntity>> porEstado = pedidosFiltrados.stream()
                .collect(Collectors.groupingBy(PedidoEntity::getEstado));

        List<VentasReporteDTO.VentaPorEstadoDTO> ventasPorEstado = porEstado.entrySet().stream()
                .map(entry -> {
                    VentasReporteDTO.VentaPorEstadoDTO dto = new VentasReporteDTO.VentaPorEstadoDTO();
                    dto.setEstado(entry.getKey());
                    dto.setCantidad((long) entry.getValue().size());
                    dto.setMontoTotal(entry.getValue().stream()
                            .map(PedidoEntity::getMontoTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
                    return dto;
                })
                .collect(Collectors.toList());
        reporte.setVentasPorEstado(ventasPorEstado);

        // Ventas por día
        Map<LocalDate, List<PedidoEntity>> porDia = pedidosFiltrados.stream()
                .collect(Collectors.groupingBy(p -> p.getCreadoEn().toLocalDate()));

        List<VentasReporteDTO.VentaDiariaDTO> ventasPorDia = porDia.entrySet().stream()
                .map(entry -> {
                    VentasReporteDTO.VentaDiariaDTO dto = new VentasReporteDTO.VentaDiariaDTO();
                    dto.setFecha(entry.getKey());
                    dto.setCantidadPedidos((long) entry.getValue().size());
                    dto.setMontoTotal(entry.getValue().stream()
                            .map(PedidoEntity::getMontoTotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add));
                    return dto;
                })
                .sorted(Comparator.comparing(VentasReporteDTO.VentaDiariaDTO::getFecha))
                .collect(Collectors.toList());
        reporte.setVentasPorDia(ventasPorDia);

        return reporte;
    }
}
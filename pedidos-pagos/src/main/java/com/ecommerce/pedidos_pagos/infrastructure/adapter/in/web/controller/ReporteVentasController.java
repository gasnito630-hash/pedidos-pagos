package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.VentasReporteDTO;
import com.ecommerce.pedidos_pagos.infrastructure.service.ReporteVentasService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reportes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReporteVentasController {

    private final ReporteVentasService reporteVentasService;

    @GetMapping("/ventas")
    public ResponseEntity<VentasReporteDTO> obtenerReporteVentas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {

        VentasReporteDTO reporte = reporteVentasService.generarReporte(fechaInicio, fechaFin);
        return ResponseEntity.ok(reporte);
    }
}
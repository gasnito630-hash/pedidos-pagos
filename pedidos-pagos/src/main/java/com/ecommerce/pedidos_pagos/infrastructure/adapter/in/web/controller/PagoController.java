package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PagoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    public ResponseEntity<List<PagoEntity>> obtenerPagos(@RequestParam Long usuarioId) {
        List<PagoEntity> pagos = pagoService.obtenerPagosPorUsuario(usuarioId);
        return ResponseEntity.ok(pagos);
    }

    @GetMapping("/{pagoId}")
    public ResponseEntity<PagoEntity> obtenerPago(@PathVariable Long pagoId) {
        PagoEntity pago = pagoService.obtenerPagoPorId(pagoId);
        return ResponseEntity.ok(pago);
    }

    @GetMapping("/pedido/{pedidoId}")
    public ResponseEntity<PagoEntity> obtenerPagoPorPedido(@PathVariable Long pedidoId) {
        PagoEntity pago = pagoService.obtenerPagoPorPedido(pedidoId);
        return ResponseEntity.ok(pago);
    }
}
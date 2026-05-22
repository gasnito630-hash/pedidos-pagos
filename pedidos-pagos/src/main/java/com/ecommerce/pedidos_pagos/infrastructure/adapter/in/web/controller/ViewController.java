package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller // ← IMPORTANTE: Este debe ser @Controller, NO @RestController
public class ViewController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html"; // Redirige la raíz al login directamente
    }

    @GetMapping("/registro")
    public String registro() {
        return "forward:/registro.html"; // Mapea la ruta de registro
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "forward:/dashboard.html"; // Mapea la ruta del panel de control
    }
}

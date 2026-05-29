package com.ecommerce.pedidos_pagos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.event.EventListener;
import org.springframework.boot.context.event.ApplicationReadyEvent;

@SpringBootApplication
public class PedidosPagosApplication {

    public static void main(String[] args) {
        // ✅ Forma estándar de iniciar Spring Boot
        SpringApplication.run(PedidosPagosApplication.class, args);
    }

    // ✅ Log de confirmación cuando la app está lista
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        String port = System.getenv("PORT");
        String hostname = System.getenv("RENDER_EXTERNAL_HOSTNAME");
        
        System.out.println("✅ ✅ ✅ PEDIDOS-PAGOS APP LISTA EN RENDER ✅ ✅ ✅");
        System.out.println("🔌 Puerto: " + (port != null ? port : "default"));
        System.out.println("💾 Memoria máxima: " + Runtime.getRuntime().maxMemory() / (1024 * 1024) + "MB");
        System.out.println("🌐 URL: https://" + (hostname != null ? hostname : "localhost"));
    }
}

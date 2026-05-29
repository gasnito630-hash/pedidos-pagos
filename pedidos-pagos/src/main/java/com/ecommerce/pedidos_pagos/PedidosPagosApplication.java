package com.ecommerce.pedidos_pagos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
@EnableTransactionManagement // ← ESTO HABILITA @Transactional
public class PedidosPagosApplication {
	public static void main(String[] args) {
		SpringApplication.run(PedidosPagosApplication.class, args);
		app.addListeners(event -> {
            if (event instanceof ApplicationReadyEvent) {
                String port = System.getenv("PORT");
                System.out.println("✅ ✅ ✅ APP LISTA EN RENDER (FREE TIER) ✅ ✅ ✅");
                System.out.println("🔌 Escuchando en puerto: " + (port != null ? port : "default"));
                System.out.println("💾 Memoria máxima: " + Runtime.getRuntime().maxMemory() / (1024 * 1024) + "MB");
            }
        });
        
        app.run(args);
	}
}

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
	}
}

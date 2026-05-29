package com.ecommerce.pedidos_pagos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

@Configuration
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class WebConfig {
    // Esta configuración hace que Spring Data serialize Page<T>
    // como un DTO estable con: content, totalPages, totalElements, etc.
}
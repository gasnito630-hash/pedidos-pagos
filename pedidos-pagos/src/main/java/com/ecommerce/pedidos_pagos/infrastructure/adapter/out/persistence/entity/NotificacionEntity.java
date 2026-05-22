package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "Notificacion")
@Data
public class NotificacionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NotificacionID")
    private Long notificacionId;

    @Column(name = "UsuarioID")
    private Long usuarioId;
    @Column(name = "Titulo")
    private String titulo;
    @Column(name = "Mensaje")
    private String mensaje;
    @Column(name = "Leida")
    private Boolean leida;
    @Column(name = "FechaCreacion")
    private LocalDateTime fechaCreacion;
}
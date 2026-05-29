package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuario")
@Data
public class UsuarioEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usuarioid")
    private Long usuarioid;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 100)
    private String apellido;

    @Column(name = "rol", nullable = false, length = 20)
    private String rol;

    @Column(name = "activo")
    private Boolean activo;

    @Column(name = "creadoen")
    private LocalDateTime creadoen;

    public Long getUsuarioid() {
        return usuarioid;
    }

    public void setUsuarioid(Long usuarioid) {
        this.usuarioid = usuarioid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public java.time.LocalDateTime getCreadoen() {
        return creadoen;
    }

    public void setCreadoen(java.time.LocalDateTime creadoen) {
        this.creadoen = creadoen;
    }

}

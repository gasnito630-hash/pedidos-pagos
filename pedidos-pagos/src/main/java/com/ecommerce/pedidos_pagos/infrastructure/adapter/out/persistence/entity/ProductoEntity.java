package com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Entity
@Table(name = "Producto", schema = "dbo")
public class ProductoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ProductoID")
    private Long productoId;

    @Column(name = "Nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "SKU", nullable = false, length = 20, unique = true)
    private String sku;

    @Column(name = "Precio", nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "Stock", nullable = false)
    private Integer stock;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "CategoriaID")
    private CategoriaEntity categoria;

    // ✅ ESTE CAMPO DEBE ESTAR AQUÍ
    @Column(name = "ImagenURL", length = 500)
    private String imagenUrl;

    // Si usas relaciones inversas, pueden estar aquí
    // @OneToMany(mappedBy = "producto")
    // private List<PedidoProductoEntity> pedidoProductos;

    // Getters y Setters manuales (por si Lombok falla)
    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public CategoriaEntity getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaEntity categoria) {
        this.categoria = categoria;
    }

    // ✅ GETTER Y SETTER PARA imagenUrl (CRÍTICO)
    public String getImagenUrl() {
        System.out.println("DEBUG: getImagenUrl llamado para " + nombre + " = " + imagenUrl);
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }
}
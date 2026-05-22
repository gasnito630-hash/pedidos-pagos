package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.controller;

// ✅ IMPORTS NECESARIOS (esto soluciona el rojo en ResponseEntity)
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;

// ✅ Usa UsuarioEntity (NO Usuario domain) para ser consistente con Repository/Service
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.UsuarioEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.ProductoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.dto.ProductoDTO;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.CategoriaEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.PedidoEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.*;
import com.ecommerce.pedidos_pagos.infrastructure.service.AuthService;

import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*")
public class AdminController {

    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;
    private final CategoriaRepository categoriaRepository; // ← AGREGAR
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder; // ← AGREGAR ESTO

    // === PRODUCTOS ===

    @GetMapping("/products")
    public ResponseEntity<List<ProductoEntity>> listarProductos() {
        return ResponseEntity.ok(productoRepository.findAll());
    }

    @PostMapping("/products")
    public ResponseEntity<ProductoEntity> crearProducto(@RequestBody ProductoDTO productoDTO) {
        System.out.println("DEBUG: Creando producto - Nombre: " + productoDTO.getNombre());
        System.out.println("DEBUG: CategoriaID: " + productoDTO.getCategoriaId());
        System.out.println("DEBUG: ImagenURL: " + productoDTO.getImagenUrl()); // ← DEBUG

        try {
            // 1. Convertir DTO a Entity
            ProductoEntity producto = new ProductoEntity();
            producto.setNombre(productoDTO.getNombre());
            producto.setSku(productoDTO.getSku());
            producto.setPrecio(productoDTO.getPrecio());
            producto.setStock(productoDTO.getStock());
            producto.setImagenUrl(productoDTO.getImagenUrl()); // ← GUARDAR IMAGEN

            // 2. Cargar la categoría desde la BD
            if (productoDTO.getCategoriaId() != null) {
                CategoriaEntity categoria = categoriaRepository.findById(productoDTO.getCategoriaId())
                        .orElseThrow(
                                () -> new RuntimeException("Categoría no encontrada: " + productoDTO.getCategoriaId()));
                producto.setCategoria(categoria);
            }

            ProductoEntity guardado = productoRepository.save(producto);
            System.out.println("DEBUG: Producto guardado con ID: " + guardado.getProductoId());
            System.out.println("DEBUG: ImagenURL guardada: " + guardado.getImagenUrl());

            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductoEntity> actualizarProducto(@PathVariable Long id,
            @RequestBody ProductoDTO productoDTO) {
        try {
            ProductoEntity producto = productoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            producto.setNombre(productoDTO.getNombre());
            producto.setSku(productoDTO.getSku());
            producto.setPrecio(productoDTO.getPrecio());
            producto.setStock(productoDTO.getStock());
            producto.setImagenUrl(productoDTO.getImagenUrl()); // ← ACTUALIZAR IMAGEN

            if (productoDTO.getCategoriaId() != null) {
                CategoriaEntity categoria = categoriaRepository.findById(productoDTO.getCategoriaId())
                        .orElseThrow(
                                () -> new RuntimeException("Categoría no encontrada: " + productoDTO.getCategoriaId()));
                producto.setCategoria(categoria);
            }

            return ResponseEntity.ok(productoRepository.save(producto));
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        productoRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // === PEDIDOS ===

    @GetMapping("/orders")
    public ResponseEntity<List<PedidoEntity>> listarPedidos() {
        return ResponseEntity.ok(pedidoRepository.findAll());
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> actualizarEstadoPedido(@PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            PedidoEntity pedido = pedidoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

            String nuevoEstado = body.get("estado");
            pedido.setEstado(nuevoEstado);
            PedidoEntity actualizado = pedidoRepository.save(pedido);

            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // === USUARIOS ===

    @GetMapping("/users")
    public ResponseEntity<List<UsuarioEntity>> listarUsuarios() {
        System.out.println("DEBUG: Listando usuarios...");
        try {
            List<UsuarioEntity> usuarios = usuarioRepository.findAll();
            System.out.println("DEBUG: Usuarios encontrados: " + usuarios.size());
            return ResponseEntity.ok(usuarios);
        } catch (Exception e) {
            System.err.println("ERROR al listar usuarios: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // ✅ AGREGAR: Crear usuario
    @PostMapping("/users")
    public ResponseEntity<?> crearUsuario(@RequestBody Map<String, Object> datos) {
        try {
            System.out.println("DEBUG: Creando usuario - Datos: " + datos);

            String email = (String) datos.get("email");
            String password = (String) datos.get("password");
            String nombreCompleto = (String) datos.get("nombre"); // "Juan Paz"
            String rol = (String) datos.get("rol");

            if (email == null || password == null || nombreCompleto == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Faltan campos requeridos"));
            }

            // ✅ DIVIDIR NOMBRE COMPLETO EN NOMBRE Y APELLIDO
            String[] partesNombre = nombreCompleto.trim().split("\\s+", 2);
            String nombre = partesNombre[0]; // "Juan"
            String apellido = partesNombre.length > 1 ? partesNombre[1] : "Usuario"; // "Paz" o "Usuario" si no hay
                                                                                     // apellido

            System.out.println("DEBUG: Nombre: " + nombre + ", Apellido: " + apellido);

            // Usar AuthService para registrar con encriptación de contraseña
            UsuarioEntity creado = authService.registrarUsuarioCompleto(
                    email, password, nombre, apellido, rol != null ? rol : "CLIENTE");

            System.out.println("DEBUG: Usuario creado con ID: " + creado.getUsuarioId());
            return ResponseEntity.ok(creado);
        } catch (Exception e) {
            System.err.println("ERROR al crear usuario: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ AGREGAR: Actualizar usuario (ESTE ES EL QUE NECESITAS)
    @PutMapping("/users/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        try {
            System.out.println("DEBUG: Actualizando usuario ID: " + id);
            System.out.println("DEBUG: Datos recibidos: " + datos);

            // Buscar usuario existente
            UsuarioEntity usuario = usuarioRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

            // Actualizar campos si se proporcionan
            if (datos.containsKey("nombre") && datos.get("nombre") != null) {
                usuario.setNombre((String) datos.get("nombre"));
            }
            if (datos.containsKey("email") && datos.get("email") != null) {
                usuario.setEmail((String) datos.get("email"));
            }
            if (datos.containsKey("rol") && datos.get("rol") != null) {
                usuario.setRol((String) datos.get("rol"));
            }
            // Solo actualizar contraseña si se envía una nueva y no está vacía
            if (datos.containsKey("password") && datos.get("password") != null
                    && !((String) datos.get("password")).isEmpty()) {
                usuario.setPassword(passwordEncoder.encode((String) datos.get("password")));
            }

            UsuarioEntity actualizado = usuarioRepository.save(usuario);
            System.out.println("DEBUG: Usuario actualizado exitosamente");

            return ResponseEntity.ok(actualizado);
        } catch (Exception e) {
            System.err.println("ERROR al actualizar usuario: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ AGREGAR: Eliminar usuario
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        try {
            System.out.println("DEBUG: Eliminando usuario ID: " + id);
            usuarioRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.err.println("ERROR al eliminar usuario: " + e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }

}
package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security;

// ✅ IMPORT: Usa UsuarioEntity (NO Usuario domain)
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.UsuarioEntity;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secretKey;

    @Value("${app.jwt.expiration}")
    private Long expiration;

    /**
     * ✅ Genera token JWT desde UsuarioEntity (lo que usa AuthService)
     */
    public String generateToken(UsuarioEntity usuario) {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes());

        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim("rol", usuario.getRol()) // ← ESTO ES CRÍTICO
                .claim("usuarioId", usuario.getUsuarioId())
                .claim("nombre", usuario.getNombre())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes());
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public String extractRol(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes());
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .get("rol", String.class); // ← Debe coincidir con el claim que generas
        } catch (Exception e) {
            System.err.println("Error extrayendo rol: " + e.getMessage());
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes());
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
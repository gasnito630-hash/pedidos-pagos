package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String requestURI = request.getRequestURI();

        System.out.println("🔐 JWT Filter - URI: " + requestURI);
        System.out.println("🔐 JWT Filter - Auth Header: " + authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("⚠️ JWT Filter - No token found, continuing filter chain");
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        System.out.println("🔐 JWT Filter - Token extraído, validando...");

        try {
            if (jwtUtil.validateToken(token)) {
                final String email = jwtUtil.extractEmail(token);
                final String rol = jwtUtil.extractRol(token);

                System.out.println("✅ JWT Filter - Token válido - Email: " + email + ", Rol: " + rol);

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        Collections.singletonList(() -> "ROLE_" + rol) // ← FORMATO CRÍTICO: "ROLE_ADMIN"
                );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("✅ JWT Filter - SecurityContext establecido");
            } else {
                System.out.println("❌ JWT Filter - Token inválido");
            }
        } catch (Exception e) {
            System.out.println("❌ JWT Filter - Error validando token: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
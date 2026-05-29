package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security.JwtUtil;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.UsuarioRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class CustomOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    public CustomOAuth2SuccessHandler(JwtUtil jwtUtil, UsuarioRepository usuarioRepository) {
        this.jwtUtil = jwtUtil;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        // Buscar usuario para obtener ID y Rol
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            // Generar Token JWT
            String token = jwtUtil.generateToken(usuario);

            // Redirigir al Dashboard pasando el token en la URL
            String redirectUrl = "/dashboard.html?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
            try {
                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }
}
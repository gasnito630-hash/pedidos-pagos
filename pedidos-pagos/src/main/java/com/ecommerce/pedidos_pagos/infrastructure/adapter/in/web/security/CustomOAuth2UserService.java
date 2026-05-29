package com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.UsuarioEntity;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.repository.UsuarioRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor // ← Esto generará el constructor con PasswordEncoder
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");

        // Verificar si el usuario ya existe en la BD
        UsuarioEntity usuario = usuarioRepository.findByEmail(email).orElse(null);

        if (usuario == null) {
            // Si no existe, lo registramos automáticamente
            usuario = new UsuarioEntity();
            usuario.setEmail(email);

            // Dividir nombre y apellido
            if (name != null && !name.isEmpty()) {
                String[] parts = name.split(" ", 2);
                usuario.setNombre(parts[0]);
                if (parts.length > 1) {
                    usuario.setApellido(parts[1]);
                }
            }

            // Contraseña aleatoria (nunca se usará porque entra con Google)
            usuario.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            usuario.setRol("CLIENTE"); // Por defecto CLIENTE
            usuario.setActivo(true);

            usuario.setCreadoEn(java.time.LocalDateTime.now());
            usuarioRepository.save(usuario);
        }

        return oAuth2User;
    }
}
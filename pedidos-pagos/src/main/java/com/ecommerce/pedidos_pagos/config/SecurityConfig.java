package com.ecommerce.pedidos_pagos.config;

import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security.CustomOAuth2SuccessHandler;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security.CustomOAuth2UserService;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.in.web.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig implements WebMvcConfigurer {

        private final JwtFilter jwtFilter;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                http
                                // 1. Desactivar CSRF para API REST
                                .csrf(csrf -> csrf.disable())

                                // 2. Configurar CORS (opcional pero recomendado)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // 3. Política de sesión STATELESS (para JWT)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // 4. REGLAS DE AUTORIZACIÓN
                                .authorizeHttpRequests(auth -> auth
                                                // RUTAS PÚBLICAS (sin autenticación)
                                                .requestMatchers(
                                                                "/",
                                                                "/index.html",
                                                                "/registro.html",
                                                                "/dashboard.html",
                                                                "/admin.html",
                                                                "/estilos.css",
                                                                "/login.js",
                                                                "/registro.js",
                                                                "/admin.js",
                                                                "/*.js",
                                                                "/*.css",
                                                                "/*.html",
                                                                "/api/auth/**",
                                                                "/api/productos",
                                                                "/api/categorias",
                                                                "/uploads/**",
                                                                "/login/oauth2/**")
                                                .permitAll()

                                                // RUTAS DE ADMIN (requieren rol ADMIN)
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                                                // RUTAS DE CLIENTE (requieren autenticación)
                                                .requestMatchers(
                                                                "/api/pedidos/**",
                                                                "/api/direcciones/**",
                                                                "/api/usuarios/**")
                                                .authenticated()

                                                // Cualquier otra ruta requiere autenticación
                                                .anyRequest().authenticated())

                                // 5. Desactivar formularios de login/logout de Spring (usamos JWT)
                                .formLogin(form -> form.disable())
                                .logout(logout -> logout.disable())
                                .httpBasic(basic -> basic.disable())

                                // 6. CONFIGURACION OAUTH2 (GOOGLE)
                                .oauth2Login(oauth2 -> oauth2
                                                .loginPage("/index.html")
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService))
                                                .successHandler(customOAuth2SuccessHandler))

                                // 7. Agregar filtro JWT antes de la autenticación
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        // AGREGAR ESTE MÉTODO para servir imágenes
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
                String uploadDir = System.getProperty("user.dir") + "/uploads/";
                System.out.println("📁 Directorio de uploads: " + uploadDir);

                registry.addResourceHandler("/uploads/**")
                                .addResourceLocations("file:" + uploadDir);
        }

        // Configuración CORS para permitir peticiones desde el frontend
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList("http://localhost:8080"));
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(Arrays.asList("*"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

}

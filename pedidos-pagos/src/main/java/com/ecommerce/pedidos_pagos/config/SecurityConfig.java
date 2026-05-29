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

// ✅ IMPORTS NECESARIOS PARA OAUTH2
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

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

            // 2. Configurar CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 3. Política de sesión STATELESS (para JWT)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 4. REGLAS DE AUTORIZACIÓN
            .authorizeHttpRequests(auth -> auth
                // RUTAS PÚBLICAS
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
                    "/login/oauth2/**"
                ).permitAll()

                // RUTAS DE ADMIN
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // RUTAS DE CLIENTE
                .requestMatchers(
                    "/api/pedidos/**",
                    "/api/direcciones/**",
                    "/api/usuarios/**"
                ).authenticated()

                // Cualquier otra ruta requiere autenticación
                .anyRequest().authenticated()
            )

            // 5. Desactivar formularios de login/logout de Spring
            .formLogin(form -> form.disable())
            .logout(logout -> logout.disable())
            .httpBasic(basic -> basic.disable())

            // 6. CONFIGURACIÓN OAUTH2 (GOOGLE) - CORREGIDO
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/index.html")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService))
                .successHandler(customOAuth2SuccessHandler))

            // 7. Agregar filtro JWT
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

    // Configuración CORS para Render + localhost
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // ✅ Permitir Render + localhost + cualquier origen en desarrollo
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:8080",
            "https://pedidos-pagos.onrender.com",
            "https://*.onrender.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // ✅ REPOSITORIO DE CLIENTES OAUTH2
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(googleClientRegistration());
    }

    // ✅ CONFIGURACIÓN DE GOOGLE OAUTH2 - CORREGIDA
    private ClientRegistration googleClientRegistration() {
        return ClientRegistration.withRegistrationId("google")
            .clientId(System.getenv("GOOGLE_CLIENT_ID"))
            .clientSecret(System.getenv("GOOGLE_CLIENT_SECRET"))
            .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
            // ✅ ESTO ES LO QUE FALTABA - OBLIGATORIO
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/google")
            .scope("openid", "profile", "email")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://www.googleapis.com/oauth2/v4/token")
            .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
            .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
            .userNameAttributeName("sub")
            .clientName("Google")
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

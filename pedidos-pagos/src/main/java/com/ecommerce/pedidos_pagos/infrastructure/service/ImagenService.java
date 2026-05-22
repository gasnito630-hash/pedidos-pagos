package com.ecommerce.pedidos_pagos.infrastructure.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImagenService {

    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/productos/";
    private static final String BASE_URL = "/uploads/productos/";

    public String guardarImagen(MultipartFile archivo) throws IOException {
        // Crear directorio si no existe
        File directorio = new File(UPLOAD_DIR);
        if (!directorio.exists()) {
            directorio.mkdirs();
        }

        // Generar nombre único
        String nombreOriginal = archivo.getOriginalFilename();
        String extension = nombreOriginal != null ? nombreOriginal.substring(nombreOriginal.lastIndexOf(".")) : ".jpg";
        String nombreUnico = UUID.randomUUID().toString() + extension;

        // Guardar archivo
        Path ruta = Paths.get(UPLOAD_DIR + nombreUnico);
        Files.write(ruta, archivo.getBytes());

        return BASE_URL + nombreUnico;
    }

    public void eliminarImagen(String imagenUrl) {
        if (imagenUrl != null && imagenUrl.startsWith(BASE_URL)) {
            String nombreArchivo = imagenUrl.replace(BASE_URL, "");
            File archivo = new File(UPLOAD_DIR + nombreArchivo);
            if (archivo.exists()) {
                archivo.delete();
            }
        }
    }
}
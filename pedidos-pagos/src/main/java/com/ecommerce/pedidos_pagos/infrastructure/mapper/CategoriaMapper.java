package com.ecommerce.pedidos_pagos.infrastructure.mapper;

import com.ecommerce.pedidos_pagos.domain.model.Categoria;
import com.ecommerce.pedidos_pagos.infrastructure.adapter.out.persistence.entity.CategoriaEntity;
import org.springframework.stereotype.Component;

@Component
public class CategoriaMapper {

    public Categoria toModel(CategoriaEntity entity) {
        if (entity == null)
            return null;

        return Categoria.builder()
                .categoriaId(entity.getCategoriaId())
                .nombre(entity.getNombre())
                .descripcion(entity.getDescripcion())
                .build();
    }

    public CategoriaEntity toEntity(Categoria model) {
        if (model == null)
            return null;

        CategoriaEntity entity = new CategoriaEntity();
        entity.setCategoriaId(model.getCategoriaId());
        entity.setNombre(model.getNombre());
        entity.setDescripcion(model.getDescripcion());
        return entity;
    }
}
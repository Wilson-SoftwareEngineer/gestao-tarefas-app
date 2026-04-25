package com.aprendendo.gestaotarefas.dto;

import com.aprendendo.gestaotarefas.model.Categoria;

public record CategoriaResponse(Long id, String nome, String corHex) {
    public static CategoriaResponse from(Categoria c) {
        if (c == null) return null;
        return new CategoriaResponse(c.getId(), c.getNome(), c.getCorHex());
    }
}

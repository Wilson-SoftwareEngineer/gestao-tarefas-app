package com.aprendendo.gestaotarefas.dto;

import com.aprendendo.gestaotarefas.model.StatusTarefa;
import com.aprendendo.gestaotarefas.model.Tarefa;

import java.time.LocalDateTime;

public record TarefaResponse(
        Long id,
        String titulo,
        String descricao,
        LocalDateTime dataHora,
        StatusTarefa status,
        CategoriaResponse categoria
) {
    public static TarefaResponse from(Tarefa t) {
        return new TarefaResponse(
                t.getId(),
                t.getTitulo(),
                t.getDescricao(),
                t.getDataHora(),
                t.getStatus(),
                CategoriaResponse.from(t.getCategoria())
        );
    }
}

package com.aprendendo.gestaotarefas.dto;

import com.aprendendo.gestaotarefas.model.StatusTarefa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record TarefaRequest(
        @NotBlank(message = "Título é obrigatório")
        @Size(max = 120, message = "Título deve ter no máximo 120 caracteres")
        String titulo,

        @Size(max = 500, message = "Descrição deve ter no máximo 500 caracteres")
        String descricao,

        LocalDateTime dataHora,

        @NotNull(message = "Status é obrigatório")
        StatusTarefa status,

        @NotNull(message = "Categoria é obrigatória")
        Long categoriaId
) {}

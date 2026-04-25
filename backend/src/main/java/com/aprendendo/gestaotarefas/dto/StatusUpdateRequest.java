package com.aprendendo.gestaotarefas.dto;

import com.aprendendo.gestaotarefas.model.StatusTarefa;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "Status é obrigatório") StatusTarefa status
) {}

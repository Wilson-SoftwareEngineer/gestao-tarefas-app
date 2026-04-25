package com.aprendendo.gestaotarefas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoriaRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 60, message = "Nome deve ter no máximo 60 caracteres")
        String nome,

        @NotBlank(message = "Cor é obrigatória")
        @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "Cor deve estar no formato #RRGGBB")
        String corHex
) {}

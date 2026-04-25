package com.aprendendo.gestaotarefas.dto;

public record EstatisticasResponse(
        long total,
        long pendentes,
        long emAndamento,
        long concluidas
) {}

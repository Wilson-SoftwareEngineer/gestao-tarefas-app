package com.aprendendo.gestaotarefas.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String recurso, Object id) {
        super("%s com id %s não encontrado(a)".formatted(recurso, id));
    }
}

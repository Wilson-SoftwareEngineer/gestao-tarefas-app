package com.aprendendo.gestaotarefas.controller;

import com.aprendendo.gestaotarefas.dto.EstatisticasResponse;
import com.aprendendo.gestaotarefas.dto.StatusUpdateRequest;
import com.aprendendo.gestaotarefas.dto.TarefaRequest;
import com.aprendendo.gestaotarefas.dto.TarefaResponse;
import com.aprendendo.gestaotarefas.service.TarefaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tarefas")
@RequiredArgsConstructor
public class TarefaController {

    private final TarefaService service;

    @GetMapping
    public List<TarefaResponse> listarTodas() {
        return service.listarTodas().stream().map(TarefaResponse::from).toList();
    }

    @GetMapping("/{id}")
    public TarefaResponse buscarPorId(@PathVariable Long id) {
        return TarefaResponse.from(service.buscarPorId(id));
    }

    @GetMapping("/estatisticas")
    public EstatisticasResponse estatisticas() {
        return service.estatisticas();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TarefaResponse criar(@Valid @RequestBody TarefaRequest req) {
        return TarefaResponse.from(service.criar(req));
    }

    @PutMapping("/{id}")
    public TarefaResponse atualizar(@PathVariable Long id, @Valid @RequestBody TarefaRequest req) {
        return TarefaResponse.from(service.atualizar(id, req));
    }

    @PatchMapping("/{id}/status")
    public TarefaResponse atualizarStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest req) {
        return TarefaResponse.from(service.atualizarStatus(id, req.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}

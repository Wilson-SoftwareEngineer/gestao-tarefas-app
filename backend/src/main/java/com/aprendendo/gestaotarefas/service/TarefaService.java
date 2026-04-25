package com.aprendendo.gestaotarefas.service;

import com.aprendendo.gestaotarefas.dto.EstatisticasResponse;
import com.aprendendo.gestaotarefas.dto.TarefaRequest;
import com.aprendendo.gestaotarefas.exception.ResourceNotFoundException;
import com.aprendendo.gestaotarefas.model.Categoria;
import com.aprendendo.gestaotarefas.model.StatusTarefa;
import com.aprendendo.gestaotarefas.model.Tarefa;
import com.aprendendo.gestaotarefas.repository.TarefaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TarefaService {

    private final TarefaRepository repository;
    private final CategoriaService categoriaService;

    public List<Tarefa> listarTodas() {
        return repository.findAll();
    }

    public Tarefa buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa", id));
    }

    public Tarefa criar(TarefaRequest req) {
        Categoria categoria = categoriaService.buscarPorId(req.categoriaId());
        Tarefa t = new Tarefa();
        aplicar(t, req, categoria);
        return repository.save(t);
    }

    public Tarefa atualizar(Long id, TarefaRequest req) {
        Tarefa t = buscarPorId(id);
        Categoria categoria = categoriaService.buscarPorId(req.categoriaId());
        aplicar(t, req, categoria);
        return repository.save(t);
    }

    public Tarefa atualizarStatus(Long id, StatusTarefa status) {
        Tarefa t = buscarPorId(id);
        t.setStatus(status);
        return repository.save(t);
    }

    public void deletar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Tarefa", id);
        }
        repository.deleteById(id);
    }

    public EstatisticasResponse estatisticas() {
        List<Tarefa> todas = repository.findAll();
        long pendentes = todas.stream().filter(t -> t.getStatus() == StatusTarefa.PENDENTE).count();
        long emAndamento = todas.stream().filter(t -> t.getStatus() == StatusTarefa.EM_ANDAMENTO).count();
        long concluidas = todas.stream().filter(t -> t.getStatus() == StatusTarefa.CONCLUIDA).count();
        return new EstatisticasResponse(todas.size(), pendentes, emAndamento, concluidas);
    }

    private void aplicar(Tarefa t, TarefaRequest req, Categoria categoria) {
        t.setTitulo(req.titulo());
        t.setDescricao(req.descricao());
        t.setDataHora(req.dataHora());
        t.setStatus(req.status());
        t.setCategoria(categoria);
    }
}

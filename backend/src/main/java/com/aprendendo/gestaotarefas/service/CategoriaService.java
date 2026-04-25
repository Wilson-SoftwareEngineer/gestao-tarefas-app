package com.aprendendo.gestaotarefas.service;

import com.aprendendo.gestaotarefas.dto.CategoriaRequest;
import com.aprendendo.gestaotarefas.exception.ResourceNotFoundException;
import com.aprendendo.gestaotarefas.model.Categoria;
import com.aprendendo.gestaotarefas.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository repository;

    public List<Categoria> listarTodas() {
        return repository.findAll();
    }

    public Categoria buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", id));
    }

    public Categoria criar(CategoriaRequest req) {
        Categoria c = new Categoria();
        c.setNome(req.nome());
        c.setCorHex(req.corHex());
        return repository.save(c);
    }

    public Categoria atualizar(Long id, CategoriaRequest req) {
        Categoria c = buscarPorId(id);
        c.setNome(req.nome());
        c.setCorHex(req.corHex());
        return repository.save(c);
    }

    public void deletar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Categoria", id);
        }
        repository.deleteById(id);
    }
}

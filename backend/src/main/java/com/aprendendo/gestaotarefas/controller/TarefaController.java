// Declara o pacote ao qual esta classe pertence (organização hierárquica do projeto).
package com.aprendendo.gestaotarefas.controller;

// Importa o DTO usado para retornar as estatísticas das tarefas (totais, concluídas, etc.).
import com.aprendendo.gestaotarefas.dto.EstatisticasResponse;
// Importa o DTO que representa o corpo da requisição para atualizar apenas o status de uma tarefa.
import com.aprendendo.gestaotarefas.dto.StatusUpdateRequest;
// Importa o DTO de entrada usado ao criar ou atualizar uma tarefa (dados vindos do cliente).
import com.aprendendo.gestaotarefas.dto.TarefaRequest;
// Importa o DTO de saída usado para retornar dados de tarefa para o cliente.
import com.aprendendo.gestaotarefas.dto.TarefaResponse;
// Importa a camada de serviço onde fica a lógica de negócio relacionada às tarefas.
import com.aprendendo.gestaotarefas.service.TarefaService;
// Importa a anotação @Valid para acionar a validação automática dos campos do DTO.
import jakarta.validation.Valid;
// Importa a anotação do Lombok que gera um construtor com os campos final (injeção de dependência via construtor).
import lombok.RequiredArgsConstructor;
// Importa o enum HttpStatus usado para definir códigos de resposta HTTP (ex.: 201 CREATED).
import org.springframework.http.HttpStatus;
// Importa ResponseEntity, classe que permite montar respostas HTTP customizadas (corpo, status, headers).
import org.springframework.http.ResponseEntity;
// Importa todas as anotações de mapeamento web do Spring (@GetMapping, @PostMapping, @RestController, etc.).
import org.springframework.web.bind.annotation.*;

// Importa a interface List usada para retornar coleções de tarefas.
import java.util.List;

// Marca esta classe como um controlador REST: cada método retorna diretamente o corpo da resposta em JSON.
@RestController
// Define o caminho base para todos os endpoints desta classe (todos começam com /api/tarefas).
@RequestMapping("/api/tarefas")
// Lombok cria automaticamente um construtor recebendo todos os campos final, permitindo injeção de dependência.
@RequiredArgsConstructor
// Declara a classe pública que expõe os endpoints REST relacionados às tarefas.
public class TarefaController {

    // Campo final que guarda a referência ao serviço; será injetado pelo Spring via construtor (gerado pelo Lombok).
    private final TarefaService service;

    // Mapeia requisições HTTP GET em /api/tarefas para o método abaixo (listar todas as tarefas).
    @GetMapping
    // Método público que retorna uma lista de TarefaResponse contendo todas as tarefas cadastradas.
    public List<TarefaResponse> listarTodas() {
        // Chama o serviço para obter as entidades, converte cada uma em DTO de resposta e devolve a lista.
        return service.listarTodas().stream().map(TarefaResponse::from).toList();
    }

    // Mapeia GET /api/tarefas/{id}, onde {id} é uma variável de caminho (path variable).
    @GetMapping("/{id}")
    // Método que busca uma tarefa específica pelo identificador recebido na URL.
    public TarefaResponse buscarPorId(@PathVariable Long id) {
        // Solicita a tarefa ao serviço e a converte em DTO antes de devolvê-la ao cliente.
        return TarefaResponse.from(service.buscarPorId(id));
    }

    // Mapeia GET /api/tarefas/estatisticas para retornar um resumo agregado das tarefas.
    @GetMapping("/estatisticas")
    // Método que devolve as estatísticas calculadas pela camada de serviço.
    public EstatisticasResponse estatisticas() {
        // Delega ao serviço o cálculo das estatísticas e retorna o resultado diretamente.
        return service.estatisticas();
    }

    // Mapeia POST /api/tarefas para criar uma nova tarefa.
    @PostMapping
    // Define o status HTTP de sucesso como 201 (CREATED), apropriado para recursos recém-criados.
    @ResponseStatus(HttpStatus.CREATED)
    // Recebe o JSON do corpo (@RequestBody), valida os campos com @Valid e cria a tarefa.
    public TarefaResponse criar(@Valid @RequestBody TarefaRequest req) {
        // Pede ao serviço para persistir a nova tarefa e converte o resultado em DTO de resposta.
        return TarefaResponse.from(service.criar(req));
    }

    // Mapeia PUT /api/tarefas/{id} para substituir/atualizar todos os campos de uma tarefa existente.
    @PutMapping("/{id}")
    // Recebe o id pela URL e o novo conteúdo no corpo da requisição (validado).
    public TarefaResponse atualizar(@PathVariable Long id, @Valid @RequestBody TarefaRequest req) {
        // Encaminha a atualização ao serviço e devolve a tarefa atualizada como DTO.
        return TarefaResponse.from(service.atualizar(id, req));
    }

    // Mapeia PATCH /api/tarefas/{id}/status para atualizar parcialmente apenas o status da tarefa.
    @PatchMapping("/{id}/status")
    // Recebe o id pela URL e o novo status no corpo (validado pelo @Valid).
    public TarefaResponse atualizarStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest req) {
        // Chama o serviço passando o status extraído do DTO (record accessor) e retorna a tarefa atualizada.
        return TarefaResponse.from(service.atualizarStatus(id, req.status()));
    }

    // Mapeia DELETE /api/tarefas/{id} para remover uma tarefa existente.
    @DeleteMapping("/{id}")
    // Retorna ResponseEntity<Void> permitindo enviar status 204 sem corpo na resposta.
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        // Solicita ao serviço a exclusão da tarefa identificada pelo id.
        service.deletar(id);
        // Devolve uma resposta HTTP 204 No Content, indicando sucesso sem conteúdo no corpo.
        return ResponseEntity.noContent().build();
    }
}

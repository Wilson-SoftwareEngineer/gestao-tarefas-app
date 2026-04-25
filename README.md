# Gestão de Tarefas — API REST com Spring Boot

Projeto de aprendizado Java com Spring Boot. API REST para gerenciar Tarefas e Categorias, conectada ao MySQL.

---

## O que é esse projeto?

Uma **API REST** — um servidor que recebe requisições HTTP (GET, POST, DELETE) e responde com dados em JSON. Pense nele como um garçom: o cliente (um app Angular, React, Postman, etc.) faz um pedido, o garçom leva à cozinha, e traz de volta a resposta.

---

## Estrutura de Pastas

```
backend/
└── src/
    └── main/
        ├── java/com/aprendendo/gestaotarefas/
        │   ├── GestaoTarefasApplication.java   ← Ponto de entrada
        │   ├── controller/                      ← Porta de entrada das requisições
        │   ├── service/                         ← Lógica de negócio
        │   ├── repository/                      ← Comunicação com o banco
        │   └── model/                           ← Estrutura dos dados
        └── resources/
            └── application.properties           ← Configurações
```

Pense no projeto como um **restaurante**:

| Camada | Papel no restaurante |
|---|---|
| `controller` | O garçom (recebe o pedido) |
| `service` | O chef (processa o pedido) |
| `repository` | O almoxarife (busca os ingredientes no estoque) |
| `model` | A receita/ficha técnica (como o prato é estruturado) |
| banco de dados | O estoque/despensa |

---

## Arquitetura Visual

```
                        Internet / Frontend
                               ↕ HTTP/JSON
                        ┌─────────────┐
                        │  Controller │  @RestController
                        └──────┬──────┘
                               ↕ objetos Java
                        ┌──────┴──────┐
                        │   Service   │  @Service (regras de negócio)
                        └──────┬──────┘
                               ↕ objetos Java
                        ┌──────┴──────┐
                        │ Repository  │  @Repository (JpaRepository)
                        └──────┬──────┘
                               ↕ SQL gerado pelo Hibernate
                        ┌──────┴──────┐
                        │    MySQL    │  db_tarefas
                        └─────────────┘
```

---

## Tecnologias

| Tecnologia | Versão | Papel |
|---|---|---|
| Java | 21 | Linguagem |
| Spring Boot | 4.0.6 | Framework principal |
| Spring Data JPA | — | Abstração do banco de dados |
| Hibernate | — | ORM (converte objetos Java em SQL) |
| MySQL | — | Banco de dados relacional |
| Lombok | — | Geração de código boilerplate |
| Maven | — | Gerenciador de build e dependências |

---

## Configuração do Banco de Dados

Arquivo: `src/main/resources/application.properties`

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/db_tarefas?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=SUA_SENHA
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

**O que cada linha faz:**

- `datasource.url` — endereço do banco: `localhost`, porta `3306`, banco `db_tarefas`. O parâmetro `createDatabaseIfNotExist=true` cria o banco automaticamente se não existir.
- `ddl-auto=update` — o Hibernate cria ou atualiza as tabelas automaticamente com base nos seus modelos Java. Você nunca precisa escrever `CREATE TABLE`.
- `show-sql=true` — imprime no console todo SQL executado (ótimo para aprendizado).

> **Aviso:** nunca deixe senhas em texto puro no código. Em produção, use variáveis de ambiente.

---

## Tabelas Geradas Automaticamente

O Hibernate lê as classes `@Entity` e cria as tabelas no MySQL:

```
Tabela: categoria          Tabela: tarefa
+----+----------+--------+  +----+----------+-----------+----------+--------------+
| id | nome     | corHex |  | id | titulo   | descricao | status   | categoria_id |
+----+----------+--------+  +----+----------+-----------+----------+--------------+
|  1 | Trabalho | #FF0000|  |  1 | Reunião  | ...       | PENDENTE | 1            |
|  2 | Pessoal  | #00FF00|  |  2 | Academia | ...       | CONCLUIDA| 2            |
```

A coluna `categoria_id` em `tarefa` é uma **chave estrangeira** para a tabela `categoria` (relacionamento `@ManyToOne`).

---

## Endpoints da API

### Tarefas — `/api/tarefas`

| Método | URL | Descrição |
|---|---|---|
| GET | `/api/tarefas` | Lista todas as tarefas |
| POST | `/api/tarefas` | Cria uma nova tarefa |
| DELETE | `/api/tarefas/{id}` | Remove a tarefa pelo id |

**Exemplo de corpo para POST:**
```json
{
  "titulo": "Estudar Java",
  "descricao": "Revisar anotações do Spring Boot",
  "status": "PENDENTE",
  "categoria": { "id": 1 }
}
```

### Categorias — `/api/categorias`

| Método | URL | Descrição |
|---|---|---|
| GET | `/api/categorias` | Lista todas as categorias |
| POST | `/api/categorias` | Cria uma nova categoria |
| DELETE | `/api/categorias/{id}` | Remove a categoria pelo id |

**Exemplo de corpo para POST:**
```json
{
  "nome": "Trabalho",
  "corHex": "#FF5733"
}
```

---

## Explicação de Cada Camada

### `GestaoTarefasApplication.java` — Ponto de Ignição

```java
@SpringBootApplication
public class GestaoTarefasApplication {
    public static void main(String[] args) {
        SpringApplication.run(GestaoTarefasApplication.class, args);
    }
}
```

O único `main()` do projeto. A anotação `@SpringBootApplication` faz três coisas:
1. Ativa o autoconfigurador do Spring Boot
2. Escaneia todas as subpastas em busca de `@Controller`, `@Service`, `@Repository`
3. Ativa as configurações declaradas no `application.properties`

---

### `model/` — Estrutura dos Dados

Define como os dados são representados em Java e no banco.

**`StatusTarefa.java`** — enum com valores fixos:
```java
public enum StatusTarefa {
    PENDENTE, EM_ANDAMENTO, CONCLUIDA;
}
```

**`Categoria.java`**:
```java
@Entity   // → vira tabela no banco
@Data     // → Lombok gera getters, setters, equals, hashCode, toString
public class Categoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // → auto-incremento
    private Long id;

    private String nome;
    private String corHex;
}
```

**`Tarefa.java`**:
```java
@Entity
@Data
public class Tarefa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String descricao;
    private LocalDateTime dataHora;

    @Enumerated(EnumType.STRING)   // → salva "PENDENTE" no banco, não 0/1/2
    private StatusTarefa status;

    @ManyToOne                     // → muitas tarefas para uma categoria
    @JoinColumn(name = "categoria_id")  // → coluna de chave estrangeira
    private Categoria categoria;
}
```

---

### `repository/` — Porta do Banco de Dados

```java
@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {
}
```

Interface vazia que herda automaticamente:

| Método | SQL equivalente |
|---|---|
| `findAll()` | `SELECT * FROM tarefa` |
| `findById(id)` | `SELECT * FROM tarefa WHERE id = ?` |
| `save(tarefa)` | `INSERT` ou `UPDATE` |
| `deleteById(id)` | `DELETE FROM tarefa WHERE id = ?` |
| `count()` | `SELECT COUNT(*) FROM tarefa` |

O `<Tarefa, Long>` informa: "gerencia a entidade `Tarefa` cuja chave primária é `Long`".

---

### `service/` — Lógica de Negócio

```java
@Service
public class TarefaService {

    @Autowired  // → Spring injeta automaticamente uma instância do repository
    private TarefaRepository repository;

    public List<Tarefa> listarTodas() {
        return repository.findAll();
    }

    public Tarefa salvar(Tarefa tarefa) {
        return repository.save(tarefa);
    }

    public void deletar(Long id) {
        repository.deleteById(id);
    }
}
```

É aqui que ficam as **regras de negócio**. Exemplo do que poderia ser adicionado:
```java
public Tarefa salvar(Tarefa tarefa) {
    if (tarefa.getTitulo() == null || tarefa.getTitulo().isBlank()) {
        throw new IllegalArgumentException("Título é obrigatório");
    }
    if (tarefa.getStatus() == null) {
        tarefa.setStatus(StatusTarefa.PENDENTE);
    }
    return repository.save(tarefa);
}
```

`@Autowired` é a **injeção de dependência**: em vez de `new TarefaRepository()`, você pede ao Spring para criar e gerenciar o objeto por você.

---

### `controller/` — A API Exposta ao Mundo

```java
@RestController                      // → responde requisições HTTP com JSON
@RequestMapping("/api/tarefas")      // → endereço base de todos os métodos
@CrossOrigin(origins = "*")          // → permite acesso de outros domínios (CORS)
public class TarefaController {

    @Autowired
    private TarefaService service;

    @GetMapping
    public List<Tarefa> listarTodas() {
        return service.listarTodas();
    }

    @PostMapping
    public Tarefa criar(@RequestBody Tarefa tarefa) {  // → converte JSON em objeto Java
        return service.salvar(tarefa);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {  // → captura o {id} da URL
        service.deletar(id);
        return ResponseEntity.noContent().build();  // → HTTP 204 No Content
    }
}
```

---

## Fluxo Completo de uma Requisição

Imagine um `POST /api/tarefas` com o JSON `{ "titulo": "Estudar Java", "status": "PENDENTE" }`:

```
HTTP Request (JSON)
        ↓
[Controller] TarefaController.criar()
    → deserializa o JSON em objeto Tarefa
        ↓
[Service] TarefaService.salvar()
    → aplica regras de negócio
        ↓
[Repository] TarefaRepository.save()
    → traduz para SQL
        ↓
[Hibernate/JPA]
    → INSERT INTO tarefa (titulo, status, ...) VALUES (...)
        ↓
[MySQL] db_tarefas
    → salva no disco
        ↓
(resposta sobe pelo mesmo caminho)
        ↓
HTTP Response (JSON com o objeto salvo, incluindo o id gerado)
```

---

## Como Executar

**Pré-requisitos:**
- Java 21 instalado
- MySQL rodando na porta 3306

```bash
cd backend
./mvnw spring-boot:run
```

O servidor sobe em `http://localhost:8080`.

---

## Próximos Passos Sugeridos

1. **Adicionar `@PutMapping`** — para atualizar uma tarefa existente (hoje só há GET, POST e DELETE).
2. **Busca por status** — adicionar `findByStatus(StatusTarefa status)` no repository.
3. **Validação com `@Valid`** — usar `@NotBlank`, `@NotNull` nos campos do model para rejeitar dados inválidos.
4. **Tratamento de erros** — usar `@ExceptionHandler` para retornar mensagens de erro em JSON.
5. **Mover credenciais para variáveis de ambiente** — nunca deixar senha hardcoded no código.

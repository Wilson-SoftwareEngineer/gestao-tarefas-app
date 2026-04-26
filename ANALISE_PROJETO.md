# Análise Didática — Projeto Gestão de Tarefas
### Backend: Spring Boot · Frontend: Angular · Banco: MySQL

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Backend — Camada por Camada](#2-backend--camada-por-camada)
   - [Ponto de Entrada](#21-ponto-de-entrada-gestaotarefasapplicationjava)
   - [Model (Entidades JPA)](#22-model--entidades-jpa)
   - [Repository](#23-repository--acesso-ao-banco)
   - [DTO](#24-dto--data-transfer-objects)
   - [Service (Lógica de Negócio)](#25-service--lógica-de-negócio)
   - [Controller (API REST)](#26-controller--api-rest)
   - [Exception Handling](#27-exception-handling)
   - [Configuração CORS](#28-configuração-cors)
3. [Frontend — Camada por Camada](#3-frontend--camada-por-camada)
   - [Models (Interfaces TypeScript)](#31-models--interfaces-typescript)
   - [Services de API](#32-services-de-api)
   - [Interceptor de Erros](#33-interceptor-de-erros)
   - [Core Services](#34-core-services)
   - [Components](#35-components)
   - [Configuração da Aplicação](#36-configuração-da-aplicação)
4. [Fluxo Completo — Criar uma Tarefa](#4-fluxo-completo--criar-uma-tarefa)
5. [Conceitos-Chave Demonstrados](#5-conceitos-chave-demonstrados)
6. [Boas Práticas Aplicadas](#6-boas-práticas-aplicadas)
7. [Oportunidades de Melhoria](#7-oportunidades-de-melhoria)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER (usuário)                           │
│                     Angular SPA · :4200                         │
│                                                                 │
│   Components ──► Services ──► HttpClient ──► errorInterceptor  │
└───────────────────────────────┬─────────────────────────────────┘
                                │  HTTP/JSON  (REST)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Spring Boot API · :8080                        │
│                                                                 │
│  Controller ──► Service ──► Repository ──► JPA/Hibernate       │
└───────────────────────────────┬─────────────────────────────────┘
                                │  JDBC
                                ▼
                        ┌──────────────┐
                        │   MySQL DB   │
                        │  db_tarefas  │
                        └──────────────┘
```

O projeto segue o padrão **Client-Server com arquitetura em camadas** em ambos os lados. Cada camada tem uma responsabilidade bem definida — isso é o princípio **Single Responsibility** do SOLID em escala de módulos.

---

## 2. Backend — Camada por Camada

### 2.1 Ponto de Entrada: `GestaoTarefasApplication.java`

```java
@SpringBootApplication
@EnableJpaAuditing
public class GestaoTarefasApplication {
    public static void main(String[] args) {
        SpringApplication.run(GestaoTarefasApplication.class, args);
    }
}
```

**O que faz:**
- `@SpringBootApplication` é um atalho que equivale a três anotações juntas:
  - `@Configuration` — essa classe pode declarar beans
  - `@EnableAutoConfiguration` — o Spring configura automaticamente banco, web server, etc.
  - `@ComponentScan` — o Spring varre o pacote atual procurando por `@Service`, `@Repository`, `@Controller`, etc.
- `@EnableJpaAuditing` ativa o mecanismo de auditoria do Spring Data JPA, que preenche automaticamente os campos `@CreatedDate` e `@LastModifiedDate` nas entidades.
- `SpringApplication.run(...)` inicializa o contexto do Spring, sobe o servidor Tomcat embutido e começa a escutar requisições HTTP.

**Conceito:** O Spring Boot usa **Inversão de Controle (IoC)** — você não instancia objetos manualmente. O framework gerencia o ciclo de vida de todos os componentes (chamados de *beans*).

---

### 2.2 Model — Entidades JPA

As entidades são classes Java que **mapeiam diretamente para tabelas do banco de dados**. O JPA (Java Persistence API) lida com a tradução entre objetos Java e linhas SQL.

#### `Tarefa.java`

```java
@Entity
@Data
@EntityListeners(AuditingEntityListener.class)
public class Tarefa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String descricao;
    private LocalDateTime dataHora;

    @Enumerated(EnumType.STRING)
    private StatusTarefa status;

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime criadoEm;

    @LastModifiedDate
    private LocalDateTime atualizadoEm;
}
```

| Anotação | Função |
|---|---|
| `@Entity` | Indica que esta classe é uma tabela no banco |
| `@Data` (Lombok) | Gera getters, setters, `equals`, `hashCode` e `toString` em tempo de compilação |
| `@Id` + `@GeneratedValue` | Define a chave primária com auto-incremento |
| `@Enumerated(EnumType.STRING)` | Salva o enum como texto (`"PENDENTE"`) em vez de número — muito mais legível no banco |
| `@ManyToOne` | Relacionamento: muitas tarefas pertencem a uma categoria |
| `@JoinColumn(name = "categoria_id")` | Cria a coluna de chave estrangeira `categoria_id` na tabela |
| `@CreatedDate` / `@LastModifiedDate` | Preenchidos automaticamente pelo `AuditingEntityListener` |

#### `Categoria.java`

```java
@Entity
@Data
public class Categoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nome;
    private String corHex;
}
```

Entidade simples: sem relacionamentos, sem auditoria. Uma categoria tem apenas nome e cor em formato hexadecimal.

#### `StatusTarefa.java`

```java
public enum StatusTarefa {
    PENDENTE, EM_ANDAMENTO, CONCLUIDA;
}
```

Um `enum` Java define um conjunto fechado de valores possíveis. Isso garante que nenhuma tarefa possa ter um status inválido — é validação em nível de tipo.

---

### 2.3 Repository — Acesso ao Banco

```java
@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {
}
```

**Isso é quase mágico para quem está aprendendo:** a interface está vazia, mas você herda automaticamente dezenas de métodos prontos ao estender `JpaRepository<Tarefa, Long>`:

| Método herdado | O que faz |
|---|---|
| `findAll()` | `SELECT * FROM tarefa` |
| `findById(id)` | `SELECT * FROM tarefa WHERE id = ?` |
| `save(entidade)` | `INSERT` ou `UPDATE` dependendo se a entidade tem `id` |
| `deleteById(id)` | `DELETE FROM tarefa WHERE id = ?` |
| `existsById(id)` | `SELECT COUNT(*) ... WHERE id = ?` |

O Spring Data JPA **implementa essa interface em tempo de execução** usando *proxies* dinâmicos do Java. Você nunca escreve SQL para operações básicas de CRUD.

`@Repository` informa ao Spring que este bean deve receber tratamento especial de exceções de persistência (traduz `SQLException` em `DataAccessException`).

---

### 2.4 DTO — Data Transfer Objects

**Por que DTOs existem?** Para separar o que trafega pela API do que existe no banco. Sem DTOs, você exporia diretamente suas entidades JPA — o que cria problemas de segurança, acoplamento e serialização circular.

#### `TarefaRequest.java` — O que chega da API

```java
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
```

- `record` é um tipo imutável do Java moderno (Java 16+). Gera automaticamente construtor, getters, `equals`, `hashCode` e `toString`.
- As anotações `@NotBlank`, `@Size`, `@NotNull` pertencem ao **Bean Validation (Jakarta Validation)**. Elas são executadas quando o controller usa `@Valid` na chamada.
- Repare que o DTO recebe apenas `categoriaId` (um Long), e não o objeto `Categoria` inteiro — isso é o padrão correto para referências.

#### `TarefaResponse.java` — O que sai para o cliente

```java
public record TarefaResponse(
    Long id,
    String titulo,
    String descricao,
    LocalDateTime dataHora,
    StatusTarefa status,
    CategoriaResponse categoria   // objeto aninhado, não apenas o ID
) {
    public static TarefaResponse from(Tarefa t) {
        return new TarefaResponse(
            t.getId(), t.getTitulo(), t.getDescricao(),
            t.getDataHora(), t.getStatus(),
            CategoriaResponse.from(t.getCategoria())
        );
    }
}
```

O método estático `from()` é um **Factory Method**: centraliza a conversão de `Tarefa` (entidade) para `TarefaResponse` (DTO). A resposta inclui o objeto `CategoriaResponse` completo, não só o ID — o que é conveniente para o frontend não precisar fazer uma segunda chamada.

#### `StatusUpdateRequest.java` — Para o PATCH

```java
public record StatusUpdateRequest(
    @NotNull(message = "Status é obrigatório") StatusTarefa status
) {}
```

Um DTO específico para a operação de atualização de status. Isso segue o **Interface Segregation Principle**: cada operação tem exatamente o contrato que precisa.

#### `EstatisticasResponse.java`

```java
public record EstatisticasResponse(
    long total, long pendentes, long emAndamento, long concluidas
) {}
```

DTO de leitura pura, para o endpoint de estatísticas do dashboard.

---

### 2.5 Service — Lógica de Negócio

O Service é o **cérebro da aplicação**. Ele não sabe nada de HTTP (não tem anotações web) e não sabe nada de SQL (não escreve queries). Ele apenas orquestra a lógica.

```java
@Service
@RequiredArgsConstructor
public class TarefaService {

    private final TarefaRepository repository;
    private final CategoriaService categoriaService;

    public Tarefa criar(TarefaRequest req) {
        Categoria categoria = categoriaService.buscarPorId(req.categoriaId());
        Tarefa t = new Tarefa();
        aplicar(t, req, categoria);
        return repository.save(t);
    }

    public Tarefa buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa", id));
    }

    public EstatisticasResponse estatisticas() {
        List<Tarefa> todas = repository.findAll();
        long pendentes = todas.stream()
            .filter(t -> t.getStatus() == StatusTarefa.PENDENTE).count();
        // ...
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
```

**Pontos didáticos:**

- `@Service` registra o bean no contexto do Spring.
- `@RequiredArgsConstructor` (Lombok) gera um construtor com todos os campos `final`, que o Spring usa para **injeção de dependências por construtor** — a forma recomendada.
- O método `aplicar()` é um método privado que extrai a lógica de atribuição de campos, evitando repetição entre `criar()` e `atualizar()` — princípio **DRY** (Don't Repeat Yourself).
- `orElseThrow()` usa a API de `Optional` do Java para tratar o caso em que o registro não existe, lançando uma exceção semântica (`ResourceNotFoundException`) em vez de retornar `null`.
- `estatisticas()` usa a **Stream API** do Java para filtrar e contar elementos sem loops explícitos.

---

### 2.6 Controller — API REST

O Controller é a **porta de entrada HTTP**. Sua única responsabilidade é receber a requisição, delegar ao Service e formatar a resposta.

```java
@RestController
@RequestMapping("/api/tarefas")
@RequiredArgsConstructor
public class TarefaController {

    private final TarefaService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TarefaResponse criar(@Valid @RequestBody TarefaRequest req) {
        return TarefaResponse.from(service.criar(req));
    }

    @PatchMapping("/{id}/status")
    public TarefaResponse atualizarStatus(
        @PathVariable Long id,
        @Valid @RequestBody StatusUpdateRequest req) {
        return TarefaResponse.from(service.atualizarStatus(id, req.status()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
```

**Mapa de endpoints do sistema:**

| Método HTTP | URL | Ação |
|---|---|---|
| `GET` | `/api/tarefas` | Lista todas as tarefas |
| `GET` | `/api/tarefas/{id}` | Busca tarefa por ID |
| `GET` | `/api/tarefas/estatisticas` | Retorna contagens por status |
| `POST` | `/api/tarefas` | Cria nova tarefa (HTTP 201) |
| `PUT` | `/api/tarefas/{id}` | Atualiza tarefa completa |
| `PATCH` | `/api/tarefas/{id}/status` | Atualiza apenas o status |
| `DELETE` | `/api/tarefas/{id}` | Remove tarefa (HTTP 204) |
| `GET` | `/api/categorias` | Lista todas as categorias |
| `POST` | `/api/categorias` | Cria nova categoria |
| `PUT` | `/api/categorias/{id}` | Atualiza categoria |
| `DELETE` | `/api/categorias/{id}` | Remove categoria |

**Anotações explicadas:**

| Anotação | Função |
|---|---|
| `@RestController` | Combina `@Controller` + `@ResponseBody`: todo método retorna JSON automaticamente |
| `@RequestMapping("/api/tarefas")` | Define o prefixo base de todas as rotas do controller |
| `@Valid` | Dispara a validação do Bean Validation no objeto recebido |
| `@RequestBody` | Deserializa o JSON da requisição para o objeto Java |
| `@PathVariable` | Extrai o `{id}` da URL |
| `@ResponseStatus(HttpStatus.CREATED)` | Define que a resposta terá código HTTP 201 |

---

### 2.7 Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    public record ApiError(
        Instant timestamp, int status, String error,
        String message, Map<String, String> details) { ... }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(HttpStatus.NOT_FOUND, ex.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
                details.put(fe.getField(), fe.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.of(HttpStatus.BAD_REQUEST, "Erro de validação", details));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage(), null));
    }
}
```

`@RestControllerAdvice` é um **interceptador global de exceções**. Quando qualquer exception não tratada sobe pela pilha de chamadas (Service → Controller), este handler captura e formata uma resposta JSON padronizada.

**Estrutura do erro retornado ao frontend:**

```json
{
  "timestamp": "2026-04-25T14:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Erro de validação",
  "details": {
    "titulo": "Título é obrigatório",
    "categoriaId": "Categoria é obrigatória"
  }
}
```

O campo `details` é especialmente útil para erros de validação: o frontend recebe exatamente qual campo falhou e por quê.

`ResourceNotFoundException` é uma `RuntimeException` simples:

```java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String recurso, Object id) {
        super("%s com id %s não encontrado(a)".formatted(recurso, id));
    }
}
```

Usar `formatted()` com `%s` é uma forma limpa de interpolação de strings em Java.

---

### 2.8 Configuração CORS

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

**CORS (Cross-Origin Resource Sharing)** é uma política de segurança dos navegadores. Por padrão, um navegador bloqueia requisições JavaScript de `http://localhost:4200` para `http://localhost:8080` porque são origens diferentes.

Esta classe configura o Spring para enviar os cabeçalhos HTTP corretos permitindo essa comunicação. As origens permitidas vêm de variável de ambiente (`${app.cors.allowed-origins}`), definida em `application.properties`, o que permite configurar valores diferentes em dev e produção sem alterar código.

---

## 3. Frontend — Camada por Camada

### 3.1 Models — Interfaces TypeScript

```typescript
// tarefa.model.ts
export enum StatusTarefa {
    PENDENTE = 'PENDENTE',
    EM_ANDAMENTO = 'EM_ANDAMENTO',
    CONCLUIDA = 'CONCLUIDA'
}

export interface Tarefa {
    id?: number;
    titulo: string;
    descricao: string;
    dataHora: string;
    status: StatusTarefa;
    categoria?: Categoria;
}

export interface TarefaPayload {
    titulo: string;
    descricao: string;
    dataHora: string | null;
    status: StatusTarefa;
    categoriaId: number;        // envia só o ID, não o objeto
}

export interface Estatisticas {
    total: number;
    pendentes: number;
    emAndamento: number;
    concluidas: number;
}
```

**Simetria com o backend:** o `enum StatusTarefa` do TypeScript espelha exatamente o enum Java. Os valores em string (`'PENDENTE'`) correspondem ao `EnumType.STRING` do JPA.

`TarefaPayload` é diferente de `Tarefa` porque segue a mesma separação do backend: ao **enviar** dados para criar/atualizar, mandamos `categoriaId` (número); ao **receber** dados, o backend já popula o objeto `categoria` completo.

---

### 3.2 Services de API

```typescript
@Injectable({ providedIn: 'root' })
export class TarefaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tarefas`;

  listarTodas(): Observable<Tarefa[]> {
    return this.http.get<Tarefa[]>(this.apiUrl);
  }

  criar(payload: TarefaPayload): Observable<Tarefa> {
    return this.http.post<Tarefa>(this.apiUrl, payload);
  }

  atualizarStatus(id: number, status: StatusTarefa): Observable<Tarefa> {
    return this.http.patch<Tarefa>(`${this.apiUrl}/${id}/status`, { status });
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

**Conceitos-chave:**

- `@Injectable({ providedIn: 'root' })`: registra o serviço como singleton no módulo raiz. Qualquer componente pode injetar a mesma instância.
- `inject(HttpClient)`: forma moderna do Angular (v14+) para injeção de dependências fora do construtor.
- **Observable**: os métodos HTTP retornam `Observable<T>`, não `Promise<T>`. Observables são *lazy* — a requisição HTTP só é feita quando alguém chamar `.subscribe()`. Isso permite cancelar, transformar e combinar operações assíncronas de forma declarativa.
- O `apiUrl` usa `environment.apiUrl` para apontar para `http://localhost:8080/api` em desenvolvimento e para a URL de produção no deploy.

---

### 3.3 Interceptor de Erros

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError(err => {
      const apiMessage = err?.error?.message;
      const fieldErrors = err?.error?.details
        ? Object.values(err.error.details).join(' • ')
        : null;
      const fallback = err?.status === 0
        ? 'Não foi possível conectar ao servidor.'
        : `Erro ${err?.status ?? ''}`.trim();
      toast.error(fieldErrors || apiMessage || fallback);
      return throwError(() => err);
    })
  );
};
```

O interceptor é um **middleware HTTP** no Angular. Ele envolve toda requisição com um operador `catchError` do RxJS, que captura erros antes que eles cheguem ao componente.

**Lógica de mensagem de erro (do mais específico para o mais genérico):**
1. Erros de validação de campo (`details`) → junta os campos com ` • `
2. Mensagem da API (`message`) → ex: "Tarefa com id 99 não encontrada"
3. Erro de conexão (`status === 0`) → o backend está fora do ar
4. Fallback genérico com o código HTTP

O interceptor ainda relança o erro com `throwError(() => err)` para que os componentes também possam reagir (ex: desligar o spinner de carregamento no bloco `error:` do `.subscribe()`).

O interceptor é registrado globalmente em `app.config.ts`:
```typescript
provideHttpClient(withFetch(), withInterceptors([errorInterceptor]))
```

---

### 3.4 Core Services

#### `ThemeService`

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.detectInitial());

  constructor() {
    effect(() => {
      const value = this.theme();           // lê o sinal (cria dependência)
      document.documentElement.classList.toggle('dark', value === 'dark');
      localStorage.setItem(STORAGE_KEY, value);
    });
  }

  toggle(): void {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
  }
}
```

- `signal<Theme>(...)`: cria um **Signal** — a forma moderna de estado reativo no Angular. Diferente de variáveis comuns, o Angular sabe automaticamente quais templates dependem de um Signal e re-renderiza apenas eles.
- `effect(...)`: executa um efeito colateral toda vez que qualquer Signal lido dentro dele mudar. Aqui, toda vez que `theme` muda, a classe CSS `dark` é adicionada/removida do `<html>` e o localStorage é atualizado.
- `detectInitial()`: lê o `localStorage` ou detecta a preferência do sistema operacional via `prefers-color-scheme`.

#### `ToastService`

```typescript
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'info', durationMs = 3500): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void   { this.show(message, 'error', 5000); }
}
```

- Lista de toasts gerenciada por Signal, com IDs únicos para identificação.
- `toasts.update(list => [...list, novoItem])`: atualiza imutavelmente (cria um novo array em vez de mutar o existente) — requisito do modelo de Signal.
- Erros duram 5 segundos; toasts normais, 3,5 segundos.

#### `ConfirmService`

```typescript
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.state.set({ ...options, resolve });
    });
  }

  respond(ok: boolean): void {
    const current = this.state();
    if (current) {
      current.resolve(ok);
      this.state.set(null);
    }
  }
}
```

Padrão inteligente: `ask()` retorna uma `Promise<boolean>` e guarda o `resolve` dentro do Signal. O componente de diálogo chama `respond(true/false)`, que resolve a Promise. Isso permite escrever código de confirmação de forma linear:

```typescript
const ok = await this.confirm.ask({ title: 'Excluir?', ... });
if (!ok) return;
// prossegue com a exclusão
```

---

### 3.5 Components

#### `TarefaComponent` — O componente principal

```typescript
@Component({
  selector: 'app-tarefa',
  imports: [DatePipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tarefa.html'
})
export class TarefaComponent implements OnInit {
  // Estado
  readonly tarefas        = signal<Tarefa[]>([]);
  readonly categorias     = signal<Categoria[]>([]);
  readonly loading        = signal(true);
  readonly saving         = signal(false);
  readonly busca          = signal('');
  readonly filtroStatus   = signal<StatusTarefa | 'TODOS'>('TODOS');
  readonly filtroCategoriaId = signal<number | 'TODAS'>('TODAS');

  // Estado derivado (recalculado automaticamente quando dependências mudam)
  readonly estatisticas = computed(() => {
    const list = this.tarefas();
    return {
      total: list.length,
      pendentes:   list.filter(t => t.status === StatusTarefa.PENDENTE).length,
      emAndamento: list.filter(t => t.status === StatusTarefa.EM_ANDAMENTO).length,
      concluidas:  list.filter(t => t.status === StatusTarefa.CONCLUIDA).length
    };
  });

  readonly tarefasFiltradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const status = this.filtroStatus();
    const catId  = this.filtroCategoriaId();
    return this.tarefas().filter(t => {
      if (status !== 'TODOS' && t.status !== status) return false;
      if (catId !== 'TODAS' && t.categoria?.id !== catId) return false;
      if (termo && !`${t.titulo} ${t.descricao ?? ''}`.toLowerCase().includes(termo)) return false;
      return true;
    });
  });
```

**Signals vs variáveis comuns:**

| Característica | Variável comum | Signal |
|---|---|---|
| Leitura | `this.tarefas` | `this.tarefas()` — chamada de função |
| Escrita | `this.tarefas = [...]` | `this.tarefas.set([...])` |
| Atualização | `this.tarefas.push(...)` | `this.tarefas.update(list => [...list, item])` |
| Re-render | Manual / dirty-check | Automático e granular |

**`computed()`**: cria um Signal cujo valor é calculado com base em outros Signals. O Angular re-executa a função apenas quando algum Signal lido dentro dela mudar — é *memoizado* por padrão.

**`ChangeDetectionStrategy.OnPush`**: diz ao Angular para re-renderizar este componente somente quando as referências dos inputs mudam ou quando um Signal dependente muda — muito mais eficiente que o padrão.

**O método `salvar()`:**

```typescript
salvar(): void {
  const f = this.form();
  if (!f.titulo.trim() || !f.categoriaId) {
    this.toast.error('Preencha o título e selecione uma categoria.');
    return;
  }
  const payload: TarefaPayload = { ... };
  this.saving.set(true);
  const id = this.editandoId();
  const obs = id
    ? this.tarefaService.atualizar(id, payload)
    : this.tarefaService.criar(payload);

  obs.subscribe({
    next: () => {
      this.toast.success(id ? 'Tarefa atualizada.' : 'Tarefa criada.');
      this.cancelar();
      this.saving.set(false);
      this.carregar();    // recarrega a lista do servidor
    },
    error: () => this.saving.set(false)
  });
}
```

A mesma função trata criação e edição. Se `editandoId()` for `null`, chama `criar()`; caso contrário, chama `atualizar()`. O Observable é escolhido antes do `.subscribe()`.

---

### 3.6 Configuração da Aplicação

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor]))
  ],
};
```

Esta é a configuração **standalone** do Angular moderno (v17+) — sem `NgModule`. Tudo é declarado por funções `provide*`:

- `provideRouter(routes)`: configura as rotas da SPA
- `provideHttpClient(withInterceptors([errorInterceptor]))`: registra o `HttpClient` com o interceptor global
- `provideClientHydration(withEventReplay())`: habilita SSR hydration com replay de eventos

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: 'categorias', component: CategoriaComponent },
  { path: 'tarefas',    component: TarefaComponent },
  { path: '',           redirectTo: '/tarefas', pathMatch: 'full' }
];
```

A rota vazia redireciona para `/tarefas`, tornando a tela de tarefas a página inicial.

---

## 4. Fluxo Completo — Criar uma Tarefa

Vamos rastrear o que acontece desde o clique do usuário no botão "Salvar" até a resposta final aparecer na tela.

```
USUÁRIO clica em "Salvar"
     │
     ▼
┌──────────────────────────────────────────────────────────────────┐
│  TarefaComponent.salvar()  [tarefa.ts:120]                       │
│                                                                  │
│  1. Validação local: titulo e categoriaId preenchidos?           │
│  2. Monta TarefaPayload { titulo, descricao, dataHora,           │
│                            status, categoriaId }                 │
│  3. saving.set(true)  → botão fica desabilitado na UI            │
│  4. Chama tarefaService.criar(payload)                           │
└──────────────────────────────┬───────────────────────────────────┘
                               │ retorna Observable<Tarefa>
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  TarefaService.criar()  [services/tarefa.ts:18]                  │
│                                                                  │
│  return this.http.post<Tarefa>(this.apiUrl, payload)             │
│  → Observable ainda não executado (lazy)                         │
└──────────────────────────────┬───────────────────────────────────┘
                               │ .subscribe() dispara a requisição
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  errorInterceptor  [error.interceptor.ts:6]                      │
│                                                                  │
│  next(req)  → repassa a requisição HTTP para frente              │
│  .pipe(catchError(...))  → monitora erros na resposta            │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP POST /api/tarefas
                               │ Body: { "titulo":"...", "categoriaId":1, ... }
                               ▼
════════════════════  FRONTEIRA DE REDE  ════════════════════════
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  CorsConfig  [config/CorsConfig.java]                            │
│                                                                  │
│  Verifica se a origem (localhost:4200) está na allowlist         │
│  Adiciona cabeçalhos CORS na resposta                            │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  TarefaController.criar()  [controller/TarefaController.java:40] │
│                                                                  │
│  @PostMapping → Spring roteia POST /api/tarefas para este método │
│  @Valid → Bean Validation valida o TarefaRequest                 │
│    ✗ falha → GlobalExceptionHandler lança 400 com details        │
│    ✓ ok   → chama service.criar(req)                             │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  TarefaService.criar()  [service/TarefaService.java:31]          │
│                                                                  │
│  1. categoriaService.buscarPorId(req.categoriaId())              │
│     → CategoriaRepository.findById(id)                           │
│     → SELECT * FROM categoria WHERE id = 1                       │
│     → se não existir: lança ResourceNotFoundException → 404      │
│  2. new Tarefa()  → cria entidade vazia                          │
│  3. aplicar(t, req, categoria)  → preenche os campos             │
│  4. repository.save(t)                                           │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  TarefaRepository.save()  [repository/TarefaRepository.java]     │
│  (herdado de JpaRepository)                                      │
│                                                                  │
│  Hibernate gera e executa:                                       │
│  INSERT INTO tarefa                                              │
│    (titulo, descricao, data_hora, status, categoria_id,          │
│     criado_em, atualizado_em)                                    │
│  VALUES (?, ?, ?, ?, ?, NOW(), NOW())                            │
│                                                                  │
│  AuditingEntityListener preenche criadoEm e atualizadoEm        │
│  Banco retorna o ID gerado (AUTO_INCREMENT)                      │
└──────────────────────────────┬───────────────────────────────────┘
                               │ Tarefa com id preenchido
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  TarefaController  (retorno)                                     │
│                                                                  │
│  TarefaResponse.from(tarefaSalva)                                │
│  → converte entidade para DTO                                    │
│  → Spring serializa para JSON                                    │
│  → HTTP 201 Created                                              │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP 201
                               │ Body: { "id":42, "titulo":"...", ... }
                               ▼
════════════════════  FRONTEIRA DE REDE  ════════════════════════
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  errorInterceptor  (caminho de sucesso)                          │
│                                                                  │
│  catchError não é ativado (status 201 = sucesso)                 │
│  Observable emite o valor e completa                             │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  TarefaComponent.salvar() → bloco next:                          │
│                                                                  │
│  toast.success('Tarefa criada.')   → notificação verde           │
│  cancelar()                        → fecha formulário            │
│  saving.set(false)                 → habilita botão              │
│  carregar()                        → GET /api/tarefas            │
│    → tarefas.set(dados)            → lista atualiza na tela      │
└──────────────────────────────────────────────────────────────────┘

USUÁRIO vê a nova tarefa na lista + toast de sucesso
```

---

## 5. Conceitos-Chave Demonstrados

### Backend (Spring Boot / Java)

| Conceito | Onde aparece | Explicação |
|---|---|---|
| **IoC / DI** | Todos os `@Service`, `@Repository`, `@Controller` | O Spring cria e injeta dependências automaticamente |
| **JPA / ORM** | `Tarefa.java`, `Categoria.java` | Classes Java mapeadas para tabelas SQL via anotações |
| **Bean Validation** | `TarefaRequest`, `CategoriaRequest` | Validação declarativa com anotações, sem código manual |
| **DTO Pattern** | `TarefaRequest`, `TarefaResponse` | Separação entre API e modelo interno |
| **Records** | Todos os DTOs | Tipo imutável do Java moderno, ideal para DTOs |
| **Optional / orElseThrow** | `TarefaService.buscarPorId()` | Tratamento explícito de ausência de valor |
| **Stream API** | `TarefaService.estatisticas()` | Processamento funcional de coleções |
| **AOP (Advice)** | `GlobalExceptionHandler` | Tratamento transversal de exceções sem poluir a lógica |
| **Factory Method** | `TarefaResponse.from()` | Centraliza conversão de entidade para DTO |

### Frontend (Angular / TypeScript)

| Conceito | Onde aparece | Explicação |
|---|---|---|
| **Signals** | `TarefaComponent` — todos os estados | Estado reativo granular, sem necessidade de `markForCheck()` |
| **computed()** | `estatisticas`, `tarefasFiltradas` | Estado derivado memoizado |
| **effect()** | `ThemeService` | Efeitos colaterais reativos (DOM, localStorage) |
| **OnPush** | Ambos os components | Otimização: re-renderiza só quando necessário |
| **Interceptor** | `errorInterceptor` | Middleware HTTP — cross-cutting concern de erros |
| **Observable / RxJS** | Todos os services | Programação reativa assíncrona |
| **Standalone Components** | Todos os components | Angular moderno sem NgModule |
| **Promise com resolve** | `ConfirmService` | Padrão para diálogos assíncronos imperativos |
| **inject()** | Todos os components e services | Injeção de dependências funcional (Angular 14+) |

---

## 6. Boas Práticas Aplicadas

### Backend
- **Separação de responsabilidades**: Controller não acessa Repository; Service não conhece HTTP.
- **DTOs para controle de contrato**: o cliente nunca recebe campos internos como `criadoEm`, `atualizadoEm`.
- **Validação em dois pontos**: Bean Validation no DTO (entrada) + validação semântica no Service (ex: categoria existe).
- **Respostas HTTP corretas**: `201 Created` para POST, `204 No Content` para DELETE.
- **Configuração por variáveis de ambiente**: banco, CORS e perfil configurados sem hardcode.
- **Exceções semânticas**: `ResourceNotFoundException` é mais legível que `null` ou `Optional` vazio.

### Frontend
- **Estado imutável**: `.update(list => [...list, item])` nunca muta o array original.
- **Feedback imediato**: `saving.set(true)` desabilita botões antes da requisição completar.
- **Tratamento de erro centralizado**: o interceptor garante que nenhuma falha HTTP passa silenciosamente.
- **Validação client-side antes de chamar a API**: economiza uma viagem de rede em erros óbvios.
- **Confirmação antes de ações destrutivas**: `deletar()` espera confirmação do usuário.

---

## 7. Oportunidades de Melhoria

### Backend
- [ ] **Paginação**: `findAll(Pageable)` no Repository evita trazer todo o banco em uma chamada
- [ ] **Testes**: testes unitários para Services (`@ExtendWith(MockitoExtension.class)`) e de integração (`@SpringBootTest`)
- [ ] **Swagger / OpenAPI**: `springdoc-openapi` gera documentação interativa automaticamente
- [ ] **Logging estruturado**: SLF4J + Logback com campos JSON para monitoramento em produção
- [ ] **Índice no banco**: adicionar `@Index` em colunas de filtro frequente (ex: `status`, `categoria_id`)
- [ ] **Cache**: `@Cacheable` em `listarTodas()` para categorias (dado raramente alterado)

### Frontend
- [ ] **Paginação / scroll infinito**: necessário quando a lista de tarefas crescer
- [ ] **Testes unitários**: Jasmine/Karma para Services e Signals
- [ ] **Testes E2E**: Playwright ou Cypress para fluxos críticos (criar, editar, deletar)
- [ ] **Lazy loading de rotas**: carregar cada rota sob demanda reduz o bundle inicial
- [ ] **Formulários reativos**: `ReactiveFormsModule` para validações mais complexas e testáveis

### Geral
- [ ] **Docker Compose**: orquestrar backend + MySQL + frontend em containers
- [ ] **Autenticação JWT**: Spring Security no backend + guarda de rotas no Angular
- [ ] **CI/CD**: pipeline com GitHub Actions (build, test, linting)
- [ ] **Monitoramento**: Spring Actuator + métricas com Micrometer

---

## Conclusão

Este projeto é um excelente exemplo de arquitetura Full-Stack bem estruturada para aprendizado. Os dois lados espelham os mesmos princípios: **separação de camadas**, **validação de entrada**, **tratamento de erros global** e **feedback claro ao usuário**.

O backend demonstra como o Spring Boot resolve problemas difíceis (persistência, validação, tratamento de erros) com poucas linhas de código — desde que você entenda o que cada anotação faz. O frontend mostra a evolução do Angular moderno com Signals e componentes standalone, que tornam o estado reativo muito mais simples de rastrear.

A próxima evolução natural do projeto é adicionar **autenticação** (Spring Security + JWT) e **testes automatizados** — os dois itens que transformam um projeto de estudo em um projeto de produção.

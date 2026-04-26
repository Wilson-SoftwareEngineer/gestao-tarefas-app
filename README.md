# Gestão de Tarefas — Full Stack

Projeto de aprendizado Java/Angular. Aplicação completa para gerenciar tarefas e categorias, com backend REST em Spring Boot e frontend SPA em Angular conectados a um banco MySQL.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | Java + Spring Boot | 21 / 4.0.6 |
| ORM | Spring Data JPA + Hibernate | — |
| Validação | Jakarta Bean Validation | — |
| Banco de dados | MySQL | 8.0+ |
| Build (backend) | Maven | 3.9+ |
| Frontend | Angular (Standalone + Signals) | 21 |
| Estilos | Tailwind CSS | 4 |
| Runtime JS | Node.js + npm | 20 / 10+ |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                  BROWSER (usuário)                          │
│               Angular SPA · localhost:4200                  │
│                                                             │
│  Components → Services → HttpClient → errorInterceptor     │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/JSON (REST)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Spring Boot API · localhost:8080               │
│                                                             │
│  Controller → Service → Repository → JPA/Hibernate         │
└────────────────────────────┬────────────────────────────────┘
                             │ JDBC
                             ▼
                     ┌──────────────┐
                     │   MySQL DB   │
                     │  db_tarefas  │
                     └──────────────┘
```

---

## Estrutura do Projeto

```
gestao-tarefas-app/
├── backend/                          ← API Spring Boot
│   ├── src/main/java/com/aprendendo/gestaotarefas/
│   │   ├── GestaoTarefasApplication.java
│   │   ├── config/                   ← CORS, configurações
│   │   ├── controller/               ← endpoints REST
│   │   ├── dto/                      ← request/response DTOs
│   │   ├── exception/                ← tratamento global de erros
│   │   ├── model/                    ← entidades JPA
│   │   ├── repository/               ← acesso ao banco
│   │   └── service/                  ← lógica de negócio
│   ├── src/main/resources/
│   │   ├── application.properties    ← configuração base
│   │   ├── application-dev.properties
│   │   └── application-prod.properties
│   ├── .env.example                  ← template de variáveis de ambiente
│   └── pom.xml
│
├── frontend/                         ← SPA Angular
│   ├── src/app/
│   │   ├── components/               ← tarefa, categoria, dashboard
│   │   ├── services/                 ← API, toast, confirm, theme
│   │   ├── models/                   ← interfaces TypeScript
│   │   ├── interceptors/             ← tratamento global de erros HTTP
│   │   └── app.config.ts             ← configuração standalone
│   └── package.json
│
├── requirements.txt                  ← pré-requisitos do sistema
├── ANALISE_PROJETO.md               ← análise didática detalhada
└── README.md
```

---

## Pré-requisitos

Veja [requirements.txt](requirements.txt) para a lista completa. Resumindo:

- **Java 21+** e **Maven 3.9+** (ou use `./mvnw`)
- **Node.js 20+** e **npm 10+**
- **Angular CLI 21+**: `npm install -g @angular/cli`
- **MySQL 8.0+** rodando na porta 3306

---

## Configuração do Banco de Dados

Copie o template de variáveis de ambiente:

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` com suas credenciais:

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_NAME=db_tarefas
DB_USER=root
DB_PASSWORD=sua_senha_aqui
CORS_ORIGINS=http://localhost:4200
```

> O banco `db_tarefas` é criado automaticamente pelo Hibernate na primeira execução.

---

## Como Executar

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

API disponível em `http://localhost:8080`.

### Frontend

```bash
cd frontend
npm install
ng serve
```

Aplicação disponível em `http://localhost:4200`.

---

## Endpoints da API

### Tarefas — `/api/tarefas`

| Método | URL | Descrição | Status |
|---|---|---|---|
| GET | `/api/tarefas` | Lista todas as tarefas | 200 |
| GET | `/api/tarefas/{id}` | Busca tarefa por ID | 200 / 404 |
| GET | `/api/tarefas/estatisticas` | Contagens por status | 200 |
| POST | `/api/tarefas` | Cria nova tarefa | 201 |
| PUT | `/api/tarefas/{id}` | Atualiza tarefa completa | 200 |
| PATCH | `/api/tarefas/{id}/status` | Atualiza apenas o status | 200 |
| DELETE | `/api/tarefas/{id}` | Remove tarefa | 204 |

### Categorias — `/api/categorias`

| Método | URL | Descrição | Status |
|---|---|---|---|
| GET | `/api/categorias` | Lista todas as categorias | 200 |
| POST | `/api/categorias` | Cria nova categoria | 201 |
| PUT | `/api/categorias/{id}` | Atualiza categoria | 200 |
| DELETE | `/api/categorias/{id}` | Remove categoria | 204 |

**Exemplo — criar tarefa:**

```bash
curl -X POST http://localhost:8080/api/tarefas \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Estudar Spring Boot",
    "descricao": "Capítulo 3 — JPA",
    "status": "PENDENTE",
    "categoriaId": 1
  }'
```

---

## Camadas do Backend

| Camada | Responsabilidade |
|---|---|
| `controller/` | Recebe requisições HTTP, valida entrada com `@Valid`, retorna DTOs |
| `service/` | Lógica de negócio — não conhece HTTP nem SQL |
| `repository/` | Acesso ao banco via Spring Data JPA (CRUD herdado de `JpaRepository`) |
| `model/` | Entidades JPA mapeadas para tabelas MySQL |
| `dto/` | Contratos da API (separa entidades internas da representação externa) |
| `exception/` | `GlobalExceptionHandler` formata todos os erros como JSON padronizado |
| `config/` | CORS configurável por variável de ambiente |

---

## Features do Frontend

- **Signals** e `computed()` para estado reativo granular
- **`ChangeDetectionStrategy.OnPush`** em todos os componentes
- **Interceptor HTTP global** para tratamento de erros com toasts
- **Tema claro/escuro** persistido no `localStorage`
- **Confirmação antes de ações destrutivas** (exclusão)
- **Filtros em tempo real** por status, categoria e texto livre
- **Estatísticas** do dashboard calculadas via `computed()`

---

## Análise Didática

Veja [ANALISE_PROJETO.md](ANALISE_PROJETO.md) para uma explicação detalhada de cada camada, padrões de projeto aplicados e o fluxo completo de uma requisição do clique do usuário até o banco de dados.

---

## Próximos Passos

- [ ] Autenticação JWT (Spring Security + guarda de rotas Angular)
- [ ] Paginação nos endpoints e na lista do frontend
- [ ] Testes unitários e de integração (JUnit 5 + Mockito / Jasmine)
- [ ] Docker Compose para subir toda a stack com um comando
- [ ] CI/CD com GitHub Actions
- [ ] Swagger / OpenAPI via `springdoc-openapi`

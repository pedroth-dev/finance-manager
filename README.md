# Finance Manager

Aplicação web de gerenciamento financeiro pessoal (multi-usuário). Stack: React + TypeScript (Vite) + FastAPI + PostgreSQL.

## Pré-requisitos

- Node.js 20+ e npm
- Python 3.11+
- PostgreSQL (banco `finance_manager`)

---

## Como rodar

### Backend

Dependências: `pip install -r requirements.txt`. Configuração via `.env` (ver `backend/.env.example`). O banco `finance_manager` deve existir no PostgreSQL; a conexão é definida em `DATABASE_URL`.

```bash
cd backend
uvicorn app.main:app --reload
```

API em http://localhost:8000 — Documentação em http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App em http://localhost:5173

### Banco de dados

O projeto assume um banco PostgreSQL chamado `finance_manager`. A string de conexão é definida em `DATABASE_URL` no `.env` do backend. Migrações: `alembic upgrade head` (a partir da pasta `backend`).

---

## Deploy (Etapa 8)

**Pagamentos (Stripe, etc.) não fazem parte desta etapa** — apenas infraestrutura e testes em produção.

- **Docker:** na raiz do repo, `docker compose up --build` sobe Postgres, API e front estático (ver `docker-compose.yml`).
- **Hospedagem gratuita / beta:** front (ex.: Vercel) + API + Postgres em serviços com free tier; configure `VITE_API_URL` e `CORS_ORIGINS`. Detalhes em **[docs/DEPLOY.md](docs/DEPLOY.md)**.

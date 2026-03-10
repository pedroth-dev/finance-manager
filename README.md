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

O projeto assume um banco PostgreSQL chamado `finance_manager`. A string de conexão (usuário, senha, host, porta) é configurada em `DATABASE_URL` no `.env` do backend.

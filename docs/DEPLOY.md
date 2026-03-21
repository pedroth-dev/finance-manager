# Deploy — Etapa 8 (testes / produção inicial)

**Escopo desta etapa:** colocar a aplicação acessível com HTTPS (recomendado), Docker opcional, documentação e CI básico.

**Fora de escopo (por enquanto):** integração de pagamento (Stripe, Hotmart, etc.). Isso pode ser adicionado depois, quando for comercializar.

---

## Arquitetura

- **Frontend:** build estático (Vite → `dist/`). Variável **`VITE_API_URL`** deve ser a URL **pública** da API (nunca `localhost` em produção, a menos que só você use no mesmo PC).
- **Backend:** FastAPI + Uvicorn; precisa de **`DATABASE_URL`**, **`SECRET_KEY`**, **`CORS_ORIGINS`** alinhado ao domínio do front.
- **Banco:** PostgreSQL acessível pelo backend.

---

## Opção A — Docker Compose (local ou VPS)

Na raiz do repositório:

```bash
# Opcional: arquivo .env na raiz com SECRET_KEY longa e aleatória
# SECRET_KEY=sua-chave-hex-ou-base64

docker compose up --build
```

- API: http://localhost:8000 — docs em `/docs`
- Front (Nginx): http://localhost:8080  
- Postgres: porta `5432` (usuário/senha `postgres` / `postgres` — **troque em produção**)

O backend roda `alembic upgrade head` antes de subir o Uvicorn.

**CORS:** no `docker-compose.yml` já estão `localhost:5173` e `localhost:8080`. Para outro domínio, defina `CORS_ORIGINS` como lista separada por vírgula ou JSON array (ver `backend/.env.example`).

**Front no Docker:** o build usa `VITE_API_URL` (argumento do build). Se a API não for `http://localhost:8000` (ex.: outro host), ajuste em `docker-compose.yml` em `frontend.build.args.VITE_API_URL` e reconstrua.

---

## Opção B — Deploy gratuito para beta (sem pagamentos)

Combinação comum:

| Camada | Exemplos (free tier) |
|--------|----------------------|
| Front | **Vercel**, **Netlify**, **Cloudflare Pages** |
| API | **Render**, **Fly.io**, **Railway** (ver limites atuais) |
| Postgres | **Neon**, **Supabase**, **Render Postgres** |

Passos resumidos:

1. Criar banco PostgreSQL e copiar a connection string → `DATABASE_URL` no serviço da API.
2. Deploy do backend com: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS` = URL do front (ex.: `https://seu-app.vercel.app`).
3. Rodar migrações no ambiente da API: `alembic upgrade head` (console do provedor ou job de release).
4. No painel do front (Vercel etc.), definir **`VITE_API_URL`** = URL pública da API **antes** do build.
5. Incluir no repositório **`frontend/vercel.json`** (rewrites SPA) ao usar Vercel.

Limitações típicas do free tier: cold start, limites de RAM/DB, possível “sleep” — aceitável para testes com beta testers.

---

## CORS (`CORS_ORIGINS`)

No `.env` ou variáveis do provedor, use **uma** das formas:

- Uma URL: `CORS_ORIGINS=https://meu-front.vercel.app` (sem `/` no final; deve ser **idêntica** ao `Origin` do navegador)
- JSON: `CORS_ORIGINS=["https://meu-front.vercel.app"]`
- Vírgulas: `CORS_ORIGINS=https://a.com,https://b.com`

Se a origem não bater, o preflight `OPTIONS` cai na rota (ex.: 405) **sem** header CORS — o DevTools mostra “No 'Access-Control-Allow-Origin' header”.

Opcional: `CORS_ORIGIN_REGEX` (ex.: `https://.*\.vercel\.app`) para liberar todos os deploys `*.vercel.app` em beta; em produção prefira lista explícita.

Sem a origem correta, o navegador bloqueia as requisições da API (erro de CORS).

---

## Segurança mínima para testes públicos

- `SECRET_KEY` forte e única (não commitar em repositório público).
- HTTPS no front e na API.
- Não usar senha padrão `postgres/postgres` em Postgres exposto à internet.

---

## VPS + Nginx + HTTPS (resumo)

1. Instalar Docker (ou Python + Node + Postgres no host).
2. Nginx como reverse proxy para `api.seudominio.com` → porta 8000 e `app.seudominio.com` → arquivos estáticos ou container do front.
3. **Certbot** (Let’s Encrypt) para TLS.

Detalhes dependem da distribuição; use guias oficiais do Nginx e Certbot.

---

## CI (GitHub Actions)

O workflow `.github/workflows/ci.yml` roda build do frontend e instala dependências do backend (validação básica em cada push/PR). Não faz deploy automático — isso pode ser configurado depois no provedor escolhido.

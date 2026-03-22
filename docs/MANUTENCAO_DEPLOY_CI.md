# Manutenção, deploy e CI/CD

Guia para manter o **Finance Manager** em produção (Vercel, Render, Neon e equivalentes), publicar alterações com segurança e evoluir testes automatizados.

> **Relacionado:** [DEPLOY.md](./DEPLOY.md) (arquitetura e primeiros passos de hospedagem).

---

## Índice

1. [Princípios e peças do sistema](#1-princípios-e-peças-do-sistema)
2. [Onde está cada coisa no repositório](#2-onde-está-cada-coisa-no-repositório)
3. [Variáveis de ambiente (contrato entre serviços)](#3-variáveis-de-ambiente-contrato-entre-serviços)
4. [Fluxo recomendado: da alteração à produção](#4-fluxo-recomendado-da-alteração-à-produção)
5. [Vercel (frontend)](#5-vercel-frontend)
6. [Render (API / backend)](#6-render-api--backend)
7. [Neon (PostgreSQL)](#7-neon-postgresql)
8. [Outros provedores (mesmo padrão)](#8-outros-provedores-mesmo-padrão)
9. [CI/CD hoje e como fortalecer](#9-cicd-hoje-e-como-fortalecer)
10. [Checklist antes de considerar “em produção”](#10-checklist-antes-de-considerar-em-produção)
11. [Se algo quebrar (ordem de investigação)](#11-se-algo-quebrar-ordem-de-investigação)

---

## 1. Princípios e peças do sistema

| Camada | Função | Onde costuma rodar |
|--------|--------|-------------------|
| **Frontend** | SPA React (Vite) | Vercel, Netlify, Cloudflare Pages, Nginx estático |
| **Backend** | API FastAPI | Render, Fly.io, Railway, VPS + Docker |
| **Banco** | PostgreSQL | Neon, Supabase, RDS, Postgres no Docker |

Regras úteis:

- O **build do frontend** “congela” a URL da API em `VITE_API_URL`. Mudou a API? → novo build do front com env correto.
- O **backend** valida CORS contra o domínio real do navegador. Mudou o domínio do front? → atualize `CORS_ORIGINS` (e opcionalmente `CORS_ORIGIN_REGEX`) no serviço da API e redeploy se necessário.
- **Migrações** (`alembic`) alteram o schema do banco; devem rodar **antes** ou **junto** da subida da nova versão da API (no Render com Docker, o `docker-entrypoint.sh` já roda `alembic upgrade head` antes do Uvicorn).

---

## 2. Onde está cada coisa no repositório

| Item | Caminho |
|------|---------|
| Frontend (React) | `frontend/` |
| Backend (FastAPI) | `backend/` |
| Exemplo de env da API | `backend/.env.example` |
| Migrações Alembic | `backend/alembic/` |
| Docker Compose (API + DB + front) | `docker-compose.yml` (raiz) |
| Dockerfile da API (ex.: Render) | `backend/Dockerfile` |
| Entrada do container (migra + Uvicorn) | `backend/docker-entrypoint.sh` |
| SPA no Vercel (fallback de rotas) | `frontend/vercel.json` |
| CI (GitHub Actions) | `.github/workflows/ci.yml` |

---

## 3. Variáveis de ambiente (contrato entre serviços)

### Backend (Render ou equivalente)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Connection string do PostgreSQL (Neon, etc.) |
| `SECRET_KEY` | Sim | Chave forte para JWT; nunca commitar |
| `CORS_ORIGINS` | Sim em produção | URL(s) do front; **igual** ao `Origin` do navegador (sem `/` no final), ou várias separadas por vírgula, ou JSON array |
| `CORS_ORIGIN_REGEX` | Não | Ex.: liberar `*.vercel.app` em beta (avaliar risco) |
| `PORT` | Geralmente automático | Render injeta; Docker local usa 8000 |

### Frontend (Vercel ou equivalente)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_API_URL` | Sim em produção | URL **pública** da API (`https://sua-api.onrender.com`), **sem** barra no final |

**Importante:** no Vite, só variáveis com prefixo `VITE_` entram no bundle. Alterou `VITE_API_URL`? → é preciso **novo deploy** (novo build).

### Banco (Neon)

- A connection string vai para `DATABASE_URL` no backend.
- Não exponha a string em repositório público; use apenas painéis de env.

---

## 4. Fluxo recomendado: da alteração à produção

Fluxo **seguro** e simples (trabalho solo ou time pequeno):

1. **Branch** a partir de `main` (ex.: `feat/relatorio-mensal`).
2. **Desenvolver localmente** — backend com `.env` local; front com `npm run dev` e, se precisar da API real, `VITE_API_URL` apontando para localhost ou para uma API de staging.
3. **Validar localmente**
   - Front: `npm run build` e `npm run lint`
   - Back: app sobe (`uvicorn`) e, se houver testes, `pytest`
4. **Abrir Pull Request** para `main` (mesmo que você mergee sozinho).
5. Esperar o **CI verde** no GitHub (veja [seção 9](#9-cicd-hoje-e-como-fortalecer)).
6. **Merge** em `main`.
7. **Deploys** (automáticos na maioria dos casos):
   - **Vercel:** deploy de produção ao push em `main` (se o projeto estiver ligado a esse branch).
   - **Render:** deploy ao detectar novo commit em `main` (conforme configurado no serviço).

### Ordem quando a mudança afeta API + contrato com o front

- Se mudou **só o front:** deploy Vercel basta (com `VITE_API_URL` já correto).
- Se mudou **só o back** (compatível com o front atual): deploy Render; CORS já deve incluir o domínio do Vercel.
- Se mudou **API + formato de dados / rotas:** idealmente **API primeiro** (ou feature flag / compatibilidade temporária), depois front — ou front preparado para tolerar ambos até a API subir.
- Se mudou **schema do banco:** garantir que **migrações** estejam no repo e que o deploy da API execute `alembic upgrade head` (já o caso no Docker do Render com `docker-entrypoint.sh`).

---

## 5. Vercel (frontend)

### O que configurar uma vez

- Repositório conectado, branch de **Production** (ex.: `main`).
- **Environment Variables:** `VITE_API_URL` para **Production** (e **Preview** se quiser API diferente em testes).
- Arquivo `frontend/vercel.json` no projeto (rewrites SPA).

### Manutenção do dia a dia

| Ação | Onde |
|------|------|
| Ver builds / erros | Project → **Deployments** |
| Logs de runtime (Edge/Functions) | **Logs** |
| Alterar env | **Settings → Environment Variables** |
| Domínio customizado | **Settings → Domains** |
| Analytics | **Analytics** (se `@vercel/analytics` estiver no código) |

### Previews (deploy por PR)

Por padrão, cada PR pode gerar uma **Preview URL**. Se a API em Render só libera CORS para o domínio de **produção** do Vercel, as previews **podem falhar por CORS**. Opções:

- Adicionar temporariamente origens de preview em `CORS_ORIGINS`, ou
- Usar `CORS_ORIGIN_REGEX` (ex. `https://.*\.vercel\.app`) **só em ambiente de staging**, ou
- Ter uma API de staging com CORS mais permissivo.

### Colocar uma feature em produção

1. Merge na branch de produção (`main`).
2. Aguardar deploy “Production” ficar **Ready**.
3. Abrir a URL de produção e fazer um **smoke test** (login, uma ação crítica).

---

## 6. Render (API / backend)

### O que configurar uma vez

- **Web Service** (ex.: Docker) apontando para o repositório e `Dockerfile` em `backend/` (ou raiz, conforme seu setup).
- **Environment:** `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS` (e opcionais).
- Branch de deploy (ex.: `main`).

### Manutenção do dia a dia

| Ação | Onde |
|------|------|
| Logs da aplicação | **Logs** |
| Variáveis | **Environment** (menu do serviço) |
| Reiniciar / rebuild | **Manual Deploy** ou novo commit |
| Shell temporário (debug) | **Shell** (se disponível no plano) |

### Depois de mudar variável de ambiente

Salvar no painel e, se o serviço não reiniciar sozinho, usar **Manual Deploy** ou restart.

### Docker e migrações

O script `backend/docker-entrypoint.sh` executa:

1. `alembic upgrade head`
2. `uvicorn ...`

Assim, cada deploy aplica migrações pendentes antes de subir a API. **Evite** migrações destrutivas sem backup e sem planejamento.

---

## 7. Neon (PostgreSQL)

### Manutenção básica

- **Connection string:** copiar do painel (modo “transaction” ou o recomendado pela doc Neon) para `DATABASE_URL` no Render.
- **Branches de banco (Neon):** úteis para PRs com DB isolado — exige apontar `DATABASE_URL` de **preview/staging** para o branch certo (mais avançado).
- **Backup / retenção:** conforme plano; não dependa só do free tier para dados críticos.

### Rotação de credenciais

Se resetar senha ou URL: atualizar **só** `DATABASE_URL` no Render e redeploy.

---

## 8. Outros provedores (mesmo padrão)

Qualquer combinação **Front estático + API + Postgres** segue o mesmo contrato:

1. **Build do front** com `VITE_API_URL` apontando para a API pública.
2. **API** com `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS` alinhado ao front.
3. **HTTPS** nos dois lados.
4. **Migrações** na subida da API ou job de release.

Exemplos: Netlify/Cloudflare Pages (front), Fly.io/Railway (API), Supabase (Postgres + opcional API).

---

## 9. CI/CD hoje e como fortalecer

### O que o projeto já faz (`.github/workflows/ci.yml`)

Disparo: **push** e **pull_request** em `main` / `master`.

| Job | O que valida |
|-----|----------------|
| **frontend** | `npm ci` + `npm run build` (com `VITE_API_URL` fake para o build passar) |
| **backend** | `pip install` + import de `app.main` (garante que o app FastAPI instancia) |

Isso **não** faz deploy automático — deploy continua nos painéis (Vercel/Render) ligados ao Git.

### “Sisteminha” para não quebrar produção

Objetivo: **nada entra em `main` sem passar por barreiras automáticas** (e, quando possível, revisão humana).

#### 1) Branch protection (GitHub)

Em **Settings → Branches → Branch protection rules** para `main`:

- Exigir **Pull Request** antes do merge.
- Exigir que **status checks** passem (CI).
- (Opcional) Exigir aprovação de revisão.

Assim, o CI roda no PR; se falhar, você não mergeia.

#### 2) Fortalecer o CI (evolução recomendada)

Ordem prática do mais barato ao mais completo:

| Etapa | Comando / ação | Efeito |
|-------|----------------|--------|
| A | `npm run lint` no job frontend | Pega erros de estilo e vários bugs óbvios |
| B | `pytest` no backend (quando existir pasta de testes) | Regressões na API |
| C | Job com Postgres de serviço + testes de integração | Mais perto do ambiente real |
| D | Deploy **só** após CI verde (GitHub → Vercel/Render com “Wait for CI”) | Evita publicar build quebrado |

**Exemplo** — adicionar lint ao job frontend (trecho para colar no workflow após `npm ci`):

```yaml
- run: npm run lint
```

**Exemplo** — job backend com pytest (quando você tiver testes e `pytest` em `requirements-dev.txt` ou `requirements.txt`):

```yaml
- run: pip install -r requirements.txt pytest
- run: pytest -q
```

#### 3) Pré-commit local (opcional)

Ferramentas como `pre-commit` com ESLint/Ruff formatam e validam **antes** do commit, reduzindo falhas no CI.

#### 4) CD (deploy automático)

- **Vercel:** já costuma fazer deploy ao merge em `main`; pode configurar para ignorar deploy se CI falhar (integração GitHub).
- **Render:** Auto Deploy no branch `main`; mesma ideia — só merge com CI verde.

#### 5) Ambientes

- **Production:** `main` + URLs estáveis.
- **Preview:** PRs no Vercel + (opcional) API/staging no Render com outro serviço e outro `DATABASE_URL`.

Isso não substitui **testes**: reduz risco, mas smoke test manual após deploy importante ainda ajuda.

---

## 10. Checklist antes de considerar “em produção”

- [ ] `VITE_API_URL` na Vercel = URL pública da API (HTTPS).
- [ ] `CORS_ORIGINS` no Render = origem exata do front (ou regex consciente).
- [ ] `SECRET_KEY` forte e exclusiva do ambiente real.
- [ ] `DATABASE_URL` aponta para o banco correto (Neon produção).
- [ ] Migrações aplicadas (automáticas no entrypoint ou job manual).
- [ ] CI verde no último commit de `main`.
- [ ] Teste manual: registro/login + fluxo principal.
- [ ] `/health` da API responde (e DB “connected”, se aplicável).

---

## 11. Se algo quebrar (ordem de investigação)

1. **Front:** abrir DevTools → **Network** — URL chamada é a API certa? Erro **CORS**? → conferir `CORS_ORIGINS` e redeploy API.
2. **API:** **Logs** no Render — traceback na subida? erro de `SettingsError` / env?
3. **Banco:** API loga falha de conexão? → `DATABASE_URL`, IP/firewall Neon, credenciais.
4. **Deploy antigo:** Vercel mostrando commit velho? → redeploy ou limpar cache.
5. **Migração:** erro no `alembic` no startup? → logs do container; corrigir migration ou estado do banco com cuidado (backup).

---

## Resumo

- **Manutenção** = manter os três contratos alinhados: **URL da API no front**, **CORS na API**, **DB na API**.
- **Produção com menos risco** = **PR + CI verde + branch protection** + deploy automático só da branch estável.
- **Evolução natural do CI** = **lint** → **pytest** → **Postgres em CI** → **gates de deploy**.

Para detalhes iniciais de hospedagem, continue usando **[DEPLOY.md](./DEPLOY.md)**.

# 🚀 Guia de Deploy - Rotator Grupos WhatsApp

## 📋 Arquitetura: Docker Swarm + Traefik

**Estratégia:** Docker Swarm é a escolha correta para este serviço porque:
- ✅ Simples, estável e confiável
- ✅ Integração nativa com Traefik
- ✅ Secrets seguros do Swarm
- ✅ Healthcheck e rollback automáticos
- ✅ Fácil manutenção via Portainer

## 🔧 Pré-requisitos

- ✅ Docker Swarm ativo
- ✅ Traefik rodando na rede `traefik-public`
- ✅ Portainer instalado
- ✅ DNS `rotator.descontinbom.com.br` apontando para a VPS

## 📦 Passo 1: Preparar o Servidor

**No servidor (manager node):**

```bash
# Clone o repositório
git clone https://github.com/vandersonaxe-creator/rotator-whatsapp.git
cd rotator-whatsapp

# Dê permissão aos scripts (opcional)
chmod +x scripts/*.sh
```

## 🔐 Passo 2: Criar Secrets no Docker Swarm

**⚠️ CRÍTICO:** Secrets devem ser criados ANTES do deploy.

### Opção A: Via Script (Recomendado)

```bash
# Edite o script com seus valores reais
nano scripts/create-secrets.sh

# Execute
./scripts/create-secrets.sh
```

### Opção B: Manual

```bash
# Criar secrets
echo "postgresql://user:pass@host:5432/db?sslmode=require" | docker secret create database_url -
echo "https://evolution.hubplay.pro" | docker secret create evolution_base_url -
echo "sua-api-key-aqui" | docker secret create evolution_apikey -
echo "seu-token-interno-seguro" | docker secret create internal_token -

# Verificar
docker secret ls
```

**📌 IMPORTANTE:**
- Secrets são **imutáveis** - para atualizar: `docker secret rm <nome>` → recriar
- Secrets são montados em `/run/secrets/<nome>` dentro do container
- O código lê automaticamente via `_FILE` suffix

## 🏗️ Passo 3: Build da Imagem

```bash
# Build da imagem
docker build -t rotator-grupos:latest .

# (Opcional) Verificar imagem
docker images | grep rotator-grupos
```

## 🚀 Passo 4: Deploy via Portainer

### Método Recomendado: Portainer UI

1. **Acesse Portainer** → **Stacks** → **Add Stack**

2. **Nome:** `rotator-grupos`

3. **Build method:** `Repository`

4. **Repository URL:** `https://github.com/vandersonaxe-creator/rotator-whatsapp`

5. **Repository reference:** `main` (ou `refs/heads/main`)

6. **Compose path:** `docker-compose.swarm.yml`

7. **Auto-update:** ✅ Habilitado (opcional)

8. **Deploy the stack**

### Método Alternativo: CLI

```bash
# Deploy direto
docker stack deploy -c docker-compose.swarm.yml rotator-grupos

# Ou use o script
./scripts/deploy.sh
```

## ✅ Passo 5: Verificar Deploy

### Verificar Status

```bash
# Status do serviço
docker service ls | grep rotator

# Deve mostrar: 1/1 replicas
```

### Verificar Logs

```bash
# Logs em tempo real
docker service logs -f rotator-grupos_rotator-grupos

# Últimas 50 linhas
docker service logs --tail 50 rotator-grupos_rotator-grupos
```

### Verificar Tasks

```bash
# Ver tasks do serviço
docker service ps rotator-grupos_rotator-grupos

# Se estiver "Rejected", ver detalhes:
docker service ps --no-trunc rotator-grupos_rotator-grupos
```

### Testar Healthcheck

```bash
# Via Traefik (HTTPS)
curl https://rotator.descontinbom.com.br/health

# Direto no container (se necessário)
docker exec -it $(docker ps -q --filter "name=rotator") curl http://localhost:3000/health
```

## 🌐 Passo 6: Configurar Traefik (Automático)

O `docker-compose.swarm.yml` já inclui todas as labels do Traefik:

- ✅ **Host:** `rotator.descontinbom.com.br`
- ✅ **Entrypoint:** `websecure` (HTTPS)
- ✅ **Certificado:** Let's Encrypt automático
- ✅ **Porta:** 3000 (interna)

**Se precisar mudar o domínio:**

Edite a label no `docker-compose.swarm.yml`:
```yaml
- "traefik.http.routers.rotator-grupos.rule=Host(`seu-dominio.com.br`)"
```

## 🔄 Atualização do Serviço

### Via Portainer (Recomendado)

1. **Stacks** → `rotator-grupos` → **Editor**
2. Ajuste o `docker-compose.swarm.yml`
3. **Update the stack**

### Via CLI

```bash
# Rebuild da imagem
docker build -t rotator-grupos:latest .

# Atualizar serviço
docker service update --image rotator-grupos:latest rotator-grupos_rotator-grupos

# Ou atualizar stack completa
docker stack deploy -c docker-compose.swarm.yml rotator-grupos
```

## 🐛 Troubleshooting

### ❌ Task em estado "Rejected"

**Causa mais comum:** Secrets não encontrados

**Solução:**
```bash
# 1. Verificar secrets existem
docker secret ls

# 2. Ver erro detalhado
docker service ps --no-trunc rotator-grupos_rotator-grupos

# 3. Criar secrets faltantes
./scripts/create-secrets.sh
```

### ❌ Container não inicia / Crash loop

**Verificar logs:**
```bash
docker service logs --tail 100 rotator-grupos_rotator-grupos
```

**Problemas comuns:**
- `DATABASE_URL` inválido → Verificar connection string
- `EVOLUTION_APIKEY` incorreta → Verificar API key
- Erro de conexão PostgreSQL → Verificar SSL e credenciais
- Porta 3000 em uso → Não deve acontecer (Traefik roteia)

### ❌ Healthcheck falhando

**Testar manualmente:**
```bash
# Dentro do container
docker exec -it $(docker ps -q --filter "name=rotator") curl -f http://localhost:3000/health

# De fora (via Traefik)
curl -f https://rotator.descontinbom.com.br/health
```

**Se falhar:**
- Verificar se app está rodando: `docker service logs rotator-grupos_rotator-grupos`
- Verificar se porta 3000 está aberta internamente
- Verificar se `/health` endpoint existe

### ❌ Traefik não roteia

**Verificar:**
```bash
# Ver labels do serviço
docker service inspect rotator-grupos_rotator-grupos | grep -A 20 Labels

# Verificar rede
docker network inspect traefik-public | grep rotator
```

**Solução:**
- Verificar se rede `traefik-public` existe: `docker network ls | grep traefik`
- Verificar labels do Traefik no `docker-compose.swarm.yml`
- Verificar se Traefik está rodando: `docker service ls | grep traefik`

## 📊 Monitoramento

### Portainer
- **Stacks** → Ver status, logs, recursos, métricas

### Logs em Tempo Real
```bash
docker service logs -f rotator-grupos_rotator-grupos
```

### Métricas de Recursos
```bash
docker stats $(docker ps -q --filter "name=rotator")
```

## 🔒 Segurança

✅ **Já implementado:**
- Secrets do Docker Swarm (não expostos em env vars)
- HTTPS via Traefik (Let's Encrypt)
- Token interno para endpoints protegidos
- Healthcheck isolado
- Usuário não-root no container

⚠️ **Recomendações:**
- Firewall (UFW/iptables) bloqueando portas desnecessárias
- Acesso ao Portainer apenas via VPN/SSH tunnel
- Rotação periódica de tokens
- Monitoramento de logs de acesso

## 📝 Variáveis de Ambiente

| Variável | Tipo | Como é lida | Descrição |
|----------|------|-------------|-----------|
| `PORT` | Env | Direto | Porta do servidor (padrão: 3000) |
| `DATABASE_URL` | Secret | Via `DATABASE_URL_FILE` | Connection string PostgreSQL |
| `EVOLUTION_BASE_URL` | Secret | Via `EVOLUTION_BASE_URL_FILE` | URL base da Evolution API |
| `EVOLUTION_APIKEY` | Secret | Via `EVOLUTION_APIKEY_FILE` | API key da Evolution |
| `INTERNAL_TOKEN` | Secret | Via `INTERNAL_TOKEN_FILE` | Token para endpoints internos |

## 🎯 Endpoints

### Público
```
GET https://rotator.descontinbom.com.br/join/:slug
→ Redirect 302 para grupo WhatsApp ativo
```

### Interno (Protegido)
```
POST https://rotator.descontinbom.com.br/internal/join-pools/:slug/rotate
Headers:
  x-internal-token: <INTERNAL_TOKEN>
→ Executa rotação do pool
```

### Health
```
GET https://rotator.descontinbom.com.br/health
→ { "status": "ok" }
```

## 🔄 Integração com n8n

Configure o n8n para chamar o endpoint interno a cada 1 minuto:

**HTTP Request Node:**
- **Method:** `POST`
- **URL:** `https://rotator.descontinbom.com.br/internal/join-pools/descontinho/rotate`
- **Headers:**
  - `x-internal-token`: `<seu-token>`

**Cron Trigger:**
- **Expression:** `*/1 * * * *` (a cada 1 minuto)

## 📚 Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.swarm.yml` | ✅ Configuração para Swarm (PRODUÇÃO) |
| `docker-compose.yml` | Desenvolvimento local |
| `Dockerfile` | Build da imagem |
| `src/config/env.ts` | Carregador de env/secrets |
| `scripts/create-secrets.sh` | Script para criar secrets |
| `scripts/deploy.sh` | Script de deploy completo |

## ✅ Checklist de Deploy

- [ ] Servidor preparado (Git, Docker Swarm ativo)
- [ ] Secrets criados no Swarm (`docker secret ls`)
- [ ] Imagem buildada (`docker images | grep rotator`)
- [ ] Stack deployada via Portainer
- [ ] Serviço rodando (1/1 replicas)
- [ ] Healthcheck passando (`/health` retorna 200)
- [ ] Traefik roteando (HTTPS funcionando)
- [ ] Endpoint público testado (`/join/:slug`)
- [ ] Endpoint interno testado (`/internal/.../rotate`)
- [ ] n8n configurado para chamar endpoint interno

## 🎉 Pronto!

Seu serviço está rodando em produção e pronto para uso!

**Acesse:** https://rotator.descontinbom.com.br/health

---

**Problemas?** Consulte a seção [Troubleshooting](#-troubleshooting) acima.

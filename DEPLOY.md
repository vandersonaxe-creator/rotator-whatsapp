# 🚀 Guia de Deploy - Rotator Grupos WhatsApp

## 📋 Estratégia Recomendada: Docker Swarm + Traefik

Este serviço é **perfeito para Docker Swarm** porque:
- ✅ Simples e estável
- ✅ Integra bem com Traefik (já configurado)
- ✅ Usa secrets para segurança
- ✅ Healthcheck automático
- ✅ Fácil de manter e atualizar

## 🔧 Pré-requisitos

- Docker Swarm ativo
- Traefik rodando na rede `traefik-public`
- Portainer (opcional, mas recomendado)
- DNS apontando para o servidor (ex: `rotator.descontinbom.com.br`)

## 📦 Passo 1: Build da Imagem

**No servidor (manager node):**

```bash
# Clone o repositório
git clone https://github.com/vandersonaxe-creator/rotator-whatsapp.git
cd rotator-whatsapp

# Build da imagem
docker build -t rotator-grupos:latest .

# (Opcional) Tag para registry privado
# docker tag rotator-grupos:latest seu-registry/rotator-grupos:latest
# docker push seu-registry/rotator-grupos:latest
```

## 🔐 Passo 2: Criar Secrets no Docker Swarm

**No servidor (manager node):**

```bash
# Criar secrets
echo "postgresql://user:pass@host:5432/db?sslmode=require" | docker secret create database_url -
echo "https://evolution.hubplay.pro" | docker secret create evolution_base_url -
echo "sua-api-key-aqui" | docker secret create evolution_apikey -
echo "seu-token-interno-seguro" | docker secret create internal_token -

# Verificar secrets criados
docker secret ls
```

**⚠️ IMPORTANTE:**
- Secrets são **imutáveis** (não podem ser editados)
- Para atualizar, delete e recrie: `docker secret rm <nome>` → `docker secret create <nome> -`
- Secrets são montados em `/run/secrets/<nome>` dentro do container

## 🚀 Passo 3: Deploy via Portainer (Recomendado)

### Opção A: Via Portainer UI

1. **Acesse Portainer** → **Stacks** → **Add Stack**

2. **Nome da Stack:** `rotator-grupos`

3. **Web editor:** Cole o conteúdo de `docker-compose.swarm.yml`

4. **Deploy the stack**

### Opção B: Via CLI (Alternativa)

```bash
docker stack deploy -c docker-compose.swarm.yml rotator-grupos
```

## ✅ Passo 4: Verificar Deploy

```bash
# Ver status do serviço
docker service ls | grep rotator

# Ver logs
docker service logs -f rotator-grupos_rotator-grupos

# Ver detalhes
docker service ps rotator-grupos_rotator-grupos

# Verificar healthcheck
curl http://localhost:3000/health
```

## 🌐 Passo 5: Configurar Traefik (Automático)

O `docker-compose.swarm.yml` já inclui labels do Traefik:

- **Host:** `rotator.descontinbom.com.br`
- **Entrypoint:** `websecure` (HTTPS)
- **Certificado:** Let's Encrypt automático
- **Porta interna:** 3000

**Ajuste o host no arquivo se necessário:**

```yaml
- "traefik.http.routers.rotator-grupos.rule=Host(`seu-dominio.com.br`)"
```

## 🔄 Atualização do Serviço

### Via Portainer:
1. **Stacks** → `rotator-grupos` → **Editor**
2. Ajuste o código/config
3. **Update the stack**

### Via CLI:
```bash
# Rebuild da imagem
docker build -t rotator-grupos:latest .

# Atualizar stack
docker service update --image rotator-grupos:latest rotator-grupos_rotator-grupos
```

## 🐛 Troubleshooting

### Task em estado "Rejected"

**Causa comum:** Secrets não encontrados

**Solução:**
```bash
# Verificar secrets
docker secret ls

# Ver logs detalhados
docker service ps --no-trunc rotator-grupos_rotator-grupos
```

### Container não inicia

**Verificar logs:**
```bash
docker service logs --tail 100 rotator-grupos_rotator-grupos
```

**Problemas comuns:**
- DATABASE_URL inválido
- Evolution API key incorreta
- Porta 3000 já em uso

### Healthcheck falhando

**Testar manualmente:**
```bash
# Dentro do container
docker exec -it <container-id> curl http://localhost:3000/health

# De fora
curl http://<server-ip>:3000/health
```

## 📊 Monitoramento

### Portainer
- **Stacks** → Ver status, logs, recursos

### Logs em tempo real
```bash
docker service logs -f rotator-grupos_rotator-grupos
```

### Métricas
```bash
docker stats $(docker ps -q --filter "name=rotator-grupos")
```

## 🔒 Segurança

✅ **Já implementado:**
- Secrets do Docker Swarm
- HTTPS via Traefik
- Token interno para endpoints protegidos
- Healthcheck isolado

⚠️ **Recomendações adicionais:**
- Use firewall (UFW/iptables)
- Limite acesso ao Portainer
- Rotacione tokens periodicamente
- Monitore logs de acesso

## 📝 Variáveis de Ambiente

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `PORT` | Env | Porta do servidor (padrão: 3000) |
| `DATABASE_URL` | Secret | Connection string PostgreSQL |
| `EVOLUTION_BASE_URL` | Secret | URL base da Evolution API |
| `EVOLUTION_APIKEY` | Secret | API key da Evolution |
| `INTERNAL_TOKEN` | Secret | Token para endpoints internos |

## 🎯 Endpoints

### Público
- `GET https://rotator.descontinbom.com.br/join/:slug` → Redirect para grupo

### Interno (protegido)
- `POST https://rotator.descontinbom.com.br/internal/join-pools/:slug/rotate`
- Header: `x-internal-token: <INTERNAL_TOKEN>`

### Health
- `GET https://rotator.descontinbom.com.br/health` → Status do serviço

## 🔄 Integração com n8n

Configure o n8n para chamar o endpoint interno a cada 1 minuto:

```javascript
// HTTP Request node
Method: POST
URL: https://rotator.descontinbom.com.br/internal/join-pools/descontinho/rotate
Headers:
  x-internal-token: <seu-token>
```

**Cron:** `*/1 * * * *` (a cada 1 minuto)

## 📚 Arquivos Importantes

- `docker-compose.swarm.yml` → Configuração para Swarm
- `Dockerfile` → Build da imagem
- `src/config/env.ts` → Carregador de variáveis (suporta secrets)

## ✅ Checklist de Deploy

- [ ] Imagem buildada
- [ ] Secrets criados no Swarm
- [ ] Stack deployada via Portainer
- [ ] Serviço rodando (1/1 replicas)
- [ ] Healthcheck passando
- [ ] Traefik roteando corretamente
- [ ] HTTPS funcionando
- [ ] Endpoint `/health` respondendo
- [ ] Endpoint público `/join/:slug` testado
- [ ] Endpoint interno `/internal/.../rotate` testado
- [ ] n8n configurado para chamar endpoint interno

---

**Pronto!** Seu serviço está rodando em produção. 🎉

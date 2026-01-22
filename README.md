# Rotator Grupos WhatsApp

Sistema de rotação automática de grupos WhatsApp usando Fastify + TypeScript + PostgreSQL.

## 🎯 Objetivo

Automatizar a criação e rotação de grupos WhatsApp quando atingem um limite de membros, mantendo sempre um grupo ativo disponível para novos participantes.

## 🏗️ Stack

- **Node.js** + **TypeScript**
- **Fastify** (web framework)
- **PostgreSQL** (via `@fastify/postgres`)
- **Axios** (HTTP client)
- **Evolution API** (WhatsApp gateway)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL (Supabase)
- Evolution API configurada
- Variáveis de ambiente configuradas

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas credenciais
```

## ⚙️ Configuração

Edite o arquivo `.env` com as seguintes variáveis:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
EVOLUTION_BASE_URL=https://evolution.hubplay.pro
EVOLUTION_APIKEY=sua-api-key
INTERNAL_TOKEN=seu-token-interno-seguro
```

## 🗄️ Banco de Dados

O schema `rotator` deve existir no PostgreSQL com as tabelas:

- `rotator.wa_group_pools` - Pools de grupos
- `rotator.wa_groups` - Grupos individuais

Execute o seed para criar dados de exemplo:

```bash
psql -d seu_banco -f migrations/seed.sql
```

## 🏃 Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
# Build
npm run build

# Start
npm start
```

## 📡 Endpoints

### 1. Endpoint Público - Join

**GET** `/join/:slug`

Redireciona para o grupo WhatsApp ativo.

**Exemplo:**
```bash
curl -I http://localhost:3000/join/descontinho
```

**Respostas:**
- `302` - Redireciona para `invite_url` do grupo ativo
- `200` (HTML) - Grupo temporariamente indisponível

**Headers obrigatórios:**
- `Cache-Control: no-store`

### 2. Endpoint Interno - Rotação

**POST** `/internal/join-pools/:slug/rotate`

Executa a rotação do pool (deve ser chamado por cron externo a cada 1 minuto).

**Headers obrigatórios:**
- `x-internal-token: seu-token-interno`

**Exemplo:**
```bash
curl -X POST http://localhost:3000/internal/join-pools/descontinho/rotate \
  -H "x-internal-token: seu-token-interno"
```

**Respostas:**
- `200` - Rotação executada com sucesso
- `401` - Token inválido
- `500` - Erro na rotação

### 3. Health Check

**GET** `/health`

Verifica se o servidor está funcionando.

**Exemplo:**
```bash
curl http://localhost:3000/health
```

## 🔄 Fluxo de Rotação

1. **Criação do primeiro grupo (#01)**
   - Se não houver `current_group_id` no pool
   - Cria grupo via Evolution API
   - Aplica foto e descrição padrão
   - Gera invite URL
   - Atualiza `current_group_id`

2. **Verificação periódica**
   - Consulta `member_count` via Evolution API
   - Atualiza no banco de dados
   - Se `member_count >= threshold`:
     - Marca grupo atual como `FULL`
     - Cria próximo grupo (#02, #03, ...)
     - Atualiza `current_group_id`
     - Incrementa `next_sequence`

## ✅ Checklist de Validação

### 1. Testar redirecionamento 302

```bash
# Deve retornar 302 com Cache-Control: no-store
curl -I http://localhost:3000/join/descontinho
```

### 2. Testar criação de grupo

```bash
# Primeira chamada deve criar grupo #01
curl -X POST http://localhost:3000/internal/join-pools/descontinho/rotate \
  -H "x-internal-token: seu-token"
```

### 3. Testar rotação ao atingir threshold

```bash
# Simular threshold atingido (ajustar member_count manualmente no banco)
# Chamar rotate novamente deve criar grupo #02
curl -X POST http://localhost:3000/internal/join-pools/descontinho/rotate \
  -H "x-internal-token: seu-token"
```

## 🐳 Deploy no Docker Swarm

### docker-compose.yml

```yaml
version: '3.8'

services:
  rotator-grupos:
    image: rotator-grupos:latest
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DATABASE_URL=${DATABASE_URL}
      - EVOLUTION_BASE_URL=${EVOLUTION_BASE_URL}
      - EVOLUTION_APIKEY=${EVOLUTION_APIKEY}
      - INTERNAL_TOKEN=${INTERNAL_TOKEN}
    secrets:
      - database_url
      - evolution_apikey
      - internal_token
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
```

### Secrets

```bash
# Criar secrets no Docker Swarm
echo "postgresql://..." | docker secret create database_url -
echo "sua-api-key" | docker secret create evolution_apikey -
echo "seu-token" | docker secret create internal_token -
```

### Deploy

```bash
# Build da imagem
docker build -t rotator-grupos:latest .

# Deploy no Swarm
docker stack deploy -c docker-compose.yml rotator
```

## 📝 Notas Importantes

- Todas as queries SQL usam explicitamente o schema `rotator`
- A rotação usa transações PostgreSQL com `SELECT ... FOR UPDATE` para evitar race conditions
- O endpoint público nunca lança exceções, sempre retorna HTML amigável em caso de erro
- O Evolution API client tem timeout de 8s e retry simples (1 tentativa)
- O endpoint interno é protegido por token via header `x-internal-token`

## 🔒 Segurança

- Nunca commitar arquivo `.env`
- Usar tokens seguros para `INTERNAL_TOKEN`
- Configurar CORS se necessário
- Validar inputs nas rotas

## 📄 Licença

ISC

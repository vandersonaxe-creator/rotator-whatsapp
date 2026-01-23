# Rotator Grupos WhatsApp

Sistema de rotação automática de grupos WhatsApp usando Fastify + TypeScript + PostgreSQL + Evolution API.

## 🎯 Objetivo

Automatizar a criação e rotação de grupos WhatsApp quando atingem um limite de membros, mantendo sempre um grupo ativo disponível para novos participantes.

## 🏗️ Stack

- **Node.js** + **TypeScript**
- **Fastify** (web framework)
- **PostgreSQL** (Supabase)
- **Axios** (HTTP client)
- **Evolution API** (WhatsApp gateway)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL (Supabase)
- Evolution API configurada
- Docker + Docker Swarm (para produção)

## 🚀 Instalação Local

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas credenciais
nano .env

# Executar em desenvolvimento
npm run dev
```

## ⚙️ Configuração

Edite o arquivo `.env` com as seguintes variáveis:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
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

### Produção (Build)

```bash
# Build
npm run build

# Start
npm start
```

### Docker (Desenvolvimento)

```bash
docker-compose up
```

### Docker Swarm (Produção)

Veja o guia completo em **[DEPLOY.md](./DEPLOY.md)**

## 📡 Endpoints

### 1. Endpoint Público - Join (Novo)

**GET** `/join?campaign=nome-da-campanha`

Retorna JSON com link do WhatsApp para enviar "ENTRAR".

**Exemplo:**
```bash
curl http://localhost:3000/join?campaign=descontinho
```

**Resposta de sucesso:**
```json
{
  "status": "success",
  "campaign": "descontinho",
  "campanha": "Descontinho Bom",
  "whatsapp": {
    "link": "https://wa.me/?text=ENTRAR",
    "text": "ENTRAR",
    "instruction": "Envie a palavra ENTRAR no WhatsApp para ser adicionado ao grupo"
  }
}
```

**Respostas de erro:**
- `400` - Parâmetro "campaign" obrigatório
- `404` - Campanha não encontrada

### 2. Webhook Evolution API

**POST** `/webhook/evolution`

Recebe eventos do Evolution API e processa mensagens "ENTRAR".

**Fluxo:**
1. Usuário envia "ENTRAR" no WhatsApp
2. Evolution API envia webhook para este endpoint
3. Sistema identifica o número do usuário
4. Adiciona usuário ao grupo ativo da campanha
5. Envia confirmação via WhatsApp

**Configuração no Evolution API:**
Configure o webhook para apontar para: `https://rotator.descontinbom.com.br/webhook/evolution`

### 3. Endpoint Público - Join (Legado)

**GET** `/join/:slug`

Redireciona para o grupo WhatsApp ativo (compatibilidade).

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

## 🐳 Deploy em Produção

**Para deploy completo em Docker Swarm, consulte: [DEPLOY.md](./DEPLOY.md)**

### Resumo Rápido

1. **Criar secrets no Swarm:**
   ```bash
   ./scripts/create-secrets.sh
   ```

2. **Deploy via Portainer:**
   - Stacks → Add Stack
   - Repository: `https://github.com/vandersonaxe-creator/rotator-whatsapp`
   - Compose path: `docker-compose.swarm.yml`

3. **Verificar:**
   ```bash
   docker service ls | grep rotator
   curl https://rotator.descontinbom.com.br/health
   ```

## 📝 Notas Importantes

- Todas as queries SQL usam explicitamente o schema `rotator`
- A rotação usa transações PostgreSQL com `SELECT ... FOR UPDATE` para evitar race conditions
- O endpoint público nunca lança exceções, sempre retorna HTML amigável em caso de erro
- O Evolution API client tem timeout de 8s e retry simples (1 tentativa)
- O endpoint interno é protegido por token via header `x-internal-token`
- O código suporta Docker Swarm secrets via `_FILE` suffix

## 🔒 Segurança

- ✅ Secrets do Docker Swarm (não expostos em env vars)
- ✅ HTTPS via Traefik (Let's Encrypt)
- ✅ Token interno para endpoints protegidos
- ✅ Healthcheck isolado
- ✅ Usuário não-root no container

## 📚 Arquivos Importantes

- `docker-compose.swarm.yml` → Configuração para Swarm (PRODUÇÃO)
- `docker-compose.yml` → Desenvolvimento local
- `Dockerfile` → Build da imagem
- `src/config/env.ts` → Carregador de env/secrets
- `DEPLOY.md` → Guia completo de deploy

## 📄 Licença

ISC

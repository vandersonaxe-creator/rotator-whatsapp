# 🎯 MVP - Implementação Final

## ✅ Critérios de Aceite

### 1. Endpoint `/join/:slug` (NÃO MEXER)
- ✅ Mantido como está: `302` redirect + `Cache-Control: no-store`
- ✅ Apenas lookup no Postgres e redirect para `invite_url`
- ✅ Link de anúncios que nunca muda

**Teste:**
```bash
curl -I https://rotator.descontinbom.com.br/join/descontinho
# Deve retornar: 302 + Cache-Control: no-store + Location: invite_url
```

### 2. Endpoint `/join/:slug/page` (NOVO)
- ✅ Retorna HTML leve (200)
- ✅ Botão "Abrir no WhatsApp" para o `invite_url` do grupo ativo
- ✅ Auto-forward após 2 segundos
- ✅ Headers: `Cache-Control: no-store`, `Pragma: no-cache`, `Expires: 0`, `X-Robots-Tag: noindex, nofollow`
- ✅ Sem Evolution, sem lógica pesada, só DB

**Teste:**
```bash
curl -I https://rotator.descontinbom.com.br/join/descontinho/page
# Deve retornar: 200 + HTML + headers corretos
```

### 3. Bootstrap Participants
- ✅ Campo `bootstrap_participants text[]` adicionado na tabela `rotator.wa_group_pools`
- ✅ Migração criada: `migrations/002_add_bootstrap_participants.sql`
- ✅ Pool `descontinho` populado com: `['5521979197180', '5522992379748']`
- ✅ Rotate usa `bootstrap_participants` do DB (não hardcoded)
- ✅ Validação: mínimo 2 participantes

**Teste:**
- Criar grupo via rotate deve usar os números do DB
- Grupo não pode ser criado vazio (sempre com 2+ participantes)

### 4. Webhook ENTRAR
- ✅ Desabilitado no MVP (comentado no `app.ts`)
- ✅ Não faz parte do deploy de hoje
- ✅ Mantido em branch separada para futuro

---

## 📋 Mudanças Implementadas

### 1. Migração SQL
**Arquivo:** `migrations/002_add_bootstrap_participants.sql`
```sql
ALTER TABLE rotator.wa_group_pools
ADD COLUMN bootstrap_participants text[] NOT NULL DEFAULT '{}'::text[];
```

### 2. Tipo TypeScript
**Arquivo:** `src/types/index.ts`
- Adicionado `bootstrap_participants: string[]` em `WaGroupPool`

### 3. Endpoint `/join/:slug/page`
**Arquivo:** `src/rotator/routes/join.routes.ts`
- Novo endpoint retornando HTML leve
- Headers corretos (no-store, no-cache, expires, x-robots-tag)
- Auto-forward após 2 segundos
- Botão "Abrir no WhatsApp"

### 4. Rotate Service
**Arquivo:** `src/rotator/services/joinPoolRotator.service.ts`
- Lê `bootstrap_participants` do pool
- Valida mínimo 2 participantes
- Passa para `createGroup` da Evolution API

### 5. Evolution Client
**Arquivo:** `src/rotator/services/evolution.client.ts`
- `createGroup` agora aceita `participants` como parâmetro
- Fallback para números padrão se não fornecido

### 6. Seed SQL
**Arquivo:** `migrations/seed.sql`
- Pool `descontinho` populado com:
  ```sql
  bootstrap_participants = ARRAY['5521979197180', '5522992379748']
  ```

### 7. App.ts
**Arquivo:** `src/app.ts`
- Webhook ENTRAR desabilitado (comentado)
- Não registrado no MVP

---

## 🚀 Deploy

### 1. Executar Migração
```bash
psql -d seu_banco -f migrations/002_add_bootstrap_participants.sql
```

### 2. Atualizar Seed (se necessário)
```bash
psql -d seu_banco -f migrations/seed.sql
```

### 3. Build e Deploy
```bash
# Build
npm run build

# Deploy (Docker Swarm)
docker build -t rotator-grupos:latest .
docker service update --image rotator-grupos:latest rotator-grupos_rotator-grupos
```

---

## ✅ Checklist de Validação

- [x] `/join/:slug` retorna 302 + no-store + location invite
- [x] `/join/:slug/page` retorna 200 HTML + no-store + x-robots-tag
- [x] Migração `bootstrap_participants` criada
- [x] Tipo TypeScript atualizado
- [x] Rotate usa `bootstrap_participants` do DB
- [x] Seed populado com números corretos
- [x] Webhook ENTRAR desabilitado
- [x] Build passando sem erros
- [x] Sem linter errors

---

## 📝 Notas

- **Endpoint `/join/:slug`**: NÃO MEXER - é o link de anúncios
- **Endpoint `/join/:slug/page`**: Nova rota de UX com HTML leve
- **Bootstrap Participants**: Configurado por pool no DB
- **Webhook ENTRAR**: Desabilitado no MVP, mantido para futuro

---

**MVP pronto para deploy!** 🎉

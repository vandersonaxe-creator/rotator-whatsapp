# 🚀 Deploy Checklist - MVP Join A

## ✅ 1. CONFIRMAÇÃO DE CONTRATOS (NÃO ALTERAR)

### ✅ GET `/join/:slug`
**Status:** ✅ CONFIRMADO - Sem alterações
- **Resposta:** `302` redirect
- **Headers:** `Cache-Control: no-store`
- **Lógica:** Lookup DB + redirect para `invite_url`
- **Propósito:** Link de anúncios imutável

**Código:** `src/rotator/routes/join.routes.ts` (linhas 70-133)

### ✅ GET `/join/:slug/page`
**Status:** ✅ CONFIRMADO - Sem alterações
- **Resposta:** `200` HTML
- **Conteúdo:** Botão "Abrir no WhatsApp" + auto-forward (2s)
- **Headers:** 
  - `Cache-Control: no-store`
  - `Pragma: no-cache`
  - `Expires: 0`
  - `X-Robots-Tag: noindex, nofollow`

**Código:** `src/rotator/routes/join.routes.ts` (linhas 136-371)

### ✅ Webhook "ENTRAR"
**Status:** ✅ DESABILITADO - Não entra no deploy
- **Código:** Comentado em `src/app.ts`
- **Não registrado:** `webhookRoutes` não é importado/registrado

---

## 📦 2. APLICAR MIGRAÇÕES NO BANCO (PRODUÇÃO)

### Passo 1: Executar Migração
```bash
# Conectar ao banco de produção (Supabase)
psql -h <host> -U <user> -d <database> -f migrations/002_add_bootstrap_participants.sql
```

**Arquivo:** `migrations/002_add_bootstrap_participants.sql`
```sql
ALTER TABLE rotator.wa_group_pools
ADD COLUMN IF NOT EXISTS bootstrap_participants text[] NOT NULL DEFAULT '{}'::text[];

UPDATE rotator.wa_group_pools
SET bootstrap_participants = ARRAY['+5521979197180', '+5522992379748']
WHERE slug = 'descontinho';
```

### Passo 2: Executar Seed (se necessário)
```bash
# Apenas se o pool descontinho não existir
psql -h <host> -U <user> -d <database> -f migrations/seed.sql
```

### Passo 3: Validar no DB
```sql
SELECT slug, bootstrap_participants
FROM rotator.wa_group_pools
WHERE slug = 'descontinho';
```

**✅ Esperado:**
```
slug        | bootstrap_participants
------------+------------------------
descontinho | {+5521979197180,+5522992379748}
```

**✅ Checklist:**
- [ ] Migração executada sem erros
- [ ] Campo `bootstrap_participants` existe na tabela
- [ ] Pool `descontinho` tem 2 números preenchidos
- [ ] Validação SQL retorna resultado esperado

---

## 🐳 3. DEPLOY NO SWARM (PRODUÇÃO)

### Passo 1: Preparar Servidor
```bash
# SSH no servidor (manager node)
ssh user@servidor

# Navegar para o diretório
cd rotator-whatsapp
```

### Passo 2: Atualizar Código
```bash
# Pull latest
git pull origin main

# Verificar branch
git branch
# Deve estar em: main
```

### Passo 3: Build da Imagem
```bash
# Build
docker build -t rotator-grupos:latest .

# Verificar imagem criada
docker images | grep rotator-grupos
```

### Passo 4: Deploy no Swarm
```bash
# Atualizar serviço
docker service update --image rotator-grupos:latest rotator-grupos_rotator-grupos

# Aguardar alguns segundos
sleep 10
```

### Passo 5: Verificar Status
```bash
# Ver status do serviço
docker service ls | grep rotator

# Ver tasks
docker service ps rotator-grupos_rotator-grupos

# Verificar logs
docker service logs --tail 50 rotator-grupos_rotator-grupos
```

**✅ Checklist:**
- [ ] Código atualizado (git pull)
- [ ] Imagem buildada com sucesso
- [ ] Serviço atualizado no Swarm
- [ ] Status: 1/1 replicas rodando
- [ ] Logs sem erros críticos

---

## 🧪 4. SMOKE TESTS OBRIGATÓRIOS (PÓS-DEPLOY)

### Teste 1: Redirect (Campanhas)
```bash
curl -I https://rotator.descontinbom.com.br/join/descontinho
```

**✅ Esperado:**
```
HTTP/2 302
cache-control: no-store
location: https://chat.whatsapp.com/...
```

**✅ Checklist:**
- [ ] Status: `302`
- [ ] Header: `cache-control: no-store`
- [ ] Header: `location` aponta para `https://chat.whatsapp.com/...`

---

### Teste 2: Página (UX)
```bash
curl -I https://rotator.descontinbom.com.br/join/descontinho/page
```

**✅ Esperado:**
```
HTTP/2 200
content-type: text/html
cache-control: no-store
pragma: no-cache
expires: 0
x-robots-tag: noindex, nofollow
```

**✅ Checklist:**
- [ ] Status: `200`
- [ ] Content-Type: `text/html`
- [ ] Header: `cache-control: no-store`
- [ ] Header: `pragma: no-cache`
- [ ] Header: `expires: 0`
- [ ] Header: `x-robots-tag: noindex, nofollow`

---

### Teste 3: Rotate Manual (com token interno)
```bash
# Definir token (substituir pelo token real)
export INTERNAL_TOKEN="seu-token-interno"

# Executar rotate
curl -sS -X POST "https://rotator.descontinbom.com.br/internal/join-pools/descontinho/rotate" \
  -H "x-internal-token: $INTERNAL_TOKEN"
```

**✅ Esperado:**
```json
{
  "ok": true,
  "result": {
    "ok": true
  }
}
```

**✅ Checklist:**
- [ ] Status: `200`
- [ ] Resposta JSON com `ok: true`
- [ ] Nenhum erro de validação

---

### Teste 4: Verificar Logs
```bash
# Ver logs em tempo real
docker service logs -f rotator-grupos_rotator-grupos

# Ou últimas 100 linhas
docker service logs --tail 100 rotator-grupos_rotator-grupos
```

**✅ Esperado:**
- ✅ Nenhuma ocorrência de: `EvolutionClient.createGroup requer >= 2 participants`
- ✅ Nenhuma ocorrência de: `Pool descontinho precisa de pelo menos 2 bootstrap_participants`
- ✅ Logs de sucesso: `Server listening on port 3000`
- ✅ Rotate executado sem erros

**✅ Checklist:**
- [ ] Logs sem erros de `createGroup requer >= 2 participants`
- [ ] Logs sem erros de `bootstrap_participants`
- [ ] Servidor iniciado corretamente
- [ ] Rotate funcionando

---

## ✅ 5. CONCLUSÃO

### Status Final

**✅ MVP em Produção:**
- [ ] Todos os contratos confirmados
- [ ] Migrações aplicadas no banco
- [ ] Deploy executado no Swarm
- [ ] Todos os smoke tests passando
- [ ] Logs sem erros críticos

### Próximos Passos (se tudo OK)

1. ✅ **MVP Join A concluído**
2. ✅ **Ciclo de hoje encerrado**
3. ✅ **Sistema pronto para uso**

### Se Algum Teste Falhar

1. **Verificar logs:** `docker service logs -f rotator-grupos_rotator-grupos`
2. **Verificar banco:** Confirmar `bootstrap_participants` preenchido
3. **Verificar código:** Confirmar que não houve alterações não intencionais
4. **Rollback (se necessário):** `docker service rollback rotator-grupos_rotator-grupos`

---

## 📝 Notas Finais

- ✅ **NÃO fazer mais mudanças de escopo**
- ✅ **Apenas executar deploy e validações**
- ✅ **Webhook ENTRAR continua desabilitado**
- ✅ **Contratos imutáveis: `/join/:slug` e `/join/:slug/page`**

---

**Pronto para deploy!** 🚀

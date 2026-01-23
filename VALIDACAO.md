# ✅ Validação de Sanidade - MVP

## 📋 Assinatura Atual do Método `createGroup`

**Arquivo:** `src/rotator/services/evolution.client.ts`

```typescript
async createGroup(
  instance: string,
  subject: string,
  participants: string[] = []
): Promise<EvolutionCreateGroupResponse>
```

**Payload enviado para Evolution API:**
```typescript
{
  subject: string,
  participants: string[]  // Array de números de telefone
}
```

**Endpoint:** `POST /group/create/${instance}`

---

## ✅ Check de Sanidade

### 1. Rotate passa os dois números? ✅

**Arquivo:** `src/rotator/services/joinPoolRotator.service.ts`

```typescript
// Linha 39-45
const bootstrapParticipants = groupPool.bootstrap_participants || [];

if (bootstrapParticipants.length < 2) {
  throw new Error(`Pool ${slug} precisa de pelo menos 2 bootstrap_participants configurados`);
}

// Linha 48-52
const evolutionGroup = await this.evolutionClient.createGroup(
  groupPool.instance_name,
  groupTitle,
  bootstrapParticipants  // ✅ Passa array do DB
);
```

**✅ CONFIRMADO:** O rotate lê `bootstrap_participants` do pool e passa diretamente para `createGroup`. Não depende de participante manual.

---

### 2. `/join/:slug` continua "burro e rápido"? ✅

**Arquivo:** `src/rotator/routes/join.routes.ts`

```typescript
// Linha 70-113
fastify.get<{ Params: { slug: string } }>('/join/:slug', async (request, reply) => {
  // 1. Query simples no Postgres
  const poolResult = await fastify.pg.query<WaGroupPool>(
    `SELECT * FROM rotator.wa_group_pools WHERE slug = $1`,
    [slug]
  );
  
  // 2. Busca grupo ativo
  const groupResult = await fastify.pg.query<WaGroup>(
    `SELECT * FROM rotator.wa_groups WHERE id = $1 AND status = 'ACTIVE'`,
    [pool.current_group_id]
  );
  
  // 3. Redirect 302
  return reply
    .code(302)
    .header('Cache-Control', 'no-store')
    .redirect(group.invite_url);
});
```

**✅ CONFIRMADO:** 
- Apenas 2 queries SQL simples
- Sem chamadas à Evolution API
- Sem lógica pesada
- Apenas lookup + redirect

---

### 3. `/join/:slug/page` não tem dependência externa? ✅

**Arquivo:** `src/rotator/routes/join.routes.ts`

```typescript
// Linha 138-371
fastify.get<{ Params: { slug: string } }>('/join/:slug/page', async (request, reply) => {
  // 1. Query simples no Postgres
  const poolResult = await fastify.pg.query<WaGroupPool>(
    `SELECT * FROM rotator.wa_group_pools WHERE slug = $1`,
    [slug]
  );
  
  // 2. Busca grupo ativo
  const groupResult = await fastify.pg.query<WaGroup>(
    `SELECT * FROM rotator.wa_groups WHERE id = $1 AND status = 'ACTIVE'`,
    [pool.current_group_id]
  );
  
  // 3. Retorna HTML estático com invite_url
  return reply.send(html);
});
```

**✅ CONFIRMADO:**
- Apenas queries SQL no Postgres
- Sem chamadas à Evolution API
- Sem dependências externas
- HTML estático gerado

---

## 🔧 Formato dos Números

**Estado atual:**
- **DB (migração):** `['+5521979197180', '+5522992379748']` (com `+`)
- **DB (seed):** `['+5521979197180', '+5522992379748']` (com `+`)
- **Código:** Passa direto do DB para Evolution API (sem transformação)

**⚠️ NOTA:** O código atualmente passa os números exatamente como vêm do DB. Se a Evolution espera sem `+`, precisamos normalizar. Aguardando confirmação do formato esperado pela Evolution API.

---

## 📝 Próximo Passo

Aguardando patch cirúrgico do trecho que injeta `bootstrap_participants` no `createGroup`, baseado na assinatura atual mostrada acima.

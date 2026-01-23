# ✅ Patch Cirúrgico Aplicado

## 📋 Mudanças em `src/rotator/services/evolution.client.ts`

### ✅ Removido
- ❌ Fallback hardcoded: `['5522992379748', '5521980967727']`
- ❌ Lógica condicional que usava fallback se `participants.length < 2`

### ✅ Adicionado
- ✅ Método `normalizeParticipant(p: string)`: Remove caracteres não numéricos
- ✅ Método `normalizeParticipants(participants: string[])`: Normaliza array completo
- ✅ Validação explícita: Lança erro se `groupParticipants.length < 2`
- ✅ Mensagem de erro clara orientando a configurar `bootstrap_participants` no pool

---

## 🔧 Comportamento Atual

### Normalização
- **Entrada:** `['+5521979197180', '+5522992379748']`
- **Saída:** `['5521979197180', '5522992379748']` (sem `+`)

- **Entrada:** `['5521979197180', '5522992379748']`
- **Saída:** `['5521979197180', '5522992379748']` (mantém)

- **Entrada:** `['+55 (21) 97919-7180', '+55 22 99237-9748']`
- **Saída:** `['5521979197180', '5522992379748']` (remove formatação)

### Validação
- ✅ Se `participants.length < 2` após normalização → **Erro explícito**
- ✅ Mensagem: `"EvolutionClient.createGroup requer >= 2 participants (recebido: X). Configure bootstrap_participants no pool."`

---

## ✅ Critérios de Aceite Atendidos

### 1. `createGroup(instance, subject, ['+5521979197180', '+5522992379748'])`
**Payload enviado:**
```json
{
  "subject": "...",
  "participants": ["5521979197180", "5522992379748"]
}
```
✅ **CONFIRMADO:** Remove `+` e envia apenas dígitos

### 2. `createGroup(..., [])`
**Erro lançado:**
```
EvolutionClient.createGroup requer >= 2 participants (recebido: 0). Configure bootstrap_participants no pool.
```
✅ **CONFIRMADO:** Falha com erro claro (não usa fallback)

---

## 📝 Código Final

```typescript
private normalizeParticipant(p: string): string {
  // Aceita E.164 com "+" ou sem; remove caracteres não numéricos.
  // Ex: "+55 (21) 97919-7180" -> "5521979197180"
  return (p ?? "").toString().trim().replace(/\D/g, "");
}

private normalizeParticipants(participants: string[]): string[] {
  return (participants ?? [])
    .map((p) => this.normalizeParticipant(p))
    .filter((p) => p.length > 0);
}

async createGroup(
  instance: string,
  subject: string,
  participants: string[] = []
): Promise<EvolutionCreateGroupResponse> {
  return this.requestWithRetry(async () => {
    try {
      const groupParticipants = this.normalizeParticipants(participants);
      if (groupParticipants.length < 2) {
        throw new Error(
          `EvolutionClient.createGroup requer >= 2 participants (recebido: ${groupParticipants.length}). ` +
          `Configure bootstrap_participants no pool.`
        );
      }
      
      const response = await this.client.post<EvolutionCreateGroupResponse>(
        `/group/create/${instance}`,
        {
          subject,
          participants: groupParticipants,
        }
      );
      return response.data;
    } catch (error: any) {
      // ... error handling
    }
  });
}
```

---

## ✅ Status

- ✅ Patch aplicado
- ✅ Build passando
- ✅ Sem linter errors
- ✅ Critérios de aceite atendidos
- ✅ Sem números "mágicos" hardcoded
- ✅ Normalização robusta (aceita qualquer formato)
- ✅ Erro explícito quando < 2 participantes

**Pronto para commit!** 🎉

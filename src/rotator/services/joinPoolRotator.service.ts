import { FastifyInstance } from 'fastify';
import { EvolutionClient } from './evolution.client';

export class JoinPoolRotatorService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly evolutionClient: EvolutionClient
  ) {}

  async rotatePool(slug: string) {
    // ✅ USAR O CLIENTE CORRETO DO FASTIFY
    const client = await this.app.pg.connect();

    try {
      await client.query('BEGIN');

      // 1️⃣ Buscar o pool com lock
      const poolRes = await client.query(
        `
        select *
        from rotator.wa_group_pools
        where slug = $1
        for update
        `,
        [slug]
      );

      if (poolRes.rowCount === 0) {
        throw new Error(`Pool not found: ${slug}`);
      }

      const groupPool = poolRes.rows[0];

      // 2️⃣ Se não existe grupo ativo, criar o #01
      if (!groupPool.current_group_id) {
        const sequence = groupPool.next_sequence;
        const groupTitle = `${groupPool.title} #${String(sequence).padStart(2, '0')}`;

        // 3️⃣ Obter bootstrap_participants do pool (mínimo 2 participantes)
        const bootstrapParticipants = groupPool.bootstrap_participants || [];
        
        // Validar que temos pelo menos 2 participantes
        if (bootstrapParticipants.length < 2) {
          throw new Error(`Pool ${slug} precisa de pelo menos 2 bootstrap_participants configurados`);
        }

        // 4️⃣ Criar grupo na Evolution com bootstrap_participants
        const evolutionGroup = await this.evolutionClient.createGroup(
          groupPool.instance_name,
          groupTitle,
          bootstrapParticipants
        );

        // A Evolution retorna 'id' (não 'gid')
        const groupJid = evolutionGroup?.id || evolutionGroup?.gid;

        if (!groupJid) {
          throw new Error(`Invalid Evolution response: ${JSON.stringify(evolutionGroup)}`);
        }

        // 4️⃣ Aplicar foto se fornecida
        if (groupPool.photo_url) {
          try {
            await this.evolutionClient.setGroupPhoto(
              groupPool.instance_name,
              groupJid,
              groupPool.photo_url
            );
          } catch (error) {
            console.warn(`Failed to set group photo: ${error}`);
          }
        }

        // 5️⃣ Aplicar descrição se fornecida
        if (groupPool.description) {
          try {
            await this.evolutionClient.setGroupDescription(
              groupPool.instance_name,
              groupJid,
              groupPool.description
            );
          } catch (error) {
            console.warn(`Failed to set group description: ${error}`);
          }
        }

        // 6️⃣ Aplicar announcement (só admins enviam mensagens)
        try {
          await this.evolutionClient.updateGroupSetting(
            groupPool.instance_name,
            groupJid,
            'announcement'
          );
          console.log(`[Rotate] ${slug} #${String(sequence).padStart(2, '0')}: announcement aplicado`);
        } catch (error) {
          console.warn(`Failed to set announcement: ${error}`);
        }

        // Log de ações aplicadas
        console.log(`[Rotate] ${slug} #${String(sequence).padStart(2, '0')}: grupo criado`, {
          photoApplied: !!groupPool.photo_url,
          descriptionApplied: !!groupPool.description,
          announcement: true,
        });

        // 8️⃣ Criar invite (chamada separada)
        const inviteResponse = await this.evolutionClient.createInvite(
          groupPool.instance_name,
          groupJid
        );

        // Extrair inviteUrl do retorno
        const inviteUrl = inviteResponse?.inviteUrl || 
                         inviteResponse?.url || 
                         (inviteResponse?.code ? `https://chat.whatsapp.com/${inviteResponse.code}` : null);

        if (!inviteUrl) {
          throw new Error('Failed to generate invite link');
        }

        // 9️⃣ Inserir grupo no banco
        const groupRes = await client.query(
          `
          insert into rotator.wa_groups
            (pool_id, sequence, wa_group_jid, invite_url, member_count, status, created_at, updated_at)
          values
            ($1, $2, $3, $4, $5, 'ACTIVE', now(), now())
          returning id
          `,
          [
            groupPool.id,
            sequence,
            groupJid,
            inviteUrl,
            evolutionGroup.size || 0,
          ]
        );

        const groupId = groupRes.rows[0].id;

        // 🔟 Atualizar pool
        await client.query(
          `
          update rotator.wa_group_pools
          set current_group_id = $1,
              next_sequence = $2,
              updated_at = now()
          where id = $3
          `,
          [groupId, sequence + 1, groupPool.id]
        );
      }

      await client.query('COMMIT');
      return { ok: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

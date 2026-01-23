import { FastifyInstance } from 'fastify';
import { EvolutionClient } from './evolution.client';
import { WaGroupPool, WaGroup } from '../../types';

/**
 * Serviço para gerenciar entrada de usuários em grupos
 */
export class JoinService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly evolutionClient: EvolutionClient
  ) {}

  /**
   * Processa mensagem "ENTRAR" e adiciona usuário ao grupo
   * @param instance Nome da instância
   * @param participantPhone Número do telefone (formato: 5521999999999)
   * @param campaign Slug da campanha (opcional, se não fornecido, usa o primeiro pool disponível)
   */
  async processJoinRequest(
    instance: string,
    participantPhone: string,
    campaign?: string
  ): Promise<{ success: boolean; message: string; groupJid?: string }> {
    const client = await this.app.pg.connect();

    try {
      await client.query('BEGIN');

      // 1. Buscar pool (por campaign/slug ou primeiro disponível)
      let poolQuery: string;
      let poolParams: any[];

      if (campaign) {
        poolQuery = `SELECT * FROM rotator.wa_group_pools WHERE slug = $1 AND instance_name = $2`;
        poolParams = [campaign, instance];
      } else {
        // Se não tiver campaign, busca o primeiro pool da instância
        poolQuery = `SELECT * FROM rotator.wa_group_pools WHERE instance_name = $1 LIMIT 1`;
        poolParams = [instance];
      }

      const poolResult = await client.query<WaGroupPool>(poolQuery, poolParams);

      if (poolResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'Campanha não encontrada ou instância não configurada',
        };
      }

      const pool = poolResult.rows[0];

      // 2. Verificar se existe grupo ativo
      if (!pool.current_group_id) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'Nenhum grupo ativo disponível no momento. Tente novamente em instantes.',
        };
      }

      // 3. Buscar grupo ativo
      const groupResult = await client.query<WaGroup>(
        `SELECT * FROM rotator.wa_groups 
         WHERE id = $1 AND status = 'ACTIVE'`,
        [pool.current_group_id]
      );

      if (groupResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'Grupo ativo não encontrado',
        };
      }

      const group = groupResult.rows[0];

      // 4. Verificar se grupo não está cheio
      if (group.member_count >= pool.threshold) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'Grupo está cheio. Uma nova rotação será feita em breve.',
        };
      }

      // 5. Adicionar participante ao grupo via Evolution API
      try {
        await this.evolutionClient.addParticipant(
          instance,
          group.wa_group_jid,
          participantPhone
        );

        // 6. Atualizar contador de membros (opcional - pode ser atualizado via webhook também)
        // Por enquanto, incrementamos manualmente
        await client.query(
          `UPDATE rotator.wa_groups 
           SET member_count = member_count + 1, updated_at = now() 
           WHERE id = $1`,
          [group.id]
        );

        await client.query('COMMIT');

        return {
          success: true,
          message: `Você foi adicionado ao grupo ${pool.title}!`,
          groupJid: group.wa_group_jid,
        };
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error adding participant to group:', error);
        return {
          success: false,
          message: 'Erro ao adicionar ao grupo. Tente novamente.',
        };
      }
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('Error in processJoinRequest:', error);
      return {
        success: false,
        message: 'Erro interno. Tente novamente mais tarde.',
      };
    } finally {
      client.release();
    }
  }
}

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { JoinPoolRotatorService } from '../services/joinPoolRotator.service';
import { EvolutionClient } from '../services/evolution.client';

const internalRotateRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

  if (!INTERNAL_TOKEN) {
    throw new Error('INTERNAL_TOKEN environment variable is required');
  }

  // EvolutionClient conforme implementação atual (sem args)
  const evolutionClient = new EvolutionClient();

  fastify.post<{
    Params: { slug: string };
  }>('/internal/join-pools/:slug/rotate', async (request, reply) => {
    const { slug } = request.params;
    const token = request.headers['x-internal-token'];

    // 🔐 Validação do token interno
    if (token !== INTERNAL_TOKEN) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      // 🔎 Logs de contexto
      console.log('[ROTATE] slug:', slug);
      console.log('[ROTATE] fastify.pg exists?', !!fastify.pg);

      if (!fastify.pg) {
        throw new Error('fastify.pg is undefined (Postgres not registered)');
      }

      // Service criado de forma lazy (assinatura correta)
      const service = new JoinPoolRotatorService(
        fastify,
        evolutionClient
      );

      const result = await service.rotatePool(slug);

      return reply.send({
        ok: true,
        result,
      });
    } catch (err: any) {
      // 🔥 LOG COMPLETO DO ERRO REAL
      console.error('========== ROTATE ERROR ==========');
      console.error(err);
      console.error('==================================');

      return reply.code(500).send({
        error: 'Rotation failed',
        message: err?.message,
        stack: err?.stack,
      });
    }
  });
};

export default internalRotateRoutes;

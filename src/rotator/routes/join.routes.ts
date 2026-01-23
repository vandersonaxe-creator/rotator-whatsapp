import { FastifyPluginAsync } from 'fastify';
import { WaGroupPool, WaGroup } from '../../types';

const joinRoutes: FastifyPluginAsync = async (fastify) => {
  // Novo endpoint: GET /join?campaign=nome-da-campanha
  // Retorna JSON com link do WhatsApp para enviar "ENTRAR"
  fastify.get<{ Querystring: { campaign?: string } }>('/join', async (request, reply) => {
    const { campaign } = request.query;

    // Se não tiver campaign, retorna erro
    if (!campaign) {
      return reply.code(400).send({
        status: 'error',
        message: 'Parâmetro "campaign" é obrigatório',
      });
    }

    try {
      // Buscar pool pelo slug (campaign = slug)
      const poolResult = await fastify.pg.query<WaGroupPool>(
        `SELECT * FROM rotator.wa_group_pools WHERE slug = $1`,
        [campaign]
      );

      if (poolResult.rows.length === 0) {
        return reply.code(404).send({
          status: 'error',
          message: 'Campanha não encontrada',
          campaign,
        });
      }

      const pool = poolResult.rows[0];

      // Gerar link do WhatsApp com texto "ENTRAR"
      // O número da instância deve estar configurado no pool ou em uma tabela separada
      // Por enquanto, vamos usar um formato genérico que funciona com qualquer número
      // O webhook vai processar a mensagem independente do número usado
      
      // Link do WhatsApp: wa.me com texto codificado
      // Formato: https://wa.me/5511999999999?text=ENTRAR
      // Como não temos o número da instância no banco ainda, vamos retornar um link genérico
      // que o frontend pode usar, ou podemos adicionar o número ao pool depois
      const whatsappText = encodeURIComponent('ENTRAR');
      
      // TODO: Adicionar campo phone_number ao wa_group_pools ou buscar da Evolution API
      // Por enquanto, retornamos um link genérico que precisa ser configurado
      // O usuário pode usar qualquer número da instância
      const whatsappLink = `https://wa.me/?text=${whatsappText}`;

      return reply.code(200).send({
        status: 'success',
        campaign: campaign,
        campanha: pool.title,
        whatsapp: {
          link: whatsappLink,
          text: 'ENTRAR',
          instruction: 'Envie a palavra ENTRAR no WhatsApp para ser adicionado ao grupo',
        },
      });
    } catch (error: any) {
      console.error('Error in /join endpoint:', error);
      return reply.code(500).send({
        status: 'error',
        message: 'Erro interno do servidor',
      });
    }
  });

  // Endpoint antigo mantido para compatibilidade: GET /join/:slug
  fastify.get<{ Params: { slug: string } }>('/join/:slug', async (request, reply) => {
    const { slug } = request.params;

    try {
      // Query pool by slug
      const poolResult = await fastify.pg.query<WaGroupPool>(
        `SELECT * FROM rotator.wa_group_pools WHERE slug = $1`,
        [slug]
      );

      if (poolResult.rows.length === 0) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      const pool = poolResult.rows[0];

      // If no current group, return HTML
      if (!pool.current_group_id) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      // Get active group
      const groupResult = await fastify.pg.query<WaGroup>(
        `SELECT * FROM rotator.wa_groups 
         WHERE id = $1 AND status = 'ACTIVE'`,
        [pool.current_group_id]
      );

      if (groupResult.rows.length === 0 || !groupResult.rows[0].invite_url) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      const group = groupResult.rows[0];

      // Redirect to invite URL
      if (!group.invite_url) {
        return reply
          .code(200)
          .header('Cache-Control', 'no-store')
          .type('text/html')
          .send(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Grupo Indisponível</title>
            </head>
            <body>
              <h1>Grupo temporariamente indisponível.</h1>
              <p>Tente novamente em instantes.</p>
            </body>
            </html>
          `);
      }

      return reply
        .code(302)
        .header('Cache-Control', 'no-store')
        .redirect(group.invite_url);
    } catch (error) {
      // Never throw exception, always return HTML
      return reply
        .code(200)
        .header('Cache-Control', 'no-store')
        .type('text/html')
        .send(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Grupo Indisponível</title>
          </head>
          <body>
            <h1>Grupo temporariamente indisponível.</h1>
            <p>Tente novamente em instantes.</p>
          </body>
          </html>
        `);
    }
  });
};

export default joinRoutes;

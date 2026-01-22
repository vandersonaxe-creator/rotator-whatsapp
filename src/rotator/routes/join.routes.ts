import { FastifyPluginAsync } from 'fastify';
import { WaGroupPool, WaGroup } from '../../types';

const joinRoutes: FastifyPluginAsync = async (fastify) => {
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
